(function(global) {
  /**
   * The base class for handlers that add callbacks.
   *
   * @param sup the GlobalExternalHandler superclass
   * @param options.obj the object under which the API that 'adds' a callback
   *    is defined. Defaults to the global scope
   * @param options.addName the name of the API which 'adds' a callback
   * @param options.addArgs optional. The arguments passed to the 'add' API
   * @param options.func optional. A function that takes the arguments passed
   *    to the API and returns the callback
   * @param options.params optional. A function that takes the arguments passed
        to the API and the callback. Returns the arguments that should be
        passed to the callback
   * @param options.addEvent A function that takes the current context and the
        arguments passed to the API and returns the add event to be fired
   **/
  bu.internal.BasicAddHandler = function(sup, options) {
    options = bu.internal.mixin({
      obj: global,
      addArgs: (self, args, cb) => [global, cb, args[0]],
      func: args => args[0],
      params: (apiArgs, cbArgs) => Array.prototype.slice.call(apiArgs, 2)
    }, options);

    var addOriginal = null;

    return bu.internal.mixin(sup, {
      install() {
        sup.install();
        addOriginal = options.obj[options.addName];
        var self = this;

        options.obj[options.addName] = function() {
          var ctx = bu.internal.getCurrCtx();
          var apiArgs = arguments;

          var event = options.addEvent(ctx, apiArgs);
          self.getSpecificHandler(ctx).fire(event);

          var func = options.func(apiArgs);

          var args = options.addArgs(this, arguments, function() {
            var cbArgs = arguments;
            try {
              ctx.run(() => {
                func.apply(this, options.params(apiArgs, cbArgs));
              });
            } catch (error) {
              self.getSpecificHandler(ctx).fire({
                name: 'error',
                ctx,
                error
              });
            }
          });
          return addOriginal.apply(args[0], args.slice(1));
        };
      }
    });
  };
})(window);