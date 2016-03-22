module.exports = function(grunt) {
  var BANNER = grunt.file.read('src/banner.js');
  var tmp = grunt.option('injectors');
  console.log('tmp = '+tmp);
  var injectors = tmp ? tmp.split(',').map(function(x) {
    return 'src/injectors/' + x + 'Injector.js';
  }) : [];
  console.log('injectors = '+injectors);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        banner: BANNER
      },
      injectors: {
        src: injectors,
        dest: 'build/baseinjectors.js'
      }
    },
    uglify: {
      options: {
        banner: BANNER,
        sourceMap: true
      },
      build: {
        files: {
          'build/base.min.js': 'src/base.js',
          'build/baseinjectors.min.js': 'build/baseinjectors.js'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.registerTask('build', ['concat:injectors', 'uglify:build']);
};
