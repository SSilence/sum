/**
 * messages for the frontend, user showMessages(messages, position) for render the markup for the type of message
 * in that position of choice. You can leaf the position blank for default position (#content).
 *
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
     * Shows all given messages on the given position, decides between messageTypes
     * @param messages (list) the message-list
     * @param position (object) the position to show the messages (if not defined, default: #content)
     */
    showMessages: function (messages, position) {
        if (typeof position == 'undefined')
            position = $('#content');

        if (typeof messages != 'undefined') {
            var markup = '';
            var that = this;
            $.each(messages, function (index, message) {
                markup = markup + '<li id="' + message.id + '" class="entry">\
                    ' + that.renderMessage(message) + '\
                </li>';
            });
        }

        if (typeof markup != 'undefined')
            position.append(markup);
    },


    /**
     * Show the one given message on the given position, decides between messageTypes
     * @param message (message) the message to show
     * @param position (object) the position to show the messages (if not defined, default: #content)
     */
    showMessage: function (message, position) {
        if (typeof position != 'undefined')
            position = $('#content');

        if (typeof message != 'undefined') {
            var markup = '<li id="' + message.id + '" class="entry">\
                    ' + this.renderMessage(message) + '\
                </li>';

            if (typeof markup != 'undefined')
                position.append(markup);
        }
    },


    /**
     * Update the given message in the displayed conversation
     * @param message (message) the message
     */
    updateMessage: function (message) {
        if (typeof message != 'undefined' && $('#' + message.id).length) {
            var oldMessage = $('#' + message.id);
            var newMessage = this.renderMessage(message);

            oldMessage.html('');
            oldMessage.append(newMessage);
        }
    },


    /**
     * renders the message, give the markup for the messageType back
     * @param message (message)
     * @returns {string} the markup for the given message
     */
    renderMessage: function (message) {
        var markup = '';

        if (typeof message != 'undefined') {
            switch(message.type) {
                case 'text-message':
                case 'message':
                    markup = this.renderTextMessage(message);
                break;
                case 'codeBlock-message':
                    markup = this.renderCodeBlockMessage(message);
                break;
            }
        }

        return markup;
    },


    /**
     * render the markup for a text-messages
     * @param message (message) the text-message
     * @returns {string} the markup for the text-message
     */
    renderTextMessage: function (message) {
        var text = message.text;

        text = text.escape();
        text = this.frontendHelpers.emoticons(text);
        text = this.frontendHelpers.urlify(text);

        var markup = '<div class="entry-avatar">\
            <img src="' + this.backend.getAvatar(message.sender) + '" class="avatar" />\
        </div>\
        <div class="entry-contentarea hyphenate" lang="de">\
            <span class="entry-sender">' + message.sender.escape() + '</span>\
            <span class="entry-datetime">' + this.frontendHelpers.dateAgo(message.datetime) + '</span>\
            <div class="entry-content">\
                ' + text + '\
            </div>\
        </div>';

        return markup;
    },


    /**
     * render the markup for a codeBlock-messages
     * @param message (message) the codeBlock-message
     * @returns {string} the markup for the codeBlock-message
     */
    renderCodeBlockMessage: function (message) {
        var text = message.text;

        // format code
        if (message.parameters.language != 'undefined' && message.parameters.language != 'auto')
            text = hljs.highlight(message.parameters.language, text).value;
        else
            text = hljs.highlightAuto(text).value;

        var markup = '<div class="entry-avatar">\
            <img src="' + this.backend.getAvatar(message.sender) + '" class="avatar" />\
        </div>\
        <div class="entry-contentarea hyphenate" lang="de">\
            <span class="entry-sender">' + message.sender.escape() + '</span>\
            <span class="entry-datetime">' + this.frontendHelpers.dateAgo(message.datetime) + '</span>\
            <div class="entry-content">\
                <pre><code class="donthyphenate has-numbering">' + text + '</code></pre>\
            </div>\
        </div>';

        return markup;
    }

}));