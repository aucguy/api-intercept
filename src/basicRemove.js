(function(global) {
  /**
   * The base class for handlers that remove callbacks.
   *
   * @param sup the GlobalExternalHandler superclass
   * @param options.obj the object under which the API that 'adds' a callback
   *    is defined. Defaults to the global scope
   * @param options.removeName the name of the API which 'removes' a callback
   * @param options.addEvent optional. A function that takes the current
        context and the arguments passed to the API and returns the remove
        event to be fired
   **/
  bu.internal.BasicRemoveHandler = function(sup, options) {
    options = bu.internal.mixin({
      obj: global,
      removeEvent: (ctx, args) => ({
        ctx,
        name: 'remove',
        id: args[0]
      })
    }, options);

    var removeOriginal = null;

    return bu.internal.mixin(sup, {
      install() {
        sup.install();
        removeOriginal = options.obj[options.removeName];
        var self = this;

        options.obj[options.removeName] = function() {
          var ctx = bu.internal.getCurrCtx();
          var handler = self.getSpecificHandler(ctx);

          if (handler !== null) {
            self.getSpecificHandler(ctx).fire(options.removeEvent(ctx, arguments));
          }

          removeOriginal.apply(this, arguments);
        };
      }
    });
  };
})(window);