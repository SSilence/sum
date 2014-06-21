/**
 * server for receiving encrypted chat messages and status updates from other users
 *
 * @copyright  Copyright (c) Tobias Zeising (http://www.aditu.de)
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
sim.backend.server = {
    
    /**
     * start chat message server
     * @param backend the current backend
     * @param port serverport
     */
    init: function(backend, port) {
        http.createServer(function (request, response) {
            var body = '';

            request.addListener('data', function(chunk){
                body += chunk;
            });

            request.addListener('error', function(error){
                backend.error('server init error: ' + error);
                next(err);
            });

            request.addListener('end', function(chunk){
                if (chunk) {
                    body += chunk;
                }
                
                // decrypt message
                var reqStr = sim.backend.helpers.decrypt(backend.key, body);
                
                try {
                    req = JSON.parse(reqStr);
                } catch(e) {
                    backend.error('invalid encrypted request received');
                    response.writeHeader(400, {"Content-Type": "text/plain"});
                    response.end();
                    return;
                }
                
                if(typeof req.type != "undefined") {
                    sim.backend.server.handle(backend, req);
                    response.writeHeader(200, {"Content-Type": "text/plain"});  
                } else {
                    backend.error('invalid request received');
                    response.writeHeader(400, {"Content-Type": "text/plain"}); 
                }
                response.end();
            });
        }).listen(port);
    },
    
    
    /**
     * handle request
     * @param backend the current backend
     * @param request object with the type
     */
    handle: function(backend, request) {
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
                backend.newMessage(sim.backend.conversations[conversationId][conversation.length-1]);
        
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
            if (sim.backend.helpers.isUserInRoomList(backend.invited, request.room)) {
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
    }
};