(function() {
  function overridenMethod(original) {
    return function() {
      if (this.$bu$ !== undefined) {
        this.$bu$.hasCatcher = true;
      }
      return original.apply(this, arguments);
    };
  }

  function PromiseHandler() {
    var sup = bu.internal.GlobalExternalHandler();

    //builtin functions
    var promiseOriginal = null;
    var thenOriginal = null;
    var catchOriginal = null;
    var finallyOriginal = null;

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
        finallyOriginal = Promise.prototype.finally;

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

        Promise.prototype.then = overridenMethod(thenOriginal);
        Promise.prototype.catch = overridenMethod(catchOriginal);
        Promise.prototype.finally = overridenMethod(finallyOriginal);
      },
      cleanup() {
        sup.cleanup();
        Promise = promiseOriginal; //jshint ignore:line
        Promise.prototype.then = thenOriginal;
        Promise.prototype.catch = catchOriginal;
        Promise.prototype.finally = finallyOriginal;
      }
    });
  }

  bu.internal.registerHandler('promise', PromiseHandler());
})();