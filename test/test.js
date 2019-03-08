/**
 * The testing library. Implementing my own removes dependencies and is
 * easily implemented.
 **/
var modules = modules || {};
modules.test = (function(global) {
  /**
   * Creates a new test manager. A test manager is responsible for keeping
   * track of test cases, running them and consolidating their results.
   **/
  function Manager() {
    //an array of test cases. Note that these are not TestCase instances.
    var tests = [];

    return {
      /**
       * Adds a new test case. A test that throws an error is a failure,
       * otherwise it is a success.
       * 
       * @param name the name of the test case
       * @param func the function that will be called to run the test
       *    Its single argument is a TestCase object which is used for mocking.
       **/
      add(name, func) {
        tests.push({
          name,
          func
        });
      },
      /**
       * Runs all the tests.
       *
       * @return an object
       *    total: the total number of tests that ran
       *    fails: an array of objects for each failed test
       *      name: the name of the failed test
       *      error: the error thrown by the test
       **/
      run() {
        var fails = [];
        for (var test of tests) {
          var testCase;
          try {
            testCase = TestCase();
            test.func(testCase);
          } catch (error) {
            fails.push({
              name: test.name,
              error
            });
          }
          testCase.cleanup();
        }
        return {
          total: tests.length,
          fails,
        };
      }
    };
  }

  /**
   * Creates a new TestCase. TestCase's are used by test cases to control
   * mocks. They are passed to the test functions when they run.
   **/
  function TestCase() {
    //an array of the names of the mocks this test case uses
    var usedMocks = [];
    return {
      /**
       * Set ups the mocks with the given names. Calling the mocked functions
       * will no longer call the actual functions but instead will record their
       * arguments.
       *
       * @param names the names of the mocks to be used
       **/
      mock(names) {
        for (var name of names) {
          if (!(name in mocks)) {
            throw (new Error(`mock '${name}' was not found`));
          }
          mocks[name].setup();
          usedMocks.push(name);
        }
      },
      /**
       * Returns the arguments for each call passed to a given mock.
       *
       * @param name the name of the mock
       * @return an array of arguments that were passed to the mock.
       **/
      calls(name) {
        if (!usedMocks.includes(name)) {
          throw (new Error(`test not using mock '${name}'`));
        }
        return mocks[name].calls();
      },
      /**
       * Restores the mocks to their original functions
       **/
      cleanup() {
        for (var name of usedMocks) {
          mocks[name].cleanup();
        }
      }
    };
  }

  //a map of names to mock objects
  var mocks = {};

  /**
   * Mocks are used to replace browser API functions in order to record
   * arguments and prevent the invocation of the original function.
   **/
  function Mock() {
    var inUse = false;
    //an array of the arguments passed to the mocked function for each invocation
    var calls = null;
    return {
      /**
       * Sets up the mock. This usually replaces the browser API function with
       * a mocked function.
       **/
      setup(testCase) {
        if (inUse) {
          throw (new Error('mock already in use'));
        }
        inUse = true;
        calls = [];
      },
      /**
       * Cleans up the mock. This usually replaces the mocked function with the
       * original browser API function.
       **/
      cleanup() {
        inUse = false;
        calls = null;
      },
      calls() {
        return calls;
      }
    };
  }

  /**
   * Registers a mock with the given name. The name is used in TestCase.mock.
   * 
   * @param name the name of the mock.
   * @param instance the mock instance
   **/
  function registerMock(name, instance) {
    mocks[name] = instance;
  }

  /**
   * Used in tests to check that a certain condition is true. Throws an error.
   *
   * @param condition if false, an error is the thrown
   * @param msg the message of the thrown error
   * @throws if the condition is false
   **/
  function assert(condition, msg) {
    if (!condition) {
      throw (new Error(msg || ''));
    }
  }

  return {
    createManager: Manager,
    assert,
    internal: {
      Mock,
      registerMock
    }
  };
})(this);