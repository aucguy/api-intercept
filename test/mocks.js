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

  /**
   * Creates a mock that mocks out the promise constructor.
   **/
  function PromiseMock() {
    var sup = test.internal.Mock();

    var originalImmediate = null;
    var originalPromise = null;

    return bu.internal.mixin(sup, {
      setup() {
        sup.setup();
        originalPromise = Promise;
        //_immediateFn is used by the polyfill to tell the browser to call the
        //promise callbacks. Therefore, intercepting the callbacks and calling
        //them makes it synchonous.
        originalImmediate = polyfillPromise._immediateFn;

        Promise = polyfillPromise; //jshint ignore:line
        Promise._immediateFn = callback => {
          sup.calls().push({
            callback
          });
        };
      },
      cleanup() {
        sup.cleanup();
        Promise._immediateFn = originalImmediate;
        Promise = polyfillPromise; //jshint ignore:line
      }
    });
  }

  test.internal.registerMock('promise', PromiseMock());

  function FetchMock() {
    var sup = test.internal.Mock();

    var originalFetch = fetch;

    return bu.internal.mixin(sup, {
      setup() {
        sup.setup();

        fetch = function() {
          var args = [];
          sup.calls().push({
            args: Array.prototype.slice.call(arguments, 0, 2)
          });
          return new Promise(arguments[2] || ((resolve, reject) => resolve()));
        };
      },
      cleanup() {
        sup.cleanup();
        fetch = originalFetch;
      },
      uses() {
        return ['promise'];
      }
    });
  }

  test.internal.registerMock('fetch', FetchMock());

  function DomEventMock() {
    var sup = test.internal.Mock();

    var originalDesc = {};
    for (var name of Object.getOwnPropertyNames(HTMLElement.prototype)) {
      if (name.startsWith('on')) {
        originalDesc[name] = Object.getOwnPropertyDescriptor(HTMLElement.prototype, name);
      }
    }

    return bu.internal.mixin(sup, {
      cleanup() {
        sup.cleanup();
        for (var name of Object.getOwnPropertyNames(originalDesc)) {
          Object.defineProperty(HTMLElement.prototype, name, originalDesc[name]);
        }
      }
    });
  }

  test.internal.registerMock('domEvent', DomEventMock());
})(this);