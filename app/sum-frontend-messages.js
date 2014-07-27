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
                markup = markup + that.renderMessage(message);
            });
        }

        if (typeof markup != 'undefined')
            position.append(markup);
    },


    showMessage: function (message, position) {
        if (typeof position != 'undefined')
            position = $('#content');

        if (typeof message != 'undefined') {
            var markup = this.renderMessage(message);

            if (typeof markup != 'undefined')
                position.append(markup);
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
            }
        }

        return markup;
    },


    renderTextMessage: function (message) {
        var markup = '<li id="' + message.id + '" class="entry">\
            <div class="entry-avatar">\
                <img src="' + this.backend.getAvatar(message.sender) + '" class="avatar" />\
            </div>\
            <div class="entry-contentarea hyphenate" lang="de">\
                <span class="entry-sender">' + message.sender.escape() + '</span>\
                <span class="entry-datetime">' + this.frontendHelpers.dateAgo(message.datetime) + '</span>\
                <div class="entry-content">\
                    ' + this.frontendHelpers.formatMessage(message.text) + '\
                </div>\
            </div>\
        </li>';

        return markup;
    }

}));