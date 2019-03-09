/**
 * Mock definitions
 **/
(function(global) {
  var test = modules.test;
  var Mock = test.internal.Mock;

  /**
   * Creates a mock that is suitable for basic APIs.
   *
   * @param obj the object on which the API is stored
   * @param name the property name of the API
   * @param retVal a function that produces the return value of the API
   **/
  function BasicMock(obj, name, retVal) {
    retVal = retVal || (() => undefined);

    var sup = test.internal.Mock();
    var originalFunc = null;

    return bu.internal.mixin(sup, {
      setup() {
        sup.setup();
        originalFunc = global[name];
        obj[name] = function() {
          sup.calls().push({
            args: Array.prototype.slice.call(arguments)
          });
          return retVal();
        };
      },
      cleanup() {
        sup.cleanup();
        obj[name] = originalFunc;
      }
    });
  }

  function registerBasicMock(obj, name, retVal) {
    test.internal.registerMock(name, BasicMock(obj, name, retVal));
  }

  var intervalTimeoutCounter = 0;

  function intervalTimeoutRetVal() {
    return intervalTimeoutCounter++;
  }

  registerBasicMock(global, 'setInterval', intervalTimeoutRetVal);
  registerBasicMock(global, 'clearInterval');
  registerBasicMock(global, 'setTimeout', intervalTimeoutRetVal);
  registerBasicMock(global, 'clearTimeout');
  registerBasicMock(Element.prototype, 'addEventListener');
  registerBasicMock(Element.prototype, 'removeEventListener');
  registerBasicMock(global, 'requestAnimationFrame');
})(this);