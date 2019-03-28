(function() {
  function PromiseHandler() {
    var sup = bu.internal.GlobalExternalHandler();

    //builtin functions
    var promiseOriginal = null;
    var thenOriginal = null;
    var catchOriginal = null;

    //in order to avoid infinite recursion while creating the 'catcher', a 'lock'
    //is used
    var creatingHandler = false;

    return bu.internal.mixin(sup, {
      install() {
        sup.install();
        var self = this;

        promiseOriginal = Promise;

        thenOriginal = Promise.prototype.then;
        catchOriginal = Promise.prototype.catch;

        Promise = function(arg) { //jshint ignore:line
          var instance = new promiseOriginal(arg);
          if (!creatingHandler) {
            creatingHandler = true;
            var ctx = bu.internal.getCurrCtx();

            catchOriginal.call(instance, error => {
              if (instance.$bu$ !== undefined && !instance.$bu$.hasCatcher) {
                self.getSpecificHandler(ctx).fire({
                  name: 'error',
                  error,
                  promise: instance
                });
              }
            });

            instance.$bu$ = {
              hasCatcher: false
            };

            creatingHandler = false;
          }
          //if a constructor returns an object in a new expression, it will
          //replace the result of the new expression.
          return instance;
        };
        for (var name of Object.getOwnPropertyNames(promiseOriginal)) {
          var desc = Object.getOwnPropertyDescriptor(promiseOriginal, name);
          Object.defineProperty(Promise, name, desc);
        }

        Promise.prototype.constructor = Promise;

        Promise.prototype.then = function(resolve, reject) {
          if (this.$bu$ !== undefined) {
            this.$bu$.hasCatcher = true;
          }
          return thenOriginal.apply(this, arguments);
        };

        Promise.prototype.catch = function() {
          if (this.$bu$ !== undefined) {
            this.$bu$.hasCatcher = true;
          }
          return catchOriginal.apply(this, arguments);
        };
      },
      cleanup() {
        sup.cleanup();
        Promise = promiseOriginal; //jshint ignore:line
        Promise.prototype.then = thenOriginal;
        Promise.prototype.catch = catchOriginal;
      }
    });
  }

  bu.internal.registerHandler('promise', PromiseHandler());
})();