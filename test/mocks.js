/**
 * Mock definitions
 **/
(function(global) {
  var test = modules.test;
  var Mock = test.internal.Mock;

  function SetIntervalMock() {
    var sup = test.internal.Mock();
    var originalFunc = null;

    return bu.internal.mixin(sup, {
      setup() {
        sup.setup();
        originalFunc = global.setInterval;
        global.setInterval = (func, period) => {
          sup.calls().push({
            args: [func, period]
          });
        };
      },
      cleanup() {
        sup.cleanup();
        global.setInterval = originalFunc;
      }
    });
  }

  test.internal.registerMock('setInterval', SetIntervalMock());
})(this);