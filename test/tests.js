var modules = modules || {};
modules.tests = (function() {
  var test = modules.test;

  function createTests() {
    var manager = test.createManager();

    /*
     * Ensures that a error thrown by the callback passed to setInterval
     * fires an error event on the context under which setInterval was
     * called.
     */
    manager.add('interval handler catches errors', testCase => {
      testCase.mock(['setInterval']);
      var ctx = bu.createCtx(['interval']);
      ctx.run(() => {
        setInterval(() => {
          var error = new Error('should be handled');
          //ensures that the error thrown was the intended error
          error.testing = true;
          throw (error);
        }, 1000);
      });

      //ensures that the event was fired
      var checked = false;

      ctx.handler('interval').on('error', event => {
        test.assert(event.error.testing);
        checked = true;
      });

      //begin environment emulation
      for (var call of testCase.calls('setInterval')) {
        call.args[0].apply(null);
      }
      //end environment emulation

      test.assert(checked);
    });
    return manager;
  }

  return {
    createTests
  };
})();