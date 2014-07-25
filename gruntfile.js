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

        /* jasmine unit tests */
        jasmine : {
            src: [
                'test/require-mock.js',
                'app/injector.js',
                'app/string-escape.js',
                'app/config.js',
                'app/sum-backend-client.js',
                'app/sum-backend-helpers.js',
                'app/sum-backend-server.js',
                'app/sum-backend-userlist.js',
                'app/sum-backend.js',
                'app/sum-emoticons.js',
                'app/sum-frontend-events.js',
                'app/sum-frontend-helpers.js',
                'app/sum-frontend.js'
            ],
            options: {
                specs: 'test/*.js',
                vendor: [
                    'app/libs/class.js', 
                    'app/libs/jquery-2.1.0.min.js', 
                    'app/libs/jquery-custom-content-scroller/jquery.mousewheel.min.js', 
                    'app/libs/jquery-custom-content-scroller/jquery.mCustomScrollbar.min.js', 
                    'app/libs/alertify/alertify.min.js', 
                    'app/libs/jcrop/jquery.Jcrop.min.js', 
                    'app/libs/selectize/selectize.js', 
                    'app/libs/crypto-js/md5.js', 
                    'app/libs/highlight/highlight.pack.js', 
                    'app/libs/jquery.waitforimages/jquery.waitforimages.js', 
                    'app/libs/hyphenator/hyphenator.js'
                ]
            },
            coverage: {
                src: [
                    'test/require-mock.js',
                    'app/injector.js',
                    'app/string-escape.js',
                    'app/config.js',
                    'app/sum-backend-client.js',
                    'app/sum-backend-helpers.js',
                    'app/sum-backend-server.js',
                    'app/sum-backend-userlist.js',
                    'app/sum-backend.js',
                    'app/sum-emoticons.js',
                    'app/sum-frontend-events.js',
                    'app/sum-frontend-helpers.js',
                    'app/sum-frontend.js'
                ],
                options: {
                    template: require('grunt-template-jasmine-istanbul'),
                    templateOptions: {
                        coverage: 'bin/coverage/coverage.json',
                        report: 'bin/coverage',
                        /*thresholds: {
                            lines: 50,
                            statements: 50,
                            branches: 50,
                            functions: 50
                        }*/
                    }
                }
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
            src: ['./app/**', './package.json', './node_modules/lockfile/**', './node_modules/node-rsa/**']
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
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-template-jasmine-istanbul');

    grunt.registerTask('default', ['jasmine', 'jshint', 'nodewebkit', 'shell']);
    grunt.registerTask('check', ['jasmine', 'jshint']);

};
