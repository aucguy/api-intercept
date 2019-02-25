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
  function IntervalHandler() {
    var sup = bu.internal.GlobalExternalHandler();
    var setIntervalOriginal = null;

    return bu.internal.mixin(sup, {
      install() {
        sup.install();
        setIntervalOriginal = global.setInterval;
        clearIntervalOriginal = global.clearInterval;
        var self = this;

        global.setInterval = function(func, period) {
          var ctx = bu.internal.getCurrCtx();
          var args = Array.prototype.slice.call(arguments, 2);

          self.getSpecificHandler(ctx).fire({
            name: 'add',
            ctx,
            func,
            period,
            args
          });

          return setIntervalOriginal.call(global, () => {
            try {
              ctx.run(() => {
                func.apply(this, args);
              });
            } catch (error) {
              self.getSpecificHandler(ctx).fire({
                name: 'error',
                ctx,
                error
              });
            }
          }, period);
        };

        global.clearInterval = id => {
          var ctx = bu.internal.getCurrCtx();
          self.getSpecificHandler(ctx).fire({
            name: 'remove',
            ctx,
            id
          });
          clearIntervalOriginal.call(global, id);
        };
      }
    });
  }

  bu.internal.registerHandler('interval', IntervalHandler());
})(this);