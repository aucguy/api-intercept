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
  function IntervalOrTimeoutHandler(setName, clearName, eventBuilder) {
    var sup = bu.internal.GlobalExternalHandler();
    var setOriginal = null;
    var clearOriginal = null;

    return bu.internal.mixin(sup, {
      install() {
        sup.install();
        setOriginal = global[setName];
        clearOriginal = global[clearName];
        var self = this;

        global[setName] = function(func, period) {
          var ctx = bu.internal.getCurrCtx();
          var args = Array.prototype.slice.call(arguments, 2);

          var event = eventBuilder(ctx, func, period, args);
          self.getSpecificHandler(ctx).fire(event);

          return setOriginal.call(global, () => {
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

        global[clearName] = id => {
          var ctx = bu.internal.getCurrCtx();
          self.getSpecificHandler(ctx).fire({
            name: 'remove',
            ctx,
            id
          });
          clearOriginal.call(global, id);
        };
      }
    });
  }

  bu.internal.registerHandler('interval',
      IntervalOrTimeoutHandler('setInterval', 'clearInterval',
      (ctx, func, period, args) => {
        return {
          name: 'add',
          ctx,
          func,
          period,
          args
        };
      }));

  bu.internal.registerHandler('timeout',
      IntervalOrTimeoutHandler('setTimeout', 'clearTimeout',
      (ctx, func, delay, args) => {
        return {
          name: 'add',
          ctx,
          func,
          delay,
          args
        };
      }));
})(this);