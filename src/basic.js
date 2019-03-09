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
    var externalSuper = bu.internal.GlobalExternalHandler();
    var addSuper = bu.internal.BasicAddHandler(externalSuper, options);
    var removeSuper = bu.internal.BasicRemoveHandler(externalSuper, options);

    return bu.internal.mixin(externalSuper, {
      install() {
        addSuper.install();
        removeSuper.install();
      }
    });
  }

  bu.internal.BasicHandler = BasicHandler;
})(window);