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

  function ClearIntervalMock() {
    var sup = test.internal.Mock();
    var originalFunc = null;

    return bu.internal.mixin(sup, {
      setup() {
        sup.setup();
        originalFunc = global.clearInterval;
        global.clearInterval = id => {
          sup.calls().push({
            args: [id]
          });
        };
      },
      cleanup() {
        sup.cleanup();
        global.clearInterval = originalFunc;
      }
    });
  }

  test.internal.registerMock('setInterval', SetIntervalMock());
  test.internal.registerMock('clearInterval', ClearIntervalMock());
})(this);