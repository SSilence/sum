var net = require('net');
var http = require('http');

/**
 * server for receiving encrypted chat messages and status updates from other users
 *
 * @copyright  Copyright (c) Tobias Zeising (http://www.aditu.de)
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
var BackendServer = Class.extend({
    
    /**
     * start chat message server
     * @param backend (object) the current backend
     * @param backendHelpers (object) the current backends helpers
     * @param success (function) callback with port
     */
    start: function(backend, backendHelpers, success) {
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
                backend.error('server init error: ' + error);
                next(err);
            });

            // last data chunk received
            request.addListener('end', function(chunk){
                if (chunk)
                    body += chunk;
                
                // parse decrypted json
                try {
                    var reqStr = backendHelpers.decrypt(backend.key, body);
                    var req = JSON.parse(reqStr);
                } catch(e) {
                    backend.error('Ungueltige Nachricht erhalten (verschluesselung oder JSON konnte nicht verarbeitet werden)');
                    response.writeHeader(400, {"Content-Type": "text/plain"});
                    response.end();
                    return;
                }
                
                // is type given?
                if(typeof req.type != "undefined") {
                    that.handle(backend, backendHelpers, req);
                    response.writeHeader(200, {"Content-Type": "text/plain"});  
                } else {
                    backend.error('invalid request received');
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
     * @param backend the current backend
     * @param backendHelpers (object) the current backends helpers
     * @param request object with the type
     */
    handle: function(backend, backendHelpers, request) {
        // new message
        // {
        //    'type': 'message',
        //    'text': 'text',
        //    'sender': 'sender',
        //    'receiver': 'receiver'
        //};
        if (request.type == 'message') {
            if (typeof request.text == 'undefined' || typeof request.sender == 'undefined' || typeof request.receiver == 'undefined') {
                backend.error('Ungültige Nachricht erhalten: ' + JSON.stringify(request));
            }
            
            // conversation = sender
            var conversationId = request.sender;
            
            // conversation = receiver if it is a room
            if (backend.doesRoomExists(request.receiver))
                conversationId = request.receiver;
            
            if (typeof backend.conversations[conversationId] == 'undefined') 
                backend.conversations[conversationId] = [];
            
            var conversation = backend.conversations[conversationId];
            backend.conversations[conversationId][conversation.length] = {
                'datetime': new Date().getTime(),
                'sender': request.sender,
                'receiver': request.receiver,
                'text': request.text
            };
            
            if(typeof backend.newMessage != "undefined")
                backend.newMessage(backend.conversations[conversationId][conversation.length-1]);
        
        // room invite
        // {
        //     'type': 'invite',
        //     'room': 'roomname',
        //     'sender': 'sender',
        //     'receiver': 'receiver'
        // };
        } else if(request.type == 'invite') {
            if (typeof request.room == 'undefined' || typeof request.sender == 'undefined' || typeof request.receiver == 'undefined') {
                backend.error('Ungültige Nachricht erhalten: ' + JSON.stringify(request));
            }
            
            // only accept one invitation per room
            if (backendHelpers.isUserInRoomList(backend.invited, request.room)) {
                return;
            }
            
            // insert invitation
            backend.invited[backend.invited.length] = {
                name: request.room,
                invited: request.sender
            };
            
            // show notification
            if(typeof backend.roomInvite != "undefined")
                backend.roomInvite(request.room, request.sender);
            
            // update roomlist
            backend.updateRoomlist();
        }
    },
    
    
    /**
     * find a free port.
     * @param callback (function) callback with port
     */
    findFreePort: function(callback) {
        var server = net.createServer();
        var port = 0;
        
        server.on('listening', function() {
            port = server.address().port
            server.close()
        });
        
        server.on('close', function() {
            callback(port)
        });
        
        server.listen(0);
    }
});