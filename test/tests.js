var modules = modules || {};
modules.tests = (function(global) {
  var test = modules.test;

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

    intervalOrTimeout(manager, 'setInterval', 'clearInterval', 'interval');
    intervalOrTimeout(manager, 'setTimeout', 'clearTimeout', 'timeout');

    return manager;
  }

  function intervalOrTimeout(manager, setName, clearName, handler) {
    /*
     * Ensures that a error thrown by the callback passed to setInterval
     * fires an error event on the context under which setInterval was
     * called.
     */
    manager.add(`${handler} handler catches errors`, testCase => {
      testCase.mock([setName]);
      var ctx = bu.createCtx([handler]);
      ctx.run(() => {
        global[setName](() => {
          var error = new Error('should be handled');
          //ensures that the error thrown was the intended error
          error.testing = true;
          throw (error);
        }, 1000);
      });

      //ensures that the event was fired
      var checked = false;

      ctx.handler(handler).on('error', event => {
        test.assert(event.error.testing);
        checked = true;
      });

      //begin environment emulation
      for (var call of testCase.calls(setName)) {
        call.args[0].apply(null);
      }
      //end environment emulation

      test.assert(checked);
    });

    manager.add(`${setName} handles parameter arguments`, testCase => {
      testCase.mock([setName]);

      var ctx = bu.createCtx([handler]);
      var checked = false;
      ctx.run(() => {
        global[setName]((arg1, arg2) => {
          test.assert(arg1 === 'foo');
          test.assert(arg2 === 'bar');
          checked = true;
        }, 1000, 'foo', 'bar');
      });

      //begin environment emulation
      for (var call of testCase.calls(setName)) {
        call.args[0].apply(null);
      }
      //end environment emulation

      test.assert(checked);
    });

    manager.add(`${setName} fires add event`, testCase => {
      testCase.mock([setName]);

      var ctx = bu.createCtx([handler]);
      var fired = false;

      ctx.handler(handler).on('add', event => {
        test.assert(event.args[0] === 'testing');
        fired = true;
      });

      var callback = () => {};

      ctx.run(() => {
        global[setName](() => {}, 1000, 'testing');
      });

      test.assert(fired);
    });

    manager.add(`${clearName} fires remove event`, testCase => {
      testCase.mock([setName, clearName]);

      var ctx = bu.createCtx([handler]);
      var id = null;
      var fired = false;

      ctx.handler(handler).on('remove', event => {
        test.assert(event.id === id);
        fired = true;
      });

      ctx.run(() => {
        id = global[setName](() => {}, 1000);
        global[clearName](id);
      });

      test.assert(fired);
    });
  }

  return {
    createTests
  };
})(this);