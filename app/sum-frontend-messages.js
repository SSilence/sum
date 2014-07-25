/**
 * messages for the frontend
 *
 * @copyright  Copyright (c) Andreas Schiefele
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
define('sum-frontend-messages', Class.extend({

    showMessages: function (messages, position) {
        if (typeof position != 'undefined')
            position = $('#content');

        if (typeof messages != 'undefined') {
            var markup = '';

            $.each(messages, function (index, message) {
                markup = markup + this.renderMessage(message);
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
        if (typeof message != 'undefined') {
            switch(message.messageType) {
                case 'text-message':
                    this.renderTextMessage(message);
                break;
            }
        }
    },

    renderTextMessage: function (message) {
        var markup;

        return markup;
    }

}));