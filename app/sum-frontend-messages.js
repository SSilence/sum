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

        $.each(messages, function(index, message) {

        });
    },

    showMessage: function (message, position) {
        if (typeof position != 'undefined')
            position = $('#content');


    },

    renderMessage: function (message) {
      if (typeof message != 'undefined') {

          
      }
    }

}));