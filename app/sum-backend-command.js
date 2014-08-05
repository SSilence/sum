if (typeof gui == 'undefined') gui = require('nw.gui');

/**
 * handels commands like /version
 *
 * @copyright  Copyright (c) Tobias Zeising (http://www.aditu.de)
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
define('sum-backend-command', Class.extend({
    
    /**
     * backends helpers
     */
    backendHelpers: injected('sum-backend-helpers'),
    
    
    /**
     *  the current backend
     */
    backend: injected('sum-backend'),
    
    
    /**
     * execute command.
     * @param (string) command given by message input
     * @param (string) current conversation
     */
    handle: function(command, conversation) {
        
        // /gamez
        if (command === '/gamez') {
            var gamez = this.backendHelpers.getDirectories('./gamez/').join(', ');
            this.backend.renderSystemMessage('gamez gefunden: ' + gamez, conversation);

            
        // /gamez <gamename>
        } else if(command.indexOf('/gamez') === 0) {
            var available = this.backendHelpers.getDirectories('./gamez/');
            var game = command.replace(/\/gamez /, '');
            if ($.inArray(game, available) === -1) {
                this.backend.renderSystemMessage('game ' + game + ' nicht gefunden', conversation);
            } else {
                var that = this;
                that.backendHelpers.readJsonFile(
                    './gamez/' + game + '/window.js',
                    function(window) {
                        that.openGameWindow(game, window.width, window.height);
                    },
                    function() {
                        that.openGameWindow(game);
                    });
            }

            
        // /version
        } else if(command == '/version') {
            this.backend.renderSystemMessage('version: ' + this.backend.version, conversation);

            
        // /versions
        } else if(command == '/versions') {
            var versions = "";
            $.each(this.backend.userlist, function(index, user) {
                versions = versions + user.username + ': ' + user.version + '<br />\n';
            });
            this.backend.renderSystemMessage('versions of users<br />\n' + versions, conversation);
        
        
        // /restart
        } else if(command == '/restart') {
            document.location.reload(true);
        }
        
    },
    
    
    /**
     * shows game dialog window with given game
     * @param game (string) game name
     * @param width (int) windows width
     * @param height (int) windows height
     */
    openGameWindow: function(game, width, height) {
        gui.Window.open('../gamez/' + game + '/index.html', {
            position: 'center',
            width: typeof width === 'undefined' ? 700 : width,
            height: typeof height === 'undefined' ? 500 : height,
            focus: true,
            toolbar: false,
            frame: true
        });
    }

}));