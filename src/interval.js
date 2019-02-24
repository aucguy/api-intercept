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

        global.setInterval = (func, period) => {
          var ctx = bu.internal.getCurrCtx();
          return setIntervalOriginal.call(global, () => {
            try {
              ctx.run(func);
            } catch (error) {
              this.getSpecificHandler(ctx).fire({
                name: 'error',
                ctx,
                error
              });
            }
          }, period);
        };
      }
    });
  }

  bu.internal.registerHandler('interval', IntervalHandler());
})(this);