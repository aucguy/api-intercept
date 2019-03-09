const process = require('process');
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const jshint = require('jshint');
const jshintHtmlReporter = require('jshint-html-reporter');
const babel = require('@babel/core');
const uglify = require('uglify-js');
const beautify = require('js-beautify');

/**
 * returns the path to all files in the directory and subdirectories
 **/
function walk(directory) {
  var contents = [];
  for (var file of fs.readdirSync(directory)) {
    var name = path.join(directory, file);
    var stat = fs.lstatSync(name);
    if (stat.isDirectory()) {
      contents = contents.concat(walk(name));
    } else if (stat.isFile()) {
      contents.push(name);
    }
  }
  return contents;
}

function copyFile(src, dst) {
  fs.writeFileSync(dst, fs.readFileSync(src));
}

/**
 * copies the directory src to dst
 **/
function copyDir(src, dst) {
  if (!fs.existsSync(dst)) {
    mkdirsSync(dst);
  }
  for (var file of fs.readdirSync(src)) {
    var srcName = path.join(src, file);
    var dstName = path.join(dst, file);
    var stat = fs.lstatSync(srcName);
    if (stat.isDirectory()) {
      copyDir(srcName, dstName);
    } else if (stat.isFile()) {
      copyFile(srcName, dstName);
    }
  }
}

/**
 * creates the directory and all parent directories
 **/
function mkdirsSync(directory) {
  if (!fs.existsSync(directory)) {
    mkdirsSync(path.dirname(directory));
    fs.mkdirSync(directory);
  }
}

/**
 * Writes to a file while making any necessary parent directories
 **/
function writeFileMkdirsSync(filename, contents) {
  mkdirsSync(path.dirname(filename));
  fs.writeFileSync(filename, contents);
}

function mergeArrays(a, b) {
  return a.concat(b.filter(x => !a.includes(x)));
}

function getDependencies(dependencies, plugin) {
  var modules = [];
  if (dependencies.hasOwnProperty(plugin)) {
    for (var dep of dependencies[plugin]) {
      modules = mergeArrays(modules, getDependencies(dependencies, dep));
    }
  }
  return mergeArrays(modules, [plugin]);
}

const commands = {
  /**
   * runs jshint on the project.
   **/
  lint(args) {
    child_process.exec(`jshint src/ test/ build.js --reporter ${jshintHtmlReporter} > jshint.html`);
  },
  /**
   * formats the code. Also backs up the code before formating.
   **/
  format(args) {
    var file;
    var num = 0;
    if (fs.existsSync('backup')) {
      for (file of fs.readdirSync('backup')) {
        if (file.match(/[0-9]+/)) {
          num = Math.max(num, parseInt(file));
        }
      }
      num++;
    }

    var backupDir = path.join('backup', num.toString());
    copyDir('src', path.join(backupDir, 'src'));
    copyDir('test', path.join(backupDir, 'test'));
    copyFile('build.js', path.join(backupDir, 'build.js'));

    var config = JSON.parse(fs.readFileSync('.jsbeautifyrc'));

    for (file of ['build.js'].concat(walk('src')).concat(walk('test'))) {
      if (path.extname(file) === '.js') {
        var data = fs.readFileSync(file, {
          encoding: 'utf-8'
        });
        data = beautify.js(data, config);
        fs.writeFileSync(file, data);
      }
    }
  },
  /**
   * builds the project
   **/
  build(args) {
    if (args.properties.plugins === undefined) {
      console.error('plugins not specified');
      return;
    }

    var dependencies = JSON.parse(fs.readFileSync('dependencies.json', {
      encoding: 'utf-8'
    }));

    var plugins = args.properties.plugins.split(',');
    var notFound = plugins.filter(x => !dependencies.hasOwnProperty(x));

    if (notFound.length !== 0) {
      console.error(`could not find plugin(s) ${notFound.join(', ')}`);
      return;
    }

    var modules = [];
    for (var plugin of plugins) {
      modules = mergeArrays(modules, getDependencies(dependencies, plugin));
    }

    var moduleFiles = modules.map(x => path.join('src', x) + '.js')
      .filter(x => fs.existsSync(x));

    var code = moduleFiles.map(x => fs.readFileSync(x, {
      encoding: 'utf-8'
    })).join('\n\r');

    code = babel.transformSync(code, {
      presets: ['@babel/preset-env']
    }).code;

    if (!args.flags.includes('nocompress')) {
      var uglified = uglify.minify(code);
      if (code.error) {
        console.error(code.error);
        return;
      }
      code = uglified.code;
    }

    var output;
    if (args.properties.output !== undefined) {
      output = path.join('build', args.properties.output);
    } else {
      output = 'build/output.min.js';
    }
    writeFileMkdirsSync(output, code);
  }
};

/**
 * Parses the command line arguments
 *
 * @param args an array of command arguments
 * @returns an object.
 *      flags - the flags specified (ex: '--foo')
 *      properties - the properties specified (ex: '--foo=bar')
 *      ordered - the normal command line arguments (ex: foo bar)
 **/
function parseArgs(args) {
  var parsed = {
    flags: [],
    properties: {},
    ordered: []
  };
  for (var i = 2; i < args.length; i++) {
    var arg = args[i];
    //property
    if (arg.match(/^--[a-zA-Z]+=/)) {
      var [key, value] = arg.slice(2).split('=', 2);

      //check for enclosing quotes
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, value.length - 1);
      }
      parsed.properties[key] = value;
      //flag
    } else if (arg.match(/^--[a-zA-Z]+/)) {
      parsed.flags.push(arg.slice(2));
      //ordered
    } else {
      parsed.ordered.push(arg);
    }
  }
  return parsed;
}

function main() {
  var args = parseArgs(process.argv);
  if (args.ordered.length === 0) {
    console.error('no command specified');
    return;
  }
  var command = args.ordered[0];
  if (!(args.ordered[0] in commands)) {
    console.error(`unknown command: ${command}`);
    return;
  }
  commands[command](args);
}

main();