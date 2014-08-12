if (typeof gui == 'undefined') gui = require('nw.gui');
if (typeof ini == 'undefined') ini = require('ini');
if (typeof fs == 'undefined') fs = require('fs');

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

    // overwrite values from second, optional config.ini
    if (fs.existsSync('./config.ini')) {
        var additionalConfig = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));
        $.extend(config, additionalConfig);
    }

    // load alternative config given by command line?
    if (gui.App.argv.length > 0) {

        // argument is config file?
        if (fs.existsSync(gui.App.argv[0])) {
            var externalConfig = ini.parse(fs.readFileSync(gui.App.argv[0], 'utf-8'));
            $.extend(config, externalConfig);

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
    };
    
    
    
    // login
    
    // show login?
    if (backend.showLogin()) {
        $('#login').show();
        $('#splash').hide();
        
        // login button
        $('#login input.save').click(function() {
            if (backend.loadKey($('#login .password').val()) === false)
                $('#login .error').html('Schl&uuml;ssel konnte nicht geladen werden. Ung&uuml;ltiges Passwort?');
            else
                startApplication();  
        });
        
        $('#login .password').keydown(function(e) {
            if(e.which == 13)
                $('#login input.save').click();
        });
        
        $('#login .password').focus();
        
        // reset button
        $('#login .reset').click(function() {
            if(confirm("Soll der Schlüssel wirklich zurückgesetzt werden?") !== true)
                return;
            backend.removeKey();
            startApplication();
        });
        
        return;
    
    
    // otherwise start application
    } else {
        startApplication();
    }
});
