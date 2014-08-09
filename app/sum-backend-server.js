if (typeof net == 'undefined') net = require('net');
if (typeof http == 'undefined') http = require('http');
if (typeof crypto == 'undefined') crypto = require('crypto');
if (typeof stream == 'undefined') stream = require('stream');
if (typeof base64  == 'undefined') base64 = require('base64-stream');
if (typeof fs == 'undefined') fs = require('fs');

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
                    var reqStr = that.backendHelpers.rsadecrypt(that.backend.key, body);
                    req = JSON.parse(reqStr);
                } catch(e) {
                    that.backend.error('Ungueltige Nachricht erhalten (verschluesselung oder JSON konnte nicht verarbeitet werden)');
                    response.writeHeader(400, {"Content-Type": "text/plain"});
                    response.end();
                    return;
                }

                // check signature of request
                var signed = false;
                if (typeof req.sender === 'string' && typeof req.signature === 'string') {
                    var user = that.backend.getUser(req.sender);
                    if (user !== false) {
                        var usersKey = new NodeRSA(that.backend.getUser(req.sender).key);
                        signed = that.backendHelpers.verifyMessage(req, usersKey);
                    }
                }
                req.signed = signed;

                // is type given?
                if(typeof req.type != "undefined") {
                    that.handle(req, response);
                } else {
                    that.backend.error('invalid request received');
                    response.writeHeader(400, {"Content-Type": "text/plain"});
                    response.end();
                }
                
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
     * @param response object with the type
     */
    handle: function(request, response) {
        // new message
        // {
        //    'id' 'uuid',
        //    'type': 'text-message' or 'codeblock-message' or 'file-invite'
        //    'text': 'text',
        //    'sender': 'sender',
        //    'receiver': 'receiver',
        //    'language': 'auto' (for codeblock-message)
        //    'size': <size in bytes> (for file -invite)
        //    'signature': <signed by other user>
        //};
        if (request.type == 'text-message' || request.type == 'codeblock-message' || request.type == 'file-invite') {
            if (typeof request.sender == 'undefined' || typeof request.receiver == 'undefined' || 
                (typeof request.text == 'undefined' && request.type != 'file-invite')) {
                return this.sendError(request, response);
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

            // send ok
            response.writeHeader(200, {"Content-Type": "text/plain"});
            response.end();
            
            
        // room invite
        // {
        //     'id' 'uuid',
        //     'type': 'invite',
        //     'room': 'roomname',
        //     'sender': 'sender',
        //     'receiver': 'receiver'
        //     'signature': <signed by other user>
        // };
        } else if(request.type == 'invite') {
            if (typeof request.room == 'undefined' || typeof request.sender == 'undefined' || typeof request.receiver == 'undefined') {
                return this.sendError(request, response);
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
            
            // send ok
            response.writeHeader(200, {"Content-Type": "text/plain"});
            response.end();
                    
            
            
        // cancel file invitation
        // {
        //     'id' 'uuid',
        //     'type': 'file-invite-cancel',
        //     'file': '<file uuid>'
        //     'signature': <signed by other user>
        // };
        } else if(request.type == 'file-invite-cancel') {
            if (typeof request.file == 'undefined') {
                return this.sendError(request, response);
            }
            
            this.backend.cancelFileInvite(request.file);
            
            response.writeHeader(200, {"Content-Type": "text/plain"});
            response.end();
            
        
        
        // request invited file (send file client was invited)
        // {
        //     'id' 'uuid',
        //     'type': 'file-request',
        //     'file': '<file uuid>'
        // };
        } else if(request.type == 'file-request') {
            if (typeof request.file == 'undefined') {
                return this.sendError(request, response);
            }
            
            // create aes encription stream (password is file id, thats save because file id will be sent rsa encrypted)
            var base64  = require('base64-stream');
            var crypto = require('crypto');
            var aes = crypto.createCipher('aes-256-cbc', crypto.createHash('sha256').update(request.file).digest('hex'));
            
            // file is still available?
            var msg = this.backend.getMessage(request.file);
            if (msg === false || msg.canceled === true || fs.existsSync(msg.path) === false) {
                response.writeHeader(404, {"Content-Type": "text/plain"});
                response.end();
                return;
            }
            
            // stream file
            fs.createReadStream(msg.path)
              .pipe(aes)                // encrypt
              .pipe(base64.encode())    // encode base64
              .pipe(response);          // send
       
            // handler on file was send successfully
            this.backend.finishedFileRequest(request.file, request.sender);
            
        
        
        // accept room invite
        // {
        //     'id' 'uuid',
        //     'type': 'invite-accept',
        //     'room': 'roomname',
        //     'sender': 'sender',
        //     'receiver': 'receiver'
        //     'signature': <signed by other user>
        // };
        } else if(request.type == 'invite-accept') {
            this.backend.renderSystemMessage(request.sender + ' hat die Einladung angenommen', request.room);
        
        
        
        // decline room invite
        // {
        //     'id' 'uuid',
        //     'type': 'invite-decline',
        //     'room': 'roomname',
        //     'sender': 'sender',
        //     'receiver': 'receiver'
        //    'signature': <signed by other user>
        // };
        } else if(request.type == 'invite-decline') {
            this.backend.renderSystemMessage(request.sender + ' hat die Einladung abgelehnt', request.room);
        
        
        
        } else
            this.backend.error('Ungültigen Nachrichtentyp erhalten: ' + JSON.stringify(request));
    },

    
    /**
     * send error response
     * @param (object) request
     * @param (object) response
     */
    sendError: function(request, response) {
        this.backend.error('Ungültige Nachricht erhalten: ' + JSON.stringify(request));
        response.writeHeader(400, {"Content-Type": "text/plain"});
        response.end();
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
