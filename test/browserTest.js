/**
 * Runs the tests and displays the results in the browser.
 **/
(function(global) {
  var test = modules.test;
  var tests = modules.tests;

  function shortDescription(fail) {
    return fail.name + ':\n' + fail.error.toString();
  }

  document.addEventListener('DOMContentLoaded', function() {
    var result = tests.createTests().run();

    var header = document.createElement('p');
    var statusText = `${result.fails.length} of ${result.total} tests failed`;
    header.innerText = statusText;

    var table = document.createElement('table');

    for (var fail of result.fails) {
      var name = document.createElement('td');
      name.innerText = shortDescription(fail);
      name.style.border = '1px solid black';

      var stack = document.createElement('td');
      stack.innerText = fail.error.stack;
      stack.style.border = '1px solid black';

      var row = document.createElement('tr');
      row.appendChild(name);
      row.appendChild(stack);

      table.appendChild(row);
    }

    var content = document.getElementById('content');
    content.appendChild(header);
    content.appendChild(table);

    console.log(statusText);
    for (fail of result.fails) {
      console.error(shortDescription(fail));
      console.error(fail.error.stack);
    }
  });
})(this);