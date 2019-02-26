/**
 * Mock definitions
 **/
(function(global) {
  var test = modules.test;
  var Mock = test.internal.Mock;

  function BasicMock(name) {
    var sup = test.internal.Mock();
    var originalFunc = null;

    return bu.internal.mixin(sup, {
      setup() {
        sup.setup();
        originalFunc = global[name];
        global[name] = function() {
          sup.calls().push({
            args: Array.prototype.slice.call(arguments)
          });
        };
      },
      cleanup() {
        sup.cleanup();
        global[name] = originalFunc;
      }
    });
  }

  function registerBasicMock(name) {
    test.internal.registerMock(name, BasicMock(name));
  }

  registerBasicMock('setInterval');
  registerBasicMock('clearInterval');
  registerBasicMock('setTimeout');
  registerBasicMock('clearTimeout');
})(this);