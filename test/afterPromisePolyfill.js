var polyfillPromise = Promise;
Promise = builtinPromise; //jshint ignore:line
delete builtinPromise; //jshint ignore:line