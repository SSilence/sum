/**
 * messages for the frontend
 *
 * @copyright  Copyright (c) Tobias Zeising (http://www.aditu.de)
 * @copyright  Copyright (c) Andreas Schiefele
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
define('sum-frontend-messages', Class.extend({

    /**
     * the current backend
     */
    backend: injected('sum-backend'),


    /**
     * the current frontend helpers
     */
    frontendHelpers: injected('sum-frontend-helpers'),


    /**
     * renders a single message
     * @param message given message for rendering
     * @returns {string} rendered message
     */
    renderMessage: function (message) {
        // don't render file invite cancel
        if (message.type === 'file-invite-cancel')
            return '';

        var markup = '<li id="' + message.id + '" class="entry">';

        // render message depending on his type
        if(message.type === 'text-message' || message.type === 'message')
            markup += this.renderTextMessage(message);
        else if(message.type === 'codeblock-message')
            markup += this.renderCodeBlockMessage(message);
        else if(message.type === 'system')
            markup += this.renderSystemMessage(message);
        else if(message.type === 'file-invite')
            markup += this.renderFileInvite(message);
        
        markup += '</li>';
        return markup;
    },


    /**
     * renders a text message
     * @param message given message
     * @param escape (boolean) true for escaping text, false for not
     * @returns {string} text message markup
     */
    renderTextMessage: function (message, escape) {
        var text = message.text;

        if (typeof escape == 'undefined' || escape === true) {
            text = text.escape();
            text = this.frontendHelpers.urlify(text);
            text = this.frontendHelpers.emoticons(text);
        }

        var signed = '';
        if (typeof message.signed !== 'undefined' && message.signed === true)
            signed = '<span class="entry-sign ion-checkmark-round"></span>';
        else if (typeof message.signed !== 'undefined')
            signed = '<span class="entry-sign-fail ion-close-round"></span>';
        
        var markup = '<div class="entry-avatar">\
            <img src="' + this.backend.getAvatar(message.sender) + '" class="avatar" />\
        </div>\
        <div class="entry-contentarea" lang="de">\
            <span class="entry-sender">' + message.sender.escape() + '</span>\
            <span class="entry-datetime" title="' + new Date(message.datetime).toLocaleString() + '">\
                ' + this.frontendHelpers.dateAgo(message.datetime) + '\
            </span>\
                ' + signed + '\
            <div class="entry-content">\
                ' + text + '\
            </div>\
        </div>';
        
        return markup;
    },


    /**
     * renders source code block
     * @param message source code
     * @returns {string} source code block markup
     */
    renderCodeBlockMessage: function (message) {
        var text = message.text;

        // format code
        if (message.language != 'undefined' && message.language != 'auto')
            text = hljs.highlight(message.language, text).value;
        else
            text = hljs.highlightAuto(text).value;
        
        var formattedMessage = $.extend({}, message);
        formattedMessage.text = '<pre><code class="has-numbering">' + text + '</code></pre>';
        return this.renderTextMessage(formattedMessage, false);
    },
    
    
    /**
     * renders file invite
     * @param message source code
     * @returns {string} source code block markup
     */
    renderFileInvite: function (message) {
        // show filename
        message.text = lang.frontend_messages_new_download;
        message.text = message.text + '<div class="entry-file-label">' + message.path + ' (' + this.frontendHelpers.humanFileSize(message.size) + ')</div>';
        
        // render sent invite
        if(this.backend.isCurrentUser(message.sender)) {
            // show downloader
            if (typeof message.loaded !== 'undefined')
                message.text = message.text + lang.frontend_messages_downloaded_by + message.loaded.join(', ');
            
            // canceled
            if (typeof message.canceled === 'undefined') {
                message.text = message.text + '<input class="cancel entry-file-cancel" type="button" value="abbrechen" />';
            } else {
                message.text = message.text + '<div class="entry-file-canceled">' + lang.frontend_messages_download_canceled + '</div>';
            }
        
        // render received invite
        } else {
            // download in progress
            if (typeof message.progress === 'number' && message.progress < 99) {
                message.text = message.text + '<div class="entry-file-progress" style="width:' + message.progress + '%"></div>';
                message.text = message.text + '<input class="cancel entry-file-cancel-download" type="button" value="abbrechen" />';
            
            // canceled
            } else if (typeof message.canceled !== 'undefined' && message.progress !== 100) {
                message.text = message.text + '<div class="entry-file-canceled">' + lang.frontend_messages_download_canceled + '</div>';
            
            // ready for download
            } else if (typeof message.progress === 'undefined' || message.progress === 0) {
                message.text = message.text + '<input class="save entry-file-download" type="button" value="' + lang.frontend_messages_download + '" />';
            
            // open
            } else if (typeof message.saved !== 'undefined' && message.progress === 100) {
                message.text = message.text + '<input class="save entry-file-open" type="button" value="' + lang.frontend_messages_open + '" /> <input class="cancel entry-file-download" type="button" value="' + lang.frontend_messages_download_again + '" />';
            }
        }

        return this.renderTextMessage(message, false);
    },
    
    
    /**
     * renders command result
     * @param message command result
     * @returns {string} command markup
     */
    renderSystemMessage: function(message) {
        var markup = '<div class="entry-contentarea" lang="de">\
            <div class="entry-status">\
                ' + message.text + '\
            </div>';
        return markup;
    }
}));