var bu = (function(global) {
  /**
   * Combines the properties of multiple objects. The properties defined
   * directly on the arguments are copied to a new object. If two arguments
   * define the same property, the latter one is copied.
   *
   * @param arguments the objects with properties to copy
   * @return a new object with properties copied from the arguments
   **/
  function mixin( /* objects */ ) {
    var mixed = {};
    for (var arg of arguments) {
      for (var name of Object.getOwnPropertyNames(arg)) {
        var desc = Object.getOwnPropertyDescriptor(arg, name);
        Object.defineProperty(mixed, name, desc);
      }
    }
    return mixed;
  }

  /**
   * When an event occurs, an EventAware invokes the associated callbacks.
   * EventAware has two methods; the on method registers callbacks and the fire
   * method signifies that an event has occurred.
   *
   * @return an EventAware instance. May be passed to mixin or wrapped for
   *      other types of inheritance
   **/
  function EventAware() {
    //a map of event names to an array of callbacks
    var listeners = {};

    return {
      /**
       * Registers a callback with a certain type of event. When the fire
       * method is called with an event whose name property matches the name
       * argument, the callback will be called.
       *
       * @param name the name of the type of the event that will invoke the
       *      callback when fired
       * @param callback a function that takes the argument of the fired event
       **/
      on(name, callback) {
        if (listeners[name] === undefined) {
          listeners[name] = [callback];
        } else {
          listeners[name].push(callback);
        }
      },
      /**
       * Signifies that an event has occurred. This will cause any registered
       * callbacks to be fired.
       *
       * @param event the event. Any callback that was registered under
       *    event.name will be called.
       **/
      fire(event) {
        if (event.name === undefined) {
          throw (new Error('event must have a name'));
        }
        if (listeners[event.name] !== undefined) {
          for (var listener of listeners[event.name]) {
            listener(event);
          }
        }
      }
    };
  }

  /*
   * Any executing code may be associated with a context. This library must
   * enter and exit contexts. In order to keep track of the current context a
   * stack is used. The current context is the top of the stack. Entering a
   * context pushes it onto the stack and exiting a context pops it from the
   * stack.
   */

  var ctxStack = [null];

  /**
   * Enters an execution context. Used internally.
   *
   * @param ctx the new current context
   **/
  function enterCtx(ctx) {
    ctxStack.push(ctx);
  }

  /**
   * Exits the current execution context. The new context is determined by the
   * context stack. Used internally.
   */
  function exitCtx() {
    ctxStack.pop();
  }

  /**
   * Returns the current execution context. Used internally, but is available
   * to plugins.
   **/
  function getCurrCtx() {
    return ctxStack[ctxStack.length - 1];
  }

  /*
   * Used to assign each context a unique number to be used as keys in maps.
   * Context objects could be used as their own keys in es6 maps, but the
   * numbers can be used as keys on plain javascript objects, which to avoids
   * the use of a map polyfill.
   */
  var ctxID = 0;

  function Context() {
    //the unique id associated with this context
    var id = ctxID++;

    var self = {
      /**
       * Returns the specific handler for the given handler name.
       **/
      handler(name) {
        return externals[name].getSpecificHandler(self);
      },
      /**
       * Runs the given function under this context. Any events triggered by
       * externals will cause events to be triggered on this context's specific
       * handlers. The return value of the function is returned.
       **/
      run(func) {
        var error = null;
        var r = null;
        enterCtx(self);
        try {
          r = func();
        } catch (e) {
          error = e;
        }

        exitCtx();

        if (error !== null) {
          throw (error);
        } else {
          return r;
        }
      },
      id() {
        return id;
      }
    };
    return self;
  }

  /**
   * Creates a new context that makes use of the given handlers.
   *
   * @param neededExternals an array of the names of the required handlers. 
   *      Any specified handler is available via ctx.handler.
   * @return the newly created context
   **/
  function createCtx(neededExternals) {
    if (neededExternals === undefined) {
      neededExternals = [];
    } else {
      neededExternals = neededExternals.slice();
    }
    var ctx = Context();

    for (var i = 0; i < neededExternals.length; i++) {
      var name = neededExternals[i];
      if (name in externals) {
        var external = externals[name];
        for (var use of external.uses()) {
          neededExternals.push(use);
        }
        if (!external.installed()) {
          external.install();
        }
        external.registerCtx(ctx);
      } else {
        throw (new Error(`external '${name}' was not registered`));
      }
    }

    return ctx;
  }

  /**
   * Creates a global external handler. Used internally by plugins.
   **/
  function GlobalExternalHandler() {
    //a map of context ids to specific handlers
    var specificHandlers = {};
    //whether or not this handler has replaced the default functions
    var installed = false;
    return {
      /**
       * Sets the global handler up. this should override the global browser
       * API function with a variant that emits events.
       **/
      install() {
        installed = true;
      },
      installed: () => installed,
      /**
       * Tells this global handler that a context is using it. This will set up
       * a specific handler.
       **/
      registerCtx(ctx) {
        specificHandlers[ctx.id()] = EventAware();
      },
      /**
       * Returns the specific handler associated with the context.
       **/
      getSpecificHandler(ctx) {
        return specificHandlers[ctx.id()] || null;
      },
      /**
       * Restores the replaced functions with the default ones.
       **/
      cleanup() {
        installed = false;
      },
      uses() {
        return [];
      }
    };
  }

  //map of handler names to global handlers
  var externals = {};

  /**
   * Registers a global handler under the given name. Used internally by plugins.
   **/
  function registerHandler(name, instance) {
    externals[name] = instance;
  }

  return {
    EventAware,
    createCtx,
    //The following are intended for use by plugins and are not exposed as part
    //of the API.
    internal: {
      mixin,
      getCurrCtx,
      GlobalExternalHandler,
      registerHandler,
      getExternals() {
        return externals;
      }
    }
  };
})(window);