var modules = modules || {};
modules.tests = (function(global) {
  var test = modules.test;

  /**
   * Calls the browser API under the given context.
   *
   * @param ctx the execution context to run the API under
   * @param obj the object on which the API is defined
   * @param name the property name of the API on obj
   * @param args an array of arguments passed to the API
   **/
  function callAPI(ctx, obj, name, args) {
    var ret = null;
    ctx.run(() => {
      ret = obj[name].apply(obj, args);
    });
    return ret;
  }

  /**
   * Throws a specially marked error that designates it for testing
   **/
  function throwTestingError() {
    var error = new Error('should be handled');
    //ensures that the error thrown was the intended error
    error.testing = true;
    throw (error);
  }

  /**
   * Takes the intercepted calls from mocks and calls the callbacks.
   *
   * @param testCase the Test Case instance
   * @param mock the API to which the callbacks were passed
   * @param cbIndex the argument index of the callbacks in the arugments. 
   *    defaults to 0.
   **/
  function callCallbacks(testCase, mock, cbIndex) {
    cbIndex = cbIndex || 0;

    for (var call of testCase.calls(mock)) {
      call.args[cbIndex].apply(null);
    }
  }

  /**
   * Ensures that an event occurs under a given context.
   * The return value is supposed to be called after the test completes.
   * 
   * @param ctx the Execution Context.
   * @param handler the handler for which the event occurs
   * @param name the name of the event to check for
   * @param onEvent optional. Called when the event occurs
   * @return a function that throws if the event has not occured yet.
   **/
  function ensureEventOccurs(ctx, handler, name, onEvent) {
    onEvent = onEvent || (() => undefined);
    var occurred = false;
    ctx.handler(handler).on(name, event => {
      onEvent(event);
      occurred = true;
    });

    return () => {
      test.assert(occurred);
    };
  }

  function createTests() {
    var manager = test.createManager();

    manager.add('Mixin combines properties', testCase => {
      var parent1 = {
        a: 1,
        b: 2
      };

      var parent2 = {
        c: 3
      };

      var child = bu.internal.mixin(parent1, parent2);

      test.assert(child.a == parent1.a);
      test.assert(child.b == parent1.b);
      test.assert(child.c == parent2.c);
    });

    /**
     * Ensures that events passed to event aware are passed to the correct
     * listeners.
     **/
    manager.add('EventAware handles events', testCase => {
      var eventAware = bu.EventAware();

      eventAware.on('typeA', event => {
        test.assert(event.isA);
      });

      eventAware.on('typeB', event => {
        test.assert(event.isB);
      });

      eventAware.fire({
        name: 'typeA',
        isA: true
      });

      eventAware.fire({
        name: 'typeB',
        isB: true
      });
    });

    /**
     * Ensures that an event without a name fails when fired.
     **/
    manager.add('EventAware throws when an event has no name', testCase => {
      var thrown;
      try {
        bu.EventAware().fire({});
        thrown = false;
      } catch (e) {
        thrown = true;
      }
      test.assert(thrown);
    });

    manager.add('nested contexts are handled', testCase => {
      var ctx1 = bu.createCtx();
      ctx1.run(() => {
        test.assert(bu.internal.getCurrCtx() === ctx1);

        var ctx2 = bu.createCtx();
        ctx2.run(() => {
          test.assert(bu.internal.getCurrCtx() === ctx2);
        });

        test.assert(bu.internal.getCurrCtx() === ctx1);

        var ctx3 = bu.createCtx();
        ctx3.run(() => {
          test.assert(bu.internal.getCurrCtx() === ctx3);
        });

        test.assert(bu.internal.getCurrCtx() === ctx1);
      });
    });

    /**
     * Ensures that the handler fires an error event when the callback throws.
     *
     * @param options.handler the name of the handler
     * @param options.obj the object under which the API that 'adds' a
     *    callback is defined
     * @param options.addName the name of the API which 'adds' a callback
     * @param options.addArgs optional. The arguments passed to the 'add' API
     * @param options.cbIndex optional. Specifies which argument is the callback
     **/
    function handlerFiresErrorEvent(options) {
      options = bu.internal.mixin({
        obj: global,
        addArgs: [throwTestingError, 1000],
        cbIndex: null
      }, options);

      manager.add(`${options.handler} handler catches errors`, testCase => {
        testCase.mock([options.addName]);
        var ctx = bu.createCtx([options.handler]);

        callAPI(ctx, options.obj, options.addName, options.addArgs);

        var after = ensureEventOccurs(ctx, options.handler, 'error', event => {
          test.assert(event.error.testing);
        });

        callCallbacks(testCase, options.addName, options.cbIndex);
        after();
      });
    }

    handlerFiresErrorEvent({
      handler: 'interval',
      addName: 'setInterval'
    });
    handlerFiresErrorEvent({
      handler: 'timeout',
      addName: 'setTimeout'
    });
    handlerFiresErrorEvent({
      handler: 'eventListener',
      obj: new Image(),
      addName: 'addEventListener',
      addArgs: ['onload', throwTestingError],
      cbIndex: 1
    });

    /**
     * Ensures that the handler fires an add event when the API is called.
     *
     * @param options.handler the name of the handler
     * @param options.obj the object under which the API that 'adds' a
     *    callback is defined
     * @param options.addName the name of the API which 'adds' a callback
     * @param options.addArgs optional. The arguments passed to the 'add' API
     * @param options.predicate optional. A function that takes the add event.
     *    If the function returns false, the test fails.
     **/
    function handlerFiresAddEvent(options) {
      options = bu.internal.mixin({
        obj: global,
        addArgs: [() => undefined, 1000, 'testing'],
        predicate: event => event.args[0] === 'testing'
      }, options);

      manager.add(`${options.addName} fires add event`, testCase => {
        testCase.mock([options.addName]);
        var ctx = bu.createCtx([options.handler]);

        var after = ensureEventOccurs(ctx, options.handler, 'add', event => {
          test.assert(options.predicate(event));
        });

        callAPI(ctx, options.obj, options.addName, options.addArgs);
        after();
      });
    }

    handlerFiresAddEvent({
      handler: 'interval',
      addName: 'setInterval'
    });
    handlerFiresAddEvent({
      handler: 'timeout',
      addName: 'setTimeout'
    });
    handlerFiresAddEvent({
      handler: 'eventListener',
      obj: new Image(),
      addName: 'addEventListener',
      addArgs: ['testing', () => undefined],
      predicate: event => event.listenerName === 'testing'
    });

    /**
     * Ensures that the handler fires a remove event when the callback is removed.
     *
     * @param options.handler the name of the handler
     * @param options.obj the object under which the API that 'adds' a
     *    callback is defined
     * @param options.addName the name of the API which 'adds' a callback
     * @param options.addArgs optional. The arguments passed to the 'add' API
     * @param options.removeName the name of the API which 'removes' a callback
     * @param options.removeArgs optional. The arguments passed to the 'remove' API
     * @param options.predicate optional. A function that takes the remove event.
     *    If the function returns false, the test fails.
     **/
    function handlerFiresRemoveEvent(options) {
      options = bu.internal.mixin({
        obj: global,
        predicate: (ret, event) => event.id === ret,
        addArgs: [() => {}, 1000],
        removeArgs: ret => [ret]
      }, options);

      manager.add(`${options.removeName} fires remove event`, testCase => {
        testCase.mock([options.addName, options.removeName]);
        var ctx = bu.createCtx([options.handler]);

        var after = ensureEventOccurs(ctx, options.handler, 'remove', event => {
          test.assert(options.predicate(ret, event));
        });

        var ret = callAPI(ctx, options.obj, options.addName, options.addArgs);
        callAPI(ctx, options.obj, options.removeName, options.removeArgs(ret));
        after();
      });
    }

    handlerFiresRemoveEvent({
      handler: 'interval',
      addName: 'setInterval',
      removeName: 'clearInterval'
    });
    handlerFiresRemoveEvent({
      handler: 'timeout',
      addName: 'setTimeout',
      removeName: 'clearTimeout'
    });

    var args = ['testing', () => {}];
    handlerFiresRemoveEvent({
      handler: 'eventListener',
      obj: new Image(),
      addName: 'addEventListener',
      addArgs: args,
      removeName: 'removeEventListener',
      removeArgs: ret => args,
      predicate: (ret, event) => event.listenerName === 'testing'
    });

    /**
     * Ensures that the handler passes the extra arguments to the callback.
     *
     * @param options.handler the name of the handler
     * @param options.addName the name of the API which 'adds' a callback
     **/
    function handlerPassesArguments(options) {
      manager.add(`${options.addName} passes arguments`, testCase => {
        testCase.mock([options.addName]);
        var ctx = bu.createCtx([options.handler]);

        var checked = false;

        callAPI(ctx, global, options.addName, [(arg1, arg2) => {
          test.assert(arg1 === 'foo');
          test.assert(arg2 === 'bar');
          checked = true;
        }, 1000, 'foo', 'bar']);

        callCallbacks(testCase, options.addName);
        test.assert(checked);
      });
    }

    handlerPassesArguments({
      handler: 'interval',
      addName: 'setInterval'
    });
    handlerPassesArguments({
      handler: 'timeout',
      addName: 'setTimeout'
    });

    manager.add('eventListener passes extra arguments to the API', testCase => {
      testCase.mock(['addEventListener', 'removeEventListener']);
      var ctx = bu.createCtx(['eventListener']);
      var image = new Image();
      var extra = {
        once: true
      };

      callAPI(ctx, image, 'addEventListener',
        ['load', () => {}, extra]);

      callAPI(ctx, image, 'removeEventListener',
        ['load', () => {}, extra]);

      for (var call of testCase.calls('addEventListener')) {
        test.assert(call.args[2] === extra);
      }

      for (call of testCase.calls('removeEventListener')) {
        test.assert(call.args[2] === extra);
      }
    });

    manager.add('addEventListener does not pass extra arguments to the callback', testCase => {
      testCase.mock(['addEventListener']);
      var ctx = bu.createCtx(['eventListener']);
      var image = new Image();

      var checked = false;

      callAPI(ctx, image, 'addEventListener', ['load', x => {
        test.assert(x === undefined);
        checked = true;
      }, 1]);

      callCallbacks(testCase, 'addEventListener', 1);
      test.assert(checked);
    });

    return manager;
  }

  return {
    createTests
  };
})(this);