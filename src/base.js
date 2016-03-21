var base = (function(global) {
  //---Error Handling---

  /**
   * called when an error is thrown. These do not use error handling
   */
  errorCallbacks = [];

  /**
   * the ids returned by setInterval
   */
  var intervalHooks = [];

  /**
   * bound event listeners
   */
  var listenerHooks = [];

  var requestAnimationHooks = [];

  var timeoutHooks = [];

  /**
   * the uncaught error that was thrown and stopped everyting
   */
  var errorThrown = null;

  /**
   * called when an error occurs. This reports an error to the user and
   * unregisters anything that was registered via
   * base.js.
   *
   * @param error exception that occured and is to be reported
   */
  function onError(error) {
    errorThrown = error;
    // call error callbacks
    applyToAll(errorCallbacks, error);
    // display the error to the console
    console.error(error.stack);

    // display the error on the screen

    var errorDiv = document.getElementById("error div");
    var errorText = document.getElementById("error text");
    var display = document.getElementById("display");

    // swap displays and display error
    if(errorText) errorText.innerHTML = error.stack;
    if(errorDiv) errorDiv.style.display = "block";
    if(display) display.style.display = "none";
  }

  /**
   * calls a function and reports any errors thrown via calling onError()
   *
   * @param func the function to call and report errors for
   */
  function runSafely(func) {
    if (errorThrown) return; //don't do anything if already failed
    try {
      func();
    } catch (error) {
      onError(error);
    }
  }

  /**
   * returns a function that does exactly what the argument would
   * do, but reports errors. Useful for having callbacks that are externally
   * called.
   *
   * @param func the function to call / behavior is emulated
   * @return a function that handles errors
   */
  function external(func) {
    return function() {
      runSafely(func);
    };
  }

  function simpleCallbackRegister(func, hooks) {
    return function (/*args*/) {
      //from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments
      var args = (arguments.length == 1 ? [arguments[0]] :
        Array.apply(null, arguments));
      args[0] = base.external(args[0]);
      var r = func.apply(null, args);
      hooks.push(r);
      return r;
    };
  }

  function simpleCallbackUnregister(func, hooks) {
    return function(id) {
      func(id);
      intervalHooks.splice(intervalHooks.indexOf(id), 1);
    };
  }

  /**
   * Has the same behavior as javascript's normal setInterval but it
   * reports any errors that happen during the function to the user
   * and if any errors occur anywhere, it clears the interval. Useful
   * if you don't want a function to execute after an error. Note if
   * you use this use base.js's clearInterval, not the regular one.
   *
   * @param func the function to call at a certaint interval
   * @param inter the interval to call 'func'
   * @return the id associated with the interval. Pass this to clear
   *         interval to stop calling the function.
   */
  var setInterval_ = simpleCallbackRegister(setInterval, intervalHooks);

  /**
   * Has the same behavior as javascript's normal clearInterval but it
   * undoes the hooking with base.js. If you used base.setInterval then
   * use this too, if not don't use this.
   *
   * @param int the id returned from setInterval
   */
   var clearInterval_ = simpleCallbackUnregister(clearInterval, intervalHooks);

  /**
   * Adds a listener to an element, but if an error occurs during the
   * callback, it is reported. If you use base.js's addEventListener, use
   * base.js's removeEventListener
   * @param element the element to add a listener to
   * @param event the event to listen for
   * @param callback the function to call when the event occurs
   * @param capture or options
   **/
  function addEventListener(element, event, callback, capture) {
    var ext = external(callback);
    element.addEventListener(event, ext, capture);
    listenerHooks.push({
      element: element,
      event: event,
      ext: ext,
      callback: callback,
      capture: capture
    });
  }

  /**
   * Does exactly the oppose of addEventListener, kind of like clearInterval
   *
   * @param int the id returned from setInterval
   */
  function removeEventListener(element, event, callback) {
    for (var i = 0; i < listenerHooks.length; i++) {
      var obj = listenerHooks[i];
      if (obj.element == element && obj.event == event &&
        obj.callback == callback) {
        obj.element.removeEventListener(event, obj.ext);
        listenerHooks.splice(i, 1);
        break;
      }
    }
  }

  //taken from phaser and modified
  var vendors = [
    'ms',
    'moz',
    'webkit',
    'o'
  ];

  var requestAnimationFrame, cancelAnimationFrame;

  for (var x = 0; x < vendors.length && !requestAnimationFrame; x++) {
    requestAnimationFrame = global[vendors[x] + 'RequestAnimationFrame'];
    cancelAnimationFrame = global[vendors[x] + 'CancelAnimationFrame'];
  }

  var requestAnimationFrame_ = simpleCallbackRegister(requestAnimationFrame,
    requestAnimationHooks);
  var cancelAnimationFrame_ = simpleCallbackUnregister(cancelAnimationFrame,
    requestAnimationHooks);

  var setTimeout_ = simpleCallbackRegister(setTimeout, timeoutHooks);
  var clearTimeout_ = simpleCallbackUnregister(clearTimeout, timeoutHooks);



  /**
   * create an overriden custom window object.
   */
  function customWindow() {
    var win = {};
    var window = global;

    while(window) {
      var keys = Object.getOwnPropertyNames(window);
      for(var i=0; i<keys.length; i++) {
        var key = keys[i];
        var value = global[key];
        console.log(key);
        if(typeof value == "function") {
          win[key] = value.bind(global);
        } else {
          win[key] = value;
        }
      }
      window = Object.getPrototypeOf(window);
    }

    win.setInterval = setInterval_;
    win.clearInterval = clearInterval_;
    win.requestAnimationFrame = requestAnimationFrame_;
    win.cancelAnimationFrame = cancelAnimationFrame_;
    win.setTimeout = setTimeout_;
    win.clearTimeout = clearTimeout_;
    return win;
  }

  /**
   * Unhooks callbacks made threw base.js.
   **/
  errorCallbacks.push(function(error) {
    var i;
    for (i = 0; i < intervalHooks.length; i++) {
      clearInterval_(intervalHooks[i]);
    }
    for (i = 0; i < listenerHooks.length; i++) {
      var obj = listenerHooks[i];
      removeEventListener(obj.element, obj.event, obj.callback);
    }
    for (i = 0; i < requestAnimationHooks.length; i++) {
      cancelAnimationFrame_(requestAnimationHooks[i]);
    }
    for(i = 0; i < timeoutHooks.lenght; i++) {
      clearTimeout(timeoutHooks[i]);
    }
  });

  //---Modules---

  /**
   * loaded modules. The key is the name of the module and the value
   * is an object representing the object itself.
   */
  var modules = {};

  /**
   * Callbacks to call when a module is registered
   */
  var registerCallbacks = [];

  /**
   * register's a module
   *
   * @param name the name of the module. Used as the argument for importModule
   * @param initFunc a function that returns the module's scope and is returned
   *      by importModule
   */
  function registerModule(name, initFunc) {
    var module = {
      name: name,
      scope: null,
      initFunc: initFunc
    };
    modules[name] = module;
    applyToAll(registerCallbacks, module);
  }

  /**
   * returns a module's scope and initializes it if necessary
   *
   * @parm name the name of the module
   */
  function importModule(name) {
    var module = modules[name];
    if (!module) throw (new Error("module '" + name + "' is not defined"));
    if (!module.scope) {
      module.scope = module.initFunc();
    }
    return module.scope;
  }

  //---Asset Loading---
  /**
   * A map whose key is a assets's id and value is the asset itself
   */
  var assets = {};
  /**
   * the base path to look for asset
   */
  var basePath = '';
  /**
   * how many assets need are loading. -1 indicates that no requests have
   * been made.
   */
  var loading = -1;

  /**
   * how many assets have been loaded
   */
  var loaded = 0;

  /**
   * function that has the index
   */
  var indexFunc = (global.base ? global.base.indexFunc : null) || [];

  /**
   * returns a loaded asset with the given id
   */
  function getAsset(asset) {
    return assets[asset].data;
  }

  /**
   * creates the internal asset format
   */
  function makeAsset(id, url, type, data, xhr) {
    return {
      type: type,
      id: id,
      url: url,
      data: data,
      xhr: xhr ? xhr : null
    };
  }

  /**
   * loads a text asset via ajax
   *
   * @param id the id of the asset
   * @param asset the url where the asset is located relative to the base path
   * @param callback called when the requested assets is loaded
   */
  function loadText(id, url, type) {
    if (id in assets) return;
    incrLoading();
    ajax(join(basePath, url), function(request) {
      try {
        assets[id] = makeAsset(id, url, type, request.responseText, request);
        decrLoading();
      } catch (error) {
        decrLoading();
        throw (error);
      }
    }, function(request) {
      decrLoading();
      throw (new Error("failed to retrieve asset " + id));
    });
  }

  /**
   * loads a tag asset
   *
   * @param id the id of the asset
   * @param url the url where the asset is located
   * @param type the tagname of the asset
   */
  function loadTag(id, url, type) {
    if (id in assets) return;
    incrLoading();
    var tag = document.createElement(type);
    if (type == "script") {
      document.head.appendChild(tag);
    } else {
      tag.onload = function() {
        assets[id] = makeAsset(id, url, type, tag);
        decrLoading();
      };
      tag.onerror = function() {
        throw (new Error("failed to load asset" + id + " at " + url));
      };
    }
    tag.src = join(basePath, url);
  }

  /**
   * loads an asset
   *
   * @param id the id the asset is under. Use getAsset with the id to get
   *    the asset
   * @param url the url of the asset relative to the base path
   * @param type the type of the asset. Either the tag name or 'text'
   */
  function loadAsset(id, url, type) {
    if (type == "text") {
      loadText(id, url, type);
    } else if (type == "script") {
      loadTag(id, url, type);
    } else {
      loadTag(id, url, type);
    }
  }

  /**
   * loads multiple assets
   *
   * @param assets a list of lists. The inner list's elements correspond
   *    to a particular asset's id, url and type, in that order.
   */
  function loadAssets(assets) {
    for (var i = 0; i < assets.length; i++) {
      loadAsset(assets[i][0], assets[i][1], assets[i][2]);
    }
  }

  /**
   * increments the number of resources oading
   */
  function incrLoading() {
    loading = loading < 0 ? 1 : loading + 1;
  }

  /**
   * decrements the number of resources loading
   */
  function decrLoading() {
    loading--;
    loaded++;
  }

  registerCallbacks.push(decrLoading);

  /**
   * sends a request to the server for the given asset
   */
  function ajax(path, onready, onfail) {
    if (typeof onfail == 'undefined') {
      onfail = function(request) {
        console.warn("asset '" + path + "' failed to load with a status of " +
          request.status);
      };
    }

    // taken from
    // http://www.w3schools.com/ajax/tryit.asp?filename=tryajax_first
    // and modified
    var request = window.XMLHttpRequest ? new XMLHttpRequest() :
      new ActiveXObject("Microsoft.XMLHTTP");
    request.onreadystatechange = external(function() {
      if (request.readyState == 4) {
        if (request.status == 200 || request.status === 0) {
          onready(request);
        } else {
          onfail(request);
        }
      }
    });
    request.open("GET", path, true);
    request.send();
  }

  // join from https://gist.github.com/creationix/7435851 and modified
  // Joins path segments. Preserves initial "/" and resolves ".." and "."
  // Does not support using ".." to go above/outside the root.
  // This means that join("foo", "../../bar") will not resolve to "../bar"
  function join( /* path segments */ ) {
    // Split the inputs into a list of path commands.
    var parts = [];
    for (var i = 0, l = arguments.length; i < l; i++) {
      parts = parts.concat(arguments[i].split("/"));
    }
    // Interpret the path commands to get the new resolved path.
    var newParts = [];
    for (i = 0, l = parts.length; i < l; i++) {
      var part = parts[i];
      // Remove leading and trailing slashes
      // Also remove "." segments
      if (!part || part === ".")
        continue;
      // Interpret ".." to pop the last segment
      if (part === "..")
        newParts.pop();
      // Push new path segments.
      else
        newParts.push(part);
    }
    // Preserve the initial slash if there was one.
    if (parts[0].startsWith("/") || parts[0].startsWith("\\"))
      newParts.unshift("");
    // Turn back into a single string path.
    return newParts.join("/") || (newParts.length ? "/" : ".");
  }

  //---Loading Screen---
  var States = {
    BASE_NOT_LOADED: 0, //main not run
    INDEX_NOT_LOADED: 1, //main run but index not
    ASSETS_LOADING: 2, //index run and assets loading
    APP_INITING: 3, //app initializing
    APP_RUNNING: 4 //app running
  };

  /**
   * the id for the display canvas
   */
  var DISPLAY_ID = "display";
  /**
   * the number returned by setInterval for the loading screen
   */
  var loadTickInterval = null;

  /**
   * the state base.js is in
   */
  var loadingState = States.BASE_NOT_RUN;

  /**
   * callbacks to call when the state changes initializing
   */
  stateChangeCallbacks = [];

  /**
   * call this to start everything
   */
  function main() {
    renderLoadingScreen();
    loadTickInterval = setInterval_(tickLoading, 100);
    changeState(States.INDEX_NOT_LOADED);
  }

  /**
   * called to setup the loading screen, and if all the assets are loaded,
   * initialize and start the game
   */
  function tickLoading() {
    tryLoadIndex();
    renderLoadingScreen();
    if (loading === 0) {
      changeState(States.APP_INITING);
      mainModule = importModule('main');
      mainModule.init();
      changeState(States.APP_RUNNING);
    }
  }

  /**
   * renders the loading screen
   */
  function renderLoadingScreen() {
    var display = document.getElementById(DISPLAY_ID);
    var context = display.getContext("2d");

    context.fillStyle = "#000000";
    context.fillRect(0, 0, display.width, display.height);
    context.textBaseline = "top";
    context.font = "72px Arial";
    context.strokeStyle = "#FFFFFF";
    var text, bigText;
    if(loadingState == States.ASSETS_LOADING) {
      var total = loading + loaded;
      bigText = "Loading: " + total + "/" + total;
      text = "Loading: " + loaded + "/" + total;
    } else {
      text = loadingState == States.APP_INITING ? "Initializing" : "Bad State";
      bigText = text;
    }
    var metric = context.measureText(bigText);
    context.strokeText(text, display.width / 2 - metric.width / 2,
      display.height / 2 - 72 / 2);
  }

  /**
   * ends the loading screen
   */
  stateChangeCallbacks.push(function(state) {
    if(state == States.APP_INITING) {
      clearInterval_(loadTickInterval);
      renderLoadingScreen();
    }
  });

  /**
   * attempts to load the index
   */
  function tryLoadIndex() {
    if(loadingState == States.INDEX_NOT_LOADED && indexFunc !== null) {
      indexFunc();
      changeState(States.ASSETS_LOADING);
    }
  }
  stateChangeCallbacks.push(tryLoadIndex);

  /**
   * changes the state
   *
   * @param state the state to change to
   */
  function changeState(state) {
    if (state != loadingState) {
      loadingState = state;
      applyToAll(stateChangeCallbacks, state);
    }
  }

  //---Misc---
  /**
   * calls each function in an array
   *
   * @param funcs calls each function in the array
   * @param arg the argument to pass to the array. If not given no argument
   *    will be passed.
   */
  function applyToAll(funcs, arg) {
    for (var i = 0; i < funcs.length; i++) funcs[i](arg);
  }

  //run main when the document is loaded
  addEventListener(document, "DOMContentLoaded", main, false);

  //exports
  return {
    onError: onError,
    runSafely: runSafely,
    external: external,
    setInterval: setInterval_,
    clearInterval: clearInterval_,
    addEventListener: addEventListener,
    removeEventListener: removeEventListener,
    requestAnimationFrame: requestAnimationFrame,
    cancelAnimationFrame: cancelAnimationFrame_,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    customWindow: customWindow,
    getErrorCallbacks: function() {
      return errorCallbacks;
    },
    getRegisterCallbacks: function() {
      return registerCallbacks;
    },
    registerModule: registerModule,
    importModule: importModule,
    getBasePath: function() {
      return basePath;
    },
    setBasePath: function(x) {
      basePath = x;
    },
    getAsset: getAsset,
    getAssets: function() {
      return assets;
    },
    loadText: loadText,
    loadTag: loadTag,
    loadAsset: loadAsset,
    loadAssets: loadAssets,
    decrLoading: decrLoading,
    getStates: function() {
      return States;
    },
    getStateChangeCallbacks: function() {
      return stateChangeCallbacks;
    },
    getLoadingState: function() {
      return loadingState;
    },
    setLoadingState: function(x) {
      changeState(x);
    }
  };
})(this);
