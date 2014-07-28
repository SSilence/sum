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


    /**
     * renders a single message
     * @param message given message for rendering
     * @returns {string} rendered message
     */
    renderMessage: function (message) {
        var markup = '<li id="' + message.id + '" class="entry">';
        switch(message.type) {
            case 'text-message':
            case 'message':
                markup += this.renderTextMessage(message);
            break;
            case 'codeBlock-message':
                markup += this.renderCodeBlockMessage(message);
            break;
        }
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
            text = Hyphenator.hyphenate(text, 'de');
            text = this.frontendHelpers.emoticons(text);
            text = this.frontendHelpers.urlify(text);
        }

        var markup = '<div class="entry-avatar">\
            <img src="' + this.backend.getAvatar(message.sender) + '" class="avatar" />\
        </div>\
        <div class="entry-contentarea hyphenate" lang="de">\
            <span class="entry-sender">' + message.sender.escape() + '</span>\
            <span class="entry-datetime" title="' + new Date(message.datetime).toLocaleString() + '">\
                ' + this.frontendHelpers.dateAgo(message.datetime) + '\
            </span>\
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
        if (message.parameters.language != 'undefined' && message.parameters.language != 'auto')
            text = hljs.highlight(message.parameters.language, text).value;
        else
            text = hljs.highlightAuto(text).value;

        var formattedMessage = $.extend({}, message);
        formattedMessage.text = '<pre><code class="donthyphenate has-numbering">' + text + '</code></pre>';
        return this.renderTextMessage(formattedMessage, false);
    }

}));