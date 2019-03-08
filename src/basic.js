/**
 * The handler for 'interval'. This handles the setInterval browser API.
 *
 * Events:
 *  error:
 *    Fired when an uncaught exception occurs in a callback.
 *
 *    name: the string 'error'
 *    ctx: the execution context to which this event pertains
 *    error: the error thrown
 **/
(function(global) {
  function BasicHandler(options) {
    options = bu.internal.mixin({
      obj: global,
      addArgs: (self, args, cb) => [global, cb, args[0]],
      removeEvent: (ctx, args) => ({
        ctx,
        name: 'remove',
        id: args[0]
      }),
      func: args => args[0],
      params: args => Array.prototype.slice.call(args, 2)
    }, options);

    var sup = bu.internal.GlobalExternalHandler();
    var addOriginal = null;
    var removeOriginal = null;

    return bu.internal.mixin(sup, {
      install() {
        sup.install();
        addOriginal = options.obj[options.addName];
        removeOriginal = options.obj[options.removeName];
        var self = this;

        options.obj[options.addName] = function() {
          var ctx = bu.internal.getCurrCtx();

          var event = options.addEvent(ctx, arguments);
          self.getSpecificHandler(ctx).fire(event);

          var func = options.func(arguments);
          var params = options.params(arguments);

          var args = options.addArgs(this, arguments, () => {
            try {
              ctx.run(() => {
                func.apply(this, params);
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

        options.obj[options.removeName] = function() {
          var ctx = bu.internal.getCurrCtx();
          self.getSpecificHandler(ctx).fire(options.removeEvent(ctx, arguments));
          removeOriginal.apply(this, arguments);
        };
      }
    });
  }

  bu.internal.BasicHandler = BasicHandler;
})(this);