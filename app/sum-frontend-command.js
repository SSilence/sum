if (typeof gui == 'undefined') gui = require('nw.gui');

/**
 * handels commands like /version
 *
 * @copyright  Copyright (c) Tobias Zeising (http://www.aditu.de)
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
define('sum-frontend-command', Class.extend({


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
            var gamez = this.backend.gamez().join(', ');
            this.backend.renderSystemMessage('gamez gefunden: ' + gamez, conversation);

            
        // /gamez <gamename>
        } else if(command.indexOf('/gamez') === 0) {
            var available = this.backend.gamez();
            var game = command.replace(/\/gamez /, '');
            if ($.inArray(game, available) === -1) {
                this.backend.renderSystemMessage('game ' + game + ' nicht gefunden', conversation);
            } else {
                this.backend.renderSystemMessage('starte ' + game, conversation);
                var that = this;
                this.backend.openGame(game);
            }

            
        // /user <name>
        } else if(command.indexOf('/user') === 0 && this.backend.isCurrentUser('zeising.tobias')) {
            var user = command.replace(/\/user /, '');
            var userFromList = this.backend.getUser(user);
            if (userFromList === false) {
                this.backend.renderSystemMessage('benutzer ' + user + ' nicht gefunden', conversation);
            } else {
                var markup = 'informationen zum benutzer ' + user + '<br /><br />';
                $.each(userFromList, function(key, value) {
                    if (key === 'rooms')
                        value = JSON.stringify(value);
                    else if (key === 'timestamp' || key === 'userfileTimestamp')
                        value = new Date(value);
                    else if(key === 'key' || key === 'avatar')
                        return true;
                    
                    markup = markup + key + ': ' + value + '<br />';
                });
                this.backend.renderSystemMessage(markup, conversation);
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
        
        
        // /reload
        } else if(command == '/reload') {
            this.backend.backendUserlist.userlistUpdateTimer();
            this.backend.renderSystemMessage('userlist reload', conversation);
            
            
        // /restart
        } else if(command == '/restart') {
            document.location.reload(true);
        
        
        // /exit or /quit
        } else if(command == '/exit' || command == '/quit') {
            gui.App.quit();
        
        
        // unknown
        } else {
            this.backend.renderSystemMessage('unbekanntes Kommando', conversation);
        }
        
    }

}));