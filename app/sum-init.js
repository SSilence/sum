if (typeof gui == 'undefined') gui = require('nw.gui');
if (typeof ini == 'undefined') ini = require('ini');
if (typeof fs == 'undefined') fs = require('fs');
if (typeof path == 'undefined') path = require('path');
if (typeof os == 'undefined') os = require('os');

/**
 * startup sim
 *
 * @copyright  Copyright (c) Tobias Zeising (http://www.aditu.de)
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
$(document).ready(function() {
    
    // read config
    
    // get default config
    config = ini.parse(fs.readFileSync('./app/default.ini', 'utf-8'));

    // helper returns true if file exists, false otherwise
    var fileExists = function(filename) {
        try {
            fs.accessSync(filename);
        } catch(e) {
            return false;
        }
        return true;
    };
    
    // for linux or osx overwrite values from ~/.sum.ini configuration file
    if (os.platform() == 'linux' || os.platform() == 'darwin')
        if (fileExists(process.env.HOME + '/.sum.ini'))
            $.extend(config, ini.parse(fs.readFileSync(process.env.HOME + '/.sum.ini', 'utf-8')));
        
    // overwrite values from second, optional config.ini
    if (fileExists('./config.ini'))
        $.extend(config, ini.parse(fs.readFileSync('./config.ini', 'utf-8')));
    
    var additionalConfig = path.dirname(process.execPath) + '/config.ini';
    if (fileExists(additionalConfig))
        $.extend(config, ini.parse(fs.readFileSync(additionalConfig, 'utf-8')));
    
    
    // load alternative config given by command line?
    if (gui.App.argv.length > 0) {

        // argument is absolute config file?
        if (fileExists(gui.App.argv[0])) {
            $.extend(config, ini.parse(fs.readFileSync(gui.App.argv[0], 'utf-8')));
        
        // argument is relative config file?
        } else if (fileExists(path.dirname(process.execPath) + '/' + gui.App.argv[0])) {
            $.extend(config, ini.parse(fs.readFileSync(path.dirname(process.execPath) + '/' + gui.App.argv[0], 'utf-8')));
            
        // otherwise use argument as username
        } else {
            config.username = gui.App.argv[0];
        }
    }

    // convert int values to int type
    $.each(config, function(key, value) {
        if (value % 1 === 0)
            config[key] = parseInt(value);
    });

    
    // read language file and replace index.html language tags
    lang = require('./lang/en.js');
    lang = $.extend(lang, require('./lang' + '/' + config.language));
    $('body > *:not(script)').each(function(index, item) {
        $(item).html($(item).html().replace(/\{lang.([^\}]+)\}/g, function(all, key) {
            return lang[key];
        }));
    });
    config.room_all = lang.room_all;
    
    
    
    // start application
    
    // start application
    var backend = inject('sum-backend');
    var frontend = inject('sum-frontend');
    
    // starts the application
    var startApplication = function() {
        backend.initialize();
        frontend.initialize();
        $('#main, #nav').show();
        $('#splash, #login').hide();
        inject('sum-frontend-events').resize();
    };

    // initialize window position and size
    var position = backend.backendStorage.loadWindowPosition();
    var size = backend.backendStorage.loadWindowSize();
    if (position !== false)
        gui.Window.get().moveTo(position.x, position.y);
    if (size !== false)
        gui.Window.get().resizeTo(size.width, size.height);
    
    
    
    // login
    
    // show login?
    if (backend.showLogin()) {
        $('#login').show();
        $('#splash').hide();
        
        // login button
        $('#login input.save').click(function() {
            if (backend.loadKey($('#login .password').val()) === false)
                $('#login .error').html(lang.frontend_login_invalid_login);
            else
                startApplication();  
        });
        
        // password input field: enter
        $('#login .password').keydown(function(e) {
            if(e.which == 13)
                $('#login input.save').click();
        });
        
        // reset button
        $('#login .reset').click(function() {
            if(confirm(lang.frontend_login_confirm_reset_key) !== true)
                return;
            backend.removeKey();
            startApplication();
        });
        
        // initial focus password field
        $('#login .password').focus();
    
    // otherwise start application
    } else {
        startApplication();
    }
});
