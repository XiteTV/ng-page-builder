module.exports = function(grunt) {

    grunt.initConfig({
        pkg : grunt.file.readJSON('package.json'),
        copy : {
            build: {
                expand: true,
                files: [
                    { src: '.tmp/app.js', dest: 'dist/<%= pkg.name %>.js' },
                ]
            }
        },
        concat: {
            build: {
                src : [
                    'bower_components/angular-resource/angular-resource.js',
                    'bower_components/angular-cached-resource/angular-cached-resource.js',
                    'src/js/*.js',
                    'src/js/*/*.js',
                    '.tmp/templates.js'
                ],
                dest :'.tmp/app.js'
            }
        },
        clean: {
            pre: ['./dist'],
            post: ['./.tmp']
        },
        ngtemplates:  {
            build:        {
                cwd: 'src',
                src:      'partials/**/*.html',
                dest:     '.tmp/templates.js',
                options : {
                    module : 'npb'
                }
            }
        },
        uglify: {
            options : {
                mangle : false,
                report : 'gzip'
            },
            build :{

                files : {
                    'dist/<%= pkg.name %>.min.js' : '.tmp/app.js'
                }
            }
        },
        bump : {
            options : {
                files : ['package.json', 'bower.json'],
                updateConfigs : ['pkg'],
                commitFiles: ['-a'],
                tagName : '%VERSION%',
                push: 'tag',
                pushTo: 'origin'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-angular-templates');
    grunt.loadNpmTasks('grunt-bump');

    grunt.registerTask('build',['clean:pre','ngtemplates:build','concat:build','copy:build','uglify:build','clean:post']);

    grunt.registerTask('patch',['build','bump:patch']);
    grunt.registerTask('minor',['build','bump:minor']);
    grunt.registerTask('major',['build','bump:major']);
};