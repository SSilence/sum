module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        /* js hint js file check */
        jshint: {
            files: ['gruntfile.js', 'app/sum*.js'],
            options: {
                globals: {
                    jQuery: true,
                    console: true,
                    module: true,
                },
                loopfunc: true,
                multistr: true
            }
        },

        /* build node webkit sum package */
        nodewebkit: {
            options: {
                build_dir: './bin',
                mac: false,
                win: true,
                linux32: false,
                linux64: false
            },
            src: ['./**'] // Your node-webkit app
        },

        /* create setup file with inno setup */
        shell: {
            build_setup: {
                command: 'call compil32 /cc setup.iss'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-node-webkit-builder');
    grunt.loadNpmTasks('grunt-shell');

    grunt.registerTask('default', ['jshint', 'nodewebkit']);
    grunt.registerTask('setup', ['shell']);

};
