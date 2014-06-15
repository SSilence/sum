var gui = require('nw.gui');
var http = require('http');

sim.backend = {

    /**
     * RSA Key
     */
    key: false,
    
    
    /**
     * Current ip
     */
    ip: false,
    
    
    /**
     * current userlist
     */
    userlist: [],
    
    
    /**
     * current roomlist
     */
    roomlist: [],
    
    
    /**
     * saves all conversations
     */
    conversations: {},
    
    
    /**
     * initialize backend
     */
    init: function() {
        // load alternative config given by command line?
        if (gui.App.argv.length > 0)
            config = require(gui.App.argv[0]).extend(config);

        // initial generate rsa keys
        sim.backend.key = sim.backend.helpers.generateKeypair();
        
        // set ip
        sim.backend.ip = sim.backend.helpers.getIp();

        // timer: userlist update timestamp for current user
        sim.backend.initUserUpdater();

        // start backend server for chat communication
        sim.backend.initServer(config.chatport);
        
        // init node webkit environment
        sim.backend.initNodeWebkit();
    },
    
    
    /**
     * Initialize node webkit specific settings
     */
    initNodeWebkit: function() {
        // create a tray icon
        var tray = new gui.Tray({ title: 'Tray', icon: 'app/favicon.png' });

        // give it a menu
        var menu = new gui.Menu();
        menu.append(new gui.MenuItem({ type: 'normal', label: 'exit', click: function() {
            gui.App.quit();  
        } }));
        tray.menu = menu;
        
        // click on tray icon = focus window
        tray.on('click', function() {
            gui.Window.get().focus();
        });
    },

    
    /**
     * timer: userlist update timestamp for current user
     */
    initUserUpdater: function() {
        var userUpdater = function() {
            sim.backend.helpers.lock(function(err) {
                // can't get lock? retry in random timeout
                if (typeof err != 'undefined') {
                    var randomTimeout = Math.floor(Math.random() * 10000) + 4000;
                    window.setTimeout(userUpdater, randomTimeout);
                    return;
                }
                
                // have lock?
                sim.backend.helpers.updateUserlist(
                    config.user_file, 
                    sim.backend.key.getPublicPEM(), 
                    function(users) {
                        // release lock
                        sim.backend.helpers.unlock();
                        
                        sim.backend.userlist = users;
                        
                        // update ui
                        if(typeof sim.backend.getUserlistResponse != "undefined")
                            sim.backend.getUserlistResponse(users);
                        
                        // initialize next update
                        window.setTimeout(userUpdater, config.user_list_update_intervall);
                    });
                
            });
        };
        userUpdater();
    },
    
    
    /**
     * start chat message server
     */
    initServer: function(port) {
        http.createServer(function (request, response) {
            var body = '';

            request.addListener('data', function(chunk){
                body += chunk;
            });

            request.addListener('error', function(error){
                alertify.error('got a error', error);
                next(err);
            });

            request.addListener('end', function(chunk){
                if (chunk) {
                    body += chunk;
                }
                
                // decrypt message
                var reqStr = sim.backend.helpers.decrypt(sim.backend.key, body);
                
                try {
                    req = JSON.parse(reqStr);
                } catch(e) {
                    alertify.error('invalid encrypted request received');
                    response.writeHeader(400, {"Content-Type": "text/plain"});
                    response.end();
                    return;
                }
                
                if(typeof req.type != "undefined") {
                    sim.backend.route(req);
                    response.writeHeader(200, {"Content-Type": "text/plain"});  
                } else {
                    alertify.error('invalid request received');
                    response.writeHeader(400, {"Content-Type": "text/plain"}); 
                }
                response.end();
            });
        }).listen(port);
    },
    
    
    /**
     * route request
     */
    route: function(request) {
        // todo: get message
        // todo: get room update
        // todo: user status update
        // todo: room update
        // todo: file request
        
        // new message
        if (request.type == 'message') {
            if (typeof sim.backend.conversations[request.sender] == 'undefined') 
                sim.backend.conversations[request.sender] = [];
            
            var conversation = sim.backend.conversations[request.sender];
            sim.backend.conversations[request.sender][conversation.length] = {
                'datetime': new Date().getTime(),
                'sender': request.sender,
                'receiver': request.receiver,
                'text': request.text
            };
            
            if(typeof sim.backend.newMessage != "undefined")
                sim.backend.newMessage(sim.backend.conversations[request.sender][conversation.length-1]);
        }
    },
    
    
    
    // register callbacks

    /**
     * register callback for a new online user
     */
    onUserOnlineNotice: function(callback) {
        sim.backend.userOnlineNoticeCallback = callback;
    },
    
    /**
     * register callback for a user goes offline
     */
    onUserOfflineNotice: function(callback) {
        sim.backend.userOfflineNoticeCallback = callback;
    },
    
    /**
     * register callback for user changes his state
     */
    onUserUpdateNotice: function(callback) {
        sim.backend.userUpdateNotice = callback;
    },
    
    /**
     * register callback for incoming new message
     */
    onNewMessage: function(callback) {
        sim.backend.newMessage = callback;
    },
    
    /**
     * register callback for user enters room
     */
    onRoomEnterNotice: function(callback) {
        sim.backend.roomEnterNotice = callback;
    },
    
    /**
     * register callback for user leaves room
     */
    onRoomLeaveNotice: function(callback) {
        sim.backend.roomLeaveNotice = callback;
    },
    
    /**
     * register callback for new room was opened
     */
    onRoomOpened: function(callback) {
        sim.backend.roomOpened = callback;
    },
    
    /**
     * register callback for room list update
     */
    onGetRoomlistResponse: function(callback) {
        sim.backend.getRoomlistResponse = callback;
    },
    
    /**
     * register callback for user list update
     */
    onGetUserlistResponse: function(callback) {
        sim.backend.getUserlistResponse = callback;
    },
    
    /**
     * register callback for getting converstion
     */
    onGetContentResponse: function(callback) {
        sim.backend.getContentResponse = callback;
    },
    
    /**
     * register callback for error message
     */
    onError: function(callback) {
        sim.backend.error = callback;
    },
    
    
    
    // functions for frontend
    
    
    /**
     * prompt backend for new userlist. onGetUserlistRespons will be executed.
     */
    updateUserlist: function() {
        if(typeof sim.backend.getUserlistResponse != "undefined") {
            sim.backend.getUserlistResponse(sim.backend.userlist);
        }
    },
    
    
    /**
     * prompt backend for new roomlist. onGetRoomlistResponse will be executed.
     */
    updateRoomlist: function() {
        if(typeof sim.backend.getRoomlistResponse != "undefined") {
            sim.backend.getRoomlistResponse(sim.backend.roomlist);
        }
    },
    
    
    /**
     * prompt backend for conversations. id is username or roomname. onGetContentResponse will be executed.
     */
    getConversation: function(id) {
        if(typeof sim.backend.getContentResponse != "undefined") {
            var conversation = (typeof sim.backend.conversations[id] != "undefined") ? sim.backend.conversations[id] : [];
            sim.backend.getContentResponse(id, conversation);
        }
    },
    
    
    /**
     * send new message. receiver is username or roomname.
     */
    sendMessage: function(receiver, text) {
        var message = {
            'type': 'message',
            'text': text,
            'sender': sim.backend.helpers.getUsername(),
            'receiver': receiver
        };
        sim.backend.helpers.sendMessage(receiver, message, function() {
            // save message in own conversation on success
            message.datetime = new Date().getTime();
            if (typeof sim.backend.conversations[receiver] == 'undefined') 
                sim.backend.conversations[receiver] = [];
            var conversation = sim.backend.conversations[receiver];           
            sim.backend.conversations[receiver][conversation.length] = message;
            
            // update own message stream
            sim.backend.getConversation(receiver);
        });
    },
    
    
    /**
     * update own status.
     * status = AVAILABLE oder BUSY oder NOT_AVAILABLE
     */
    updateStatus: function(status) {
    
    },
    
    
    /**
     * open new room
     */
    openRoom: function(name) {
    
    },
    
    
    /**
     * join room
     */
    joinRoom: function(name) {
    
    },
    
    
    /**
     * leave room
     */
    leaveRoom: function(name) {
    
    },
    
    
    /**
     * quit application
     */
    quit: function() {
        gui.App.quit();
    },
    
    
    /**
     * send system notification
     */
    notification: function(title, text) {
        window.LOCAL_NW.desktopNotifications.notify('favicon.png', title, text);
    }

};