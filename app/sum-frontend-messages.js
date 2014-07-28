/**
 * messages for the frontend
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


    updateMessage: function (message) {
        if (typeof message != 'undefined' && $('#' + message.id).length) {
            var oldMessage = $('#' + message.id);
            var newMessage = this.renderMessage(message);

            oldMessage.html('');
            oldMessage.append(newMessage);
        }
    },


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