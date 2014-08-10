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
                'test/init-mocks.js',
                'app/libs/injector.js',
                'app/libs/string-escape.js',
                'app/sum-backend-client.js',
                'app/sum-backend-helpers.js',
                'app/sum-backend-server.js',
                'app/sum-backend-userlist-file.js',
                'app/sum-backend-userlist-web.js',
                'app/sum-backend-storage.js',
                'app/sum-backend-crypto.js',
                'app/sum-backend-filesystem.js',
                'app/sum-backend.js',
                'app/sum-emoticons.js',
                'app/sum-frontend-events.js',
                'app/sum-frontend-helpers.js',
                'app/sum-frontend-command.js',
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
                    'app/libs/highlight/highlight.pack.js', 
                    'app/libs/jquery.waitforimages/jquery.waitforimages.js'
                ]
            },
            coverage: {
                src: [
                    'test/init-mocks.js',
                    'app/libs/injector.js',
                    'app/libs/string-escape.js',
                    'app/sum-backend-client.js',
                    'app/sum-backend-helpers.js',
                    'app/sum-backend-server.js',
                    'app/sum-backend-userlist.js',
                    'app/sum-backend-storage.js',
                    'app/sum-backend-crypto.js',
                    'app/sum-backend-filesystem.js',
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
                        report: 'bin/coverage'
                        /*,thresholds: {
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
            src: ['./app/**', 
                  './gamez/**', 
                  './package.json', 
                  './config.ini', 
                  './node_modules/ini/**', 
                  './node_modules/lockfile/**', 
                  './node_modules/node-rsa/**', 
                  './node_modules/base64-stream/**',
                  './node_modules/request/**'
            ]
        },

        /* create setup file with inno setup */
        shell: {
            build_setup: {
                command: 'call compil32 /cc setup.iss'
            }
        },
        
        /* version text replace */
        replace: {
            version: {
                src: [
                    'setup.iss',
                    'package.json',
                    'README.md'
                ],
                overwrite: true,
                replacements: [{
                    from: /\d+\.\d+\.\d+(\-SNAPSHOT)?/,
                    to: ("" + grunt.option('newversion'))
                }]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-node-webkit-builder');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-text-replace');

    /* task checks whether newversion is given and start replacement in files if correct format is given */
    grunt.registerTask('versionupdater', 'version update task', function() {
        var version = "" + grunt.option('newversion');
        if (typeof grunt.option('newversion') != 'undefined') {
            grunt.log.writeln('replace version ' + grunt.option('newversion'));
            if (version.search(/^\d+\.\d+\.\d+(\-SNAPSHOT)?$/) == -1)
                grunt.fail.warn('newversion must have the format n.m.x or n.m.x-SNAPSHOT (n, m and x are integer numbers)');
            grunt.task.run('replace');
        }
    });

    grunt.registerTask('default', ['versionupdater', 'jasmine', 'jshint', 'nodewebkit', 'shell']);
    grunt.registerTask('check', ['jasmine', 'jshint']);
    grunt.registerTask('version', ['versionupdater']);

};
