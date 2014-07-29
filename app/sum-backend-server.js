if (typeof net == 'undefined') net = require('net');
if (typeof http == 'undefined') http = require('http');

/**
 * server for receiving encrypted chat messages and status updates from other users
 *
 * @copyright  Copyright (c) Tobias Zeising (http://www.aditu.de)
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
define('sum-backend-server', Class.extend({

    /**
     * backend
     */
    backend: injected('sum-backend'),


    /**
     * backends helpers
     */
    backendHelpers: injected('sum-backend-helpers'),


    /**
     * start chat message server
     * @param success (function) callback with port
     */
    start: function(success) {
        var that = this;

        // create new http server
        var server = http.createServer(function (request, response) {
            var body = '';

            // data chunk received
            request.addListener('data', function(chunk){
                body += chunk;
            });

            // error occured
            request.addListener('error', function(error){
                that.backend.error('server init error: ' + error);
                next(error);
            });

            // last data chunk received
            request.addListener('end', function(chunk){
                if (chunk)
                    body += chunk;

                // parse decrypted json
                var req = {};
                try {
                    var reqStr = that.backendHelpers.decrypt(that.backend.key, body);
                    req = JSON.parse(reqStr);
                } catch(e) {
                    that.backend.error('Ungueltige Nachricht erhalten (verschluesselung oder JSON konnte nicht verarbeitet werden)');
                    response.writeHeader(400, {"Content-Type": "text/plain"});
                    response.end();
                    return;
                }

                // is type given?
                if(typeof req.type != "undefined") {
                    that.handle(req);
                    response.writeHeader(200, {"Content-Type": "text/plain"});
                } else {
                    that.backend.error('invalid request received');
                    response.writeHeader(400, {"Content-Type": "text/plain"});
                }

                // finish handling
                response.end();
            });
        });

        // start server
        this.findFreePort(function(port) {
            server.listen(port);
            success(port);
        });
    },


    /**
     * handle request
     * @param request object with the type
     */
    handle: function(request) {
        // new message
        // {
        //    'type': 'text-message', or 'codeblock-message'
        //    'text': 'text',
        //    'sender': 'sender',
        //    'receiver': 'receiver',
        //    'language': 'auto' (for codeblock-message)
        //};
        if (request.type == 'text-message' || request.type == 'codeblock-message') {
            if (typeof request.text == 'undefined' || typeof request.sender == 'undefined' || typeof request.receiver == 'undefined') {
                this.backend.error('Ungültige Nachricht erhalten: ' + JSON.stringify(request));
            }

            // conversation = sender
            var conversationId = request.sender;

            // conversation = receiver if it is a room
            if (this.backend.doesRoomExists(request.receiver))
                conversationId = request.receiver;

            if (typeof this.backend.conversations[conversationId] == 'undefined')
                this.backend.conversations[conversationId] = [];

            var message = $.extend(request, { datetime: new Date().getTime()});

            var conversation = this.backend.conversations[conversationId];
            this.backend.conversations[conversationId][conversation.length] = message;

            if(typeof this.backend.newMessage != "undefined")
                this.backend.newMessage(this.backend.conversations[conversationId][conversation.length-1]);


        // room invite
        // {
        //     'type': 'invite',
        //     'room': 'roomname',
        //     'sender': 'sender',
        //     'receiver': 'receiver'
        // };
        } else if(request.type == 'invite') {
            if (typeof request.room == 'undefined' || typeof request.sender == 'undefined' || typeof request.receiver == 'undefined') {
                this.backend.error('Ungültige Nachricht erhalten: ' + JSON.stringify(request));
            }

            // only accept one invitation per room
            if (this.backendHelpers.isUserInRoomList(this.backend.invited, request.room)) {
                return;
            }

            // insert invitation
            this.backend.invited[this.backend.invited.length] = {
                name: request.room,
                invited: request.sender
            };

            // show notification
            if(typeof this.backend.roomInvite != "undefined")
                this.backend.roomInvite(request.room, request.sender);

            // update roomlist
            this.backend.updateRoomlist();
        } else
            this.backend.error('Ungültigen Nachrichtentyp erhalten: ' + JSON.stringify(request));
    },


    /**
     * find a free port.
     * @param callback (function) callback with port
     */
    findFreePort: function(callback) {
        var server = net.createServer();
        var port = 0;

        server.on('listening', function() {
            port = server.address().port;
            server.close();
        });

        server.on('close', function() {
            callback(port);
        });

        server.listen(0);
    }
}));
