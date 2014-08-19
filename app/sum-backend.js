if (typeof gui == 'undefined') gui = require('nw.gui');
if (typeof path == 'undefined') path = require('path');

/**
 * backend handles messaging, userlist management, update of userlist and all nodejs/node webkit tasks
 *
 * @copyright  Copyright (c) Tobias Zeising (http://www.aditu.de)
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
define('sum-backend', Class.extend({

    /**
     * backends helpers
     */
    backendHelpers: injected('sum-backend-helpers'),


    /**
     * backends crypto functions
     */
    backendCrypto: injected('sum-backend-crypto'),


    /**
     * backends filesystem functions
     */
    backendFilesystem: injected('sum-backend-filesystem'),


    /**
     * backends storage functions
     */
    backendStorage: injected('sum-backend-storage'),


    /**
     * backends client
     */
    backendClient: injected('sum-backend-client'),


    /**
     * backends userlist updater
     */
    backendUserlist: injected('sum-backend-userlist-file'),


    /**
     * backends server
     */
    backendServer: injected('sum-backend-server'),


    /**
     * don't send notifications on first update run on program startup
     */
    firstUpdate: true,
    
    
    /**
     * current version
     */
    version: '',


    /**
     * RSA Key
     */
    key: false,


    /**
     * Current ip
     */
    ip: false,


    /**
     * current port for chat communication
     */
    port: false,


    /**
     * current userlist
     */
    userlist: [],


    /**
     * current roomlist
     */
    roomlist: [],


    /**
     * rooms with invitations
     */
    invited: [],


    /**
     * saves all conversations
     */
    conversations: {},


    /**
     * all public keys of other users for verifing signature
     */
    publicKeys: [],
    
    
    /**
     * enable/disable notifications
     */
    enableNotifications: true,


    
    
    ////////////////////
    // initialization //
    ////////////////////
    
    
    /**
     * initialize backend
     */
    initialize: function() {
        // set userlist handling
        if (config.userlist === 'web')
            this.backendUserlist = inject('sum-backend-userlist-web');
    
        // get current version
        var packagejson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
        this.version = packagejson.version;

        // initial generate rsa keys
        if (this.key === false)
            this.key = this.backendCrypto.generateKeypair();

        // set ip
        this.ip = this.backendHelpers.getIp();

        // load public keys
        var publicKeys = this.backendStorage.loadPublicKeys();
        if (publicKeys !== false)
            this.publicKeys = publicKeys;
        
        // init node webkit tray icon
        this.initTray();

        // load rooms where user was in on last logout
        this.roomlist = this.backendStorage.loadRoomlist();

        // start backend server for chat communication
        var that = this;
        this.backendServer.start(function(port) {
            // save port which server uses for userfile
            that.port = port;

            // create/update userfile (holds additional information as avatar, key, ip, ...)
            that.backendUserlist.userlistUpdateUsersOwnFile(that.ip, that.port, that.key, that.backendStorage.loadAvatar(), that.version, function() {
                // afterwards start userlist updater
                that.backendUserlist.userlistUpdateTimer();
            });
        });
    },


    /**
     * Initialize tray icon
     */
    initTray: function() {
        // create a tray icon
        var tray = new gui.Tray({ title: 'Tray', icon: 'app/favicon.png', tooltip: 'S Ultimate Messenger' });

        // give it a menu
        var menu = new gui.Menu();

        // open debugger
        menu.append(new gui.MenuItem({ type: 'normal', label: 'Debug', click: function() {
            gui.Window.get().showDevTools();
        } }));

        // quit app
        menu.append(new gui.MenuItem({ type: 'normal', label: 'Beenden', click: function() {
            gui.App.quit();
        } }));
        tray.menu = menu;

        // click on tray icon = focus window
        tray.on('click', function() {
            gui.Window.get().show();
            gui.Window.get().focus();
        });
    },
    


    ////////////////////////////////////////////
    // callback registration for the frontend //
    ////////////////////////////////////////////

    /**
     * register callback for a new online user
     */
    onRoomInvite: function(callback) {
        this.roomInvite = callback;
    },

    /**
     * register callback for a new online user
     */
    onUserOnlineNotice: function(callback) {
        this.userOnlineNotice = callback;
    },

    /**
     * register callback for a user goes offline
     */
    onUserOfflineNotice: function(callback) {
        this.userOfflineNotice = callback;
    },

    /**
     * register callback for a user has been removed
     */
    onUserRemovedNotice: function(callback) {
        this.userRemovedNotice = callback;
    },

    /**
     * register callback for incoming new message
     */
    onNewMessage: function(callback) {
        this.newMessage = callback;
    },

    /**
     * register callback for room list update
     */
    onGetRoomlistResponse: function(callback) {
        this.getRoomlistResponse = callback;
    },

    /**
     * register callback for user list update
     */
    onGetUserlistResponse: function(callback) {
        this.getUserlistResponse = callback;
    },

    /**
     * register callback for getting converstion
     */
    onGetContentResponse: function(callback) {
        this.getContentResponse = callback;
    },

    /**
     * register callback for error message
     */
    onError: function(callback) {
        this.error = callback;
    },

    /**
     * register callback for error message
     */
    onHasUserlistUpdate: function(callback) {
        this.hasUserlistUpdate = callback;
    },

    /**
     * register callback for when user is removed
     */
    onUserIsRemoved: function(callback) {
        this.userIsRemoved = callback;
    },


    /**
     * register callback for changing current conversation
     */
    onSwitchConversation: function(callback) {
        this.switchConversation = callback;
    },
    
    /**
     * register callback for rerendering messages
     */
    onRerenderMessage: function(callback) {
        this.rerenderMessage = callback;
    },


    

    ////////////////////////////
    // functions for frontend //
    ////////////////////////////

    
    // notification handling
    
    /**
     * send system notification
     * @param image (string) little image shown in the notification
     * @param title (string) title of the notification
     * @param text (string) text of the notification
     * @param conversation (string) conversation for showing on click on notification window
     */
    notification: function(image, title, text, conversation) {
        if(this.enableNotifications===true) {
            var that = this;
            title = typeof title !== 'undefined' ? title.escape() : '';
            text = typeof text !== 'undefined' ? text.escape() : '';
            image = image.length === 0 ? 'favicon.png' : image;
            
            title = title.length > 55 ? title.substring(0, 55) + '...' : title;
            text = text.length > 240 ? text.substring(0, 240) + '...' : text;
            
            var notification = new Notification(title, { body: text, icon: image });
            notification.onclick = function() {
                gui.Window.get().show();
                gui.Window.get().focus();
                if (typeof conversation !== 'undefined') {
                    that.switchConversation(conversation);
                }
            };
        }
    },
    
    
    /**
     * enable/disable notifications
     * @param enable (boolean) enable/disable system notifications
     */
    notifications: function(enable) {
        this.enableNotifications = enable;
    },
    
    

    // user handling
    
    
    /**
     * update frontend with current userlist. onGetUserlistResponse will be executed.
     * @param conversation (string) the current conversation (room or user or nothing)
     */
    updateUserlist: function(conversation) {
        if(typeof this.getUserlistResponse != "undefined") {

            // per default: return all
            var users = this.userlist;

            // filter by room if user has selected a room
            if (typeof conversation != 'undefined' && conversation !== false) {
                // given conversation is a room and not a user?
                if (this.getUser(conversation)===false) {
                    users = this.getUsersInRoom(conversation);
                }
            }

            // send userlist to frontend
            this.getUserlistResponse(users);
        }
    },

    
    /**
     * returns array with all known users
     * @return (Array) of all users
     * @param withoutCurrentUser (boolean) include current user in result or not
     */
    getAllUsers: function(withoutCurrentUser) {
        var currentuser = this.backendHelpers.getUsername();
        var users = [];
        for(var i=0; i<this.userlist.length; i++) {
            if (withoutCurrentUser === true && this.userlist[i].username == currentuser)
                continue;
            users[users.length] = this.userlist[i];
        }
        return users;
    },
    
    
    /**
     * returns array with all online users
     * @return (Array) of all online users
     */
    getAllOnlineUsers: function() {
        return this.backendHelpers.getUsersByStatus(this.getAllUsers(true), 'online');
    },


    /**
     * get user from userlist or false if user not available
     * @return (object) returns given user with detail informations
     * @param name (string) the name of the user
     */
    getUser: function(name) {
        return this.backendHelpers.getUser(this.userlist, name);
    },
    
    
    /**
     * returns true if given user is current user.
     * @return (boolean) true or false
     * @param user (string) the name of the user
     */
    isCurrentUser: function(user) {
        return this.backendHelpers.getUsername() === user;
    },
    
    
    
    
    // avatar handling
    
    /**
     * save avatar in local storage
     * @param avatar (string) base64 encoded avatar
     */
    saveAvatar: function(avatar) {
        this.backendStorage.saveAvatar(avatar);
        this.rewriteUsersOwnFile();
    },


    /**
     * get avatar of a given user or default avatar avatar.png
     * @return (string) base64 encoded avatar of the user (if available)
     * @param username (string) the username
     */
    getAvatar: function(username) {
        var avatar = "avatar.png";
        for(var i=0; i<this.userlist.length; i++) {
            if (this.userlist[i].username==username && typeof this.userlist[i].avatar != 'undefined') {
                avatar = this.userlist[i].avatar;
                break;
            }
        }
        return avatar;
    },

    
    /**
     * remove avatar
     */
    removeAvatar: function() {
        this.backendStorage.removeAvatar();
        this.rewriteUsersOwnFile();
    },
    
    
    /**
     * get file from filesystem
     * @param file (string) path and filenam
     * @param success (function) contains file data
     * @param error (function) will be executed on error
     */
    getFile: function(file, success, error) {
        this.backendFilesystem.readFile(file, success, error);
    },
    
    
    
    // room handling
    

    /**
     * update frontend with current roomlist. onGetRoomlistResponse will be executed.
     */
    updateRoomlist: function() {
        if(typeof this.getRoomlistResponse != "undefined") {
            var rooms = [ { name: config.room_all} ]     // room: all users
                        .concat(this.roomlist)    // rooms user is in
                        .concat(this.invited);    // rooms user is invited
            this.getRoomlistResponse(rooms);
        }
    },

    
    /**
     * returns all users which are in a given room
     * @return (Array) of all users in a given room
     * @param room (string) roomname
     */
    getUsersInRoom: function(room) {
        // room for all users?
        if (room==config.room_all)
            return this.userlist;

        // a user created room
        var users = [];
        for(var i=0; i<this.userlist.length; i++) {
            for(var n=0; n<this.userlist[i].rooms.length; n++) {
                if (this.userlist[i].rooms[n].name==room) {
                    users[users.length] = this.userlist[i];
                }
            }
        }
        return users;
    },


    /**
     * decline room invitation
     * @param room (string) roomname
     */
    declineInvitation: function(room) {
        // send decline message to invitor
        var roomObj = this.backendHelpers.getRoom(this.invited, room);
        var user = this.backendHelpers.getUser(this.userlist, roomObj.invited);
        var message = {
            'type': 'room-invite-decline',
            'room': room,
            'sender': this.backendHelpers.getUsername(),
            'receiver': user.username
        };
        this.backendClient.send(
            user,
            this.backendCrypto.signMessage(message, this.key),
            function() {},
            this.error);
        
        // remove from invite roomlist
        this.invited = this.backendHelpers.removeRoomFromList(this.invited, room);
        this.updateRoomlist();
    },


    /**
     * accept room invitation
     * @param room (string) roomname
     */
    acceptInvitation: function(room) {
        // send acccept message to invitor
        var roomObj = this.backendHelpers.getRoom(this.invited, room);
        var user = this.backendHelpers.getUser(this.userlist, roomObj.invited);
        var message = {
            'type': 'room-invite-accept',
            'room': room,
            'sender': this.backendHelpers.getUsername(),
            'receiver': user.username
        };
        this.backendClient.send(
            user,
            this.backendCrypto.signMessage(message, this.key),
            function() {},
            this.error);
            
        // remove room from invitation list
        this.invited = this.backendHelpers.removeRoomFromList(this.invited, room);

        // check still in room?
        if (this.backendHelpers.isUserInRoomList(this.roomlist, room)) {
            this.error(lang.backend_already_in_room);
            return;
        }

        // add room to roomlist
        this.roomlist[this.roomlist.length] = { 'name': room };
        this.backendStorage.saveRoomlist(this.roomlist);
        this.updateRoomlist();
    },


    /**
     * add new room
     * @param room (string) roomname
     * @param users (array) array of all usernames
     */
    addRoom: function(room, users) {
        room = room.trim();
        this.inviteUsers(room, users);
        this.roomlist[this.roomlist.length] = { 'name': room };
        this.backendStorage.saveRoomlist(this.roomlist);
        this.updateRoomlist();
    },


    /**
     * invite new users to room
     * @param room (string) roomname
     * @param users (array) array of all usernames
     */
    inviteUsers: function(room, users) {
        if (typeof users == 'undefined' || users === null)
            users = [];
        var usersFromList = [];
        var i;
        for (i=0; i<users.length; i++)
            usersFromList[usersFromList.length] = this.getUser(users[i]);
        users = usersFromList;

        var message = {
            'type': 'room-invite',
            'room': room,
            'sender': this.backendHelpers.getUsername(),
            'receiver': ''
        };

        // send invite to all users
        for (i=0; i<users.length; i++) {
            message.receiver = users[i].username;
            this.backendClient.send(users[i], this.backendCrypto.signMessage(message, this.key), function() {}, this.error);
            this.renderSystemMessage(users[i].username + ' eingeladen', room);
        }
    },


    /**
     * leave room
     * @param room (string) roomname
     */
    leaveRoom:function(room) {
        var newRoomlist = [];
        for (var i=0; i<this.roomlist.length; i++) {
            if (this.roomlist[i].name != room) {
                newRoomlist[newRoomlist.length] = this.roomlist[i];
            }
        }
        this.roomlist = newRoomlist;
        this.backendStorage.saveRoomlist(this.roomlist);
        this.updateRoomlist();
    },

    
    /**
     * check whether a room already exists or not
     * @return (boolean) true or false
     * @param room (string) roomname
     */
    doesRoomExists: function(room) {
        if (room == config.room_all)
            return true;

        room = room.toLowerCase();
        for(var i=0; i<this.userlist.length; i++) {
            for(var n=0; n<this.userlist[i].rooms.length; n++) {
                if (this.userlist[i].rooms[n].name.toLowerCase() == room) {
                    return true;
                }
            }
        }
        return false;
    },
    
    
    
    // conversation handling
    
    
    /**
     * update frontend with given conversation. id is username or roomname. onGetContentResponse will be executed.
     * @param id (string) the conversation (room or user or nothing)
     */
    getConversation: function(id) {
        if(typeof this.getContentResponse != "undefined") {
            var conversation = (typeof this.conversations[id] != "undefined") ? this.conversations[id] : [];
            this.getContentResponse(id, conversation);
        }
    },

    
    /**
     * clear given conversation
     * @param conversation (string) conversation for purging
     */
    clearConversation: function(conversation) {
        this.conversations[conversation] = [];
    },


    /**
     * render system message
     * @param text (string) message
     * @param conversation (string) target conversation
     */
    renderSystemMessage: function(text, conversation) {
        // get conversation
        if (typeof this.conversations[conversation] == 'undefined')
            this.conversations[conversation] = [];
        var con = this.conversations[conversation];

        // add system message
        con[con.length] = {
            id: this.backendHelpers.genereateGUID(),
            type: 'system',
            text: text.escape().replace(/\&lt;br \/\&gt;/g, '<br />')
        };
        this.getConversation(conversation);
    },
    

    /**
     * send new message.
     * @param message (object) the message
     */
    sendMessage: function(message) {
        // get user or users of a given room
        var users = this.backendHelpers.getUser(this.userlist, message.receiver);
        if (users===false) {
            users = this.getUsersInRoom(message.receiver);
        } else {
            users = [ users ];
        }

        // no room or user found?
        if (users.length===0) {
            this.error(lang.backend_invalid_user_room);
            return;
        }

        // user is offline?
        if (users.length==1 && users[0].status == 'offline') {
            this.error(lang.backend_not_online);
            return;
        }

        // create new message
        var currentuser = this.backendHelpers.getUsername();
        message = $.extend(message, {
            'id': this.backendHelpers.genereateGUID(),
            'sender': currentuser
        });

        // save message in own conversation
        if (typeof this.conversations[message.receiver] == 'undefined')
            this.conversations[message.receiver] = [];
        var conversation = this.conversations[message.receiver];
        conversation[conversation.length] = $.extend({}, message, { datetime: new Date().getTime() });
        this.getConversation(message.receiver);

        // remove file path
        if (message.type === 'file-invite') {
            message = $.extend(message, { 'path': path.basename(message.path) });
        }
        
        // send message to all users
        var that = this;
        for (var i=0; i<users.length; i++) {
            // don't send message to offline users
            if (users[i].status == 'offline')
                continue;

            // don't send message to this user
            if (users[i].username == currentuser)
                continue;

            // send message
            this.backendClient.send(users[i], this.backendCrypto.signMessage(message, this.key), function() {
                that.getConversation(message.receiver);
            }, this.error);
        }
    },
    
    
    /**
     * returns message from conversation
     * @return (boolean|object) message or false
     * @param id (string) id of message
     */
    getMessage: function(id) {
        return this.backendHelpers.findMessage(this.conversations, id);
    },



    // file send handling
    
    
    /**
     * sends file invitation
     * @param file (string) path of file
     * @param user (string) user or room for sending the invitation
     */
    sendFileInvite: function(file, user) {
        // file available?
        if (fs.existsSync(file) === false)
            this.error(lang.backend_file_invite_access_error);
                
        // file size?
        var fileSize = fs.statSync(file).size;
        
        // send
        var invite = {
            'type': 'file-invite',
            'size': fileSize,
            'receiver': user,
            'path': file,
            'sender': this.backendHelpers.getUsername()
        };
        this.sendMessage(invite);
    },
    
    
    /**
     * cancel file invitation
     * @param messageId (string) messageId for canceling
     */
    cancelFileInvite: function(messageId) {
        var message = this.backendHelpers.findMessage(this.conversations, messageId);
        if (message === false)
            return;
        
        message.canceled = true; // this updates also the message inside conversations
        this.rerenderMessage(message);
        
        // send cancel invitation to all users
        if (message.sender === this.backendHelpers.getUsername()) {
            this.sendMessage({
                'type': 'file-invite-cancel',
                'receiver': message.receiver,
                'file': messageId,
                'sender': this.backendHelpers.getUsername()
            });
        }
    },
    
    
    /**
     * download file from user and save it
     * @param params (object) params for file download
     */
    saveFile: function(params) {
        var user = this.getUser(params.message.sender);
        if (user === false || user.status === 'offline') {
            this.error(lang.backend_file_download_not_found);
            return;
        }
        
        // download file
        this.backendClient.file({
            user:     user, 
            sender:   this.backendHelpers.getUsername(),
            file:     params.message.id, 
            target:   params.message.saved, 
            size:     params.message.size, 
            success:  params.success, 
            error:    params.error, 
            progress: params.progress,
            cancel:   params.cancel
        });
    },
    
    
    /**
     * cancel running file download
     * @param messageId (string) download id
     */
    cancelFileDownload: function(messageId) {
        this.backendClient.cancelList[this.backendClient.cancelList.length] = messageId;
    },
    
    
    /**
     * will be called by server after successfully sending a file to another user
     * @param messageId (string) id of file invite
     * @param sender (string) sender who fetched this file
     */
    finishedFileRequest: function(messageId, sender) {
        var message = this.backendHelpers.findMessage(this.conversations, messageId);
        if (typeof message.loaded === 'undefined')
            message.loaded = [];
        if ($.inArray(sender, message.loaded) === -1)
            message.loaded[message.loaded.length] = sender;
        this.rerenderMessage(message);
    },
    

    /**
     * open downloaded file
     * @param messageId (string) download id
     */
    openFile: function(messageId) {
        var message = this.backendHelpers.findMessage(this.conversations, messageId);
        gui.Shell.openExternal(message.saved);
    },
    
    
    /**
     * open url
     * @param url (string) given url
     */
    openUrl: function(url) {
        gui.Shell.openExternal(url);
    },
    
    

    // key management handling
    
    /**
     * returns public keys of other users
     * @return (array) public keys as object with username and key property
     */
    getPublicKeys: function() {
        return this.publicKeys;
    },
    
    
    /**
     * returns public key of given user
     * @return (string|boolean) key or false
     * @param user (string) user name
     */
    getPublicKey: function(user) {
        var found = false;
        $.each(this.publicKeys, function(index, item) {
            if (item.username === user) {
                found = item.key;
                return false;
            }
        });
        return found;
    },
    
    
    /**
     * return true if key management will be used
     * @return (boolean) true if key management is active, false otherwise
     */
    showLogin:function() {
        return this.backendStorage.hasKey();
    },
    
    
    /**
     * reset key
     * @param password (string) password for new key
     */
    resetKey: function(password) {
        this.backendStorage.resetKey();
        this.key = this.backendCrypto.generateKeypair();
        this.saveKey(password);
        this.rewriteUsersOwnFile();
    },
    
    
    /**
     * remove key
     */
    removeKey: function() {
        this.backendStorage.resetKey();
        this.backendStorage.resetPublicKeys();
        this.publicKeys = [];
    },
    
    
    /**
     * loads key from localstorage
     * @param password (string) keys password
     */
    loadKey:function(password) {
        this.key = this.backendStorage.loadKey(password);
        return this.key;
    },
    
    
    /**
     * save key in localstorage
     * @param password (string) keys password
     */
    saveKey:function(password) {
        this.backendStorage.saveKey(this.key, password);
    },
    
    
    /**
     * checks whether key password is correct
     * @return (boolean) true if correct, false otherwise
     * @param password (string) keys password
     */
    checkKeyPassword: function(password) {
        var key = this.backendStorage.loadKey(password);
        return key !== false;
    },
    
    
    /**
     * adds a public key in localstorage and local public key list
     * @param path (string) path of the public key file for import
     * @param success (function) success callback
     */
    addPublicKey: function(path, success) {
        var that = this;
        this.backendFilesystem.readJsonFile(path, 
            function(key) {
                // validate key format
                if (typeof key.username === 'undefined' || typeof key.key === 'undefined')
                    return that.error(lang.backend_add_public_key_fileformat_error);
                
                // key already in storage?
                var found = $.grep(that.publicKeys, function (e){
                    return e.username === key.username;
                });
                if (found.length !== 0)
                    return that.error(lang.backend_add_public_key_already_imported);
                
                // add key
                that.publicKeys[that.publicKeys.length] = key;
                
                // save key
                that.backendStorage.savePublicKeys(that.publicKeys);
                
                // update userlist
                that.backendUserlist.userlistUpdateTimer();
                
                success();
            },
            function() { 
                that.error(lang.backend_file_read_error);
            });
    },
    
    
    /**
     * removes a public key in localstorage and local public key list
     * @param username (string) username of the public key
     */
    removePublicKey: function(username) {
        var newPublicKeys = [];
        $.each(this.publicKeys, function(index, item) {
            if (item.username !== username)
                newPublicKeys[newPublicKeys.length] = item;
        });
        this.publicKeys = newPublicKeys;
        
        // save keys
        this.backendStorage.savePublicKeys(this.publicKeys);
        
        // update userlist
        this.backendUserlist.userlistUpdateTimer();
    },
    
    
    /**
     * save public key in given file
     * @param path (string) target file
     * @param success (function) success callback
     */
    exportPublicKey: function(path, success) {
        var keyToSave = {
            'username': this.backendHelpers.getUsername(),
            'key': this.key.getPublicPEM()
        };
        this.backendFilesystem.writeJsonFile(path, keyToSave, success, this.error);
    },
    
    
    /**
     * save private and public key in given file
     * @param path (string) target file
     * @param success (function) success callback
     */
    exportKey: function(path, success) {
        var key = this.backendStorage.loadKeyEncrypted();
        this.backendFilesystem.writeFile(path, key, success, this.error);
    },
    
    
    /**
     * import private and public key from file
     * @param path (string) target file
     * @param password (string) password for key
     * @param success (function) success callback
     */
    importKey: function(path, password, success) {
        var that = this;
        this.backendFilesystem.readFile(path, function(encrypted) {
            try {
                var decrypted = that.backendCrypto.aesdecrypt(encrypted.toString('utf8'), password);
                var keypair = JSON.parse(decrypted);
                var key = new NodeRSA();
                key.loadFromPEM(keypair.publicKey);
                key.loadFromPEM(keypair.privateKey);
                that.key = key;
                that.saveKey(password);
                that.rewriteUsersOwnFile();
                success();
            } catch(err) {
                that.error(lang.backend_import_key_error);
            }
            
        }, this.error);
    },
    


    // game handling

    /**
     * returns all available games
     * @returns (array) of game names
     */
    gamez: function() {
        return this.backendFilesystem.getDirectories('./gamez/');
    },


    /**
     * starts a given game
     * @param game (string) game name
     */
    openGame: function(game) {
        var that = this;
        this.backendFilesystem.readJsonFile('./gamez/' + game + '/window.js',
            function(window) {
                that.backendHelpers.openGameWindow(game, window.width, window.height);
            },
            function() {
                that.backendHelpers.openGameWindow(game);
            });
    },


    
    // Application handling
    
    
    /**
     * show unread items at icon
     * @param value (int) value to set (only numbers)
     */
    setBadge: function(value) {
        try {
            require('nw.gui').Window.get().setBadgeLabel(""+value);
        } catch(e) {
            // do nothing if no setBadgeLabel is on this system available
        }
    },
    
    
    /**
     * quit application
     */
    quit: function() {
        gui.App.quit();
    },


    /**
     * close application
     */
    close: function() {
        gui.Window.get().hide();
    },


    /**
     * check if newer version of this application is available
     * @param callback (function) will be executed if newer version was found
     */
    isNewerVersionAvailable: function(callback) {
        var that = this;
        this.backendFilesystem.readFile(config.version_file, function(given) {
            given = given.toString();
            if (that.backendHelpers.isVersionNewer(that.version, given))
                callback(given);
        }, function() { /* on error do nothing */ });
    },
    
    
    /**
     * show notification for users which are now online/offline/removed
     * @param newuserlist (array) new userlist
     */
    showOnlineOfflineNotifications: function(newuserlist) {
        if (this.firstUpdate === false) {
            var online = this.backendHelpers.getUsersNotInListOne(
                this.backendHelpers.getUsersByStatus(this.userlist, 'online'), 
                this.backendHelpers.getUsersByStatus(newuserlist, 'online')
            );
            var offline = this.backendHelpers.getUsersNotInListOne(
                this.backendHelpers.getUsersByStatus(this.userlist, 'offline'), 
                this.backendHelpers.getUsersByStatus(newuserlist, 'offline')
            );
            var removed = this.backendHelpers.getUsersNotInListOne(newuserlist, this.userlist);
            var i = 0;
            var message;
            var avatar;
            
            if (typeof this.userOnlineNotice != 'undefined')
                for (i = 0; i < online.length; i++) {
                    message = lang.frontend_online.replace(/\%s/, online[i].username);
                    this.renderSystemMessage(message, online[i].username);
                    this.renderSystemMessage(message, config.room_all);
                    avatar = (typeof online[i].avatar !== 'undefined' && online[i].avatar.length > 0) ? online[i].avatar : 'avatar.png';
                    this.userOnlineNotice(avatar, online[i].username);
                }

            if (typeof this.userOfflineNotice != 'undefined')
                for (i = 0; i < offline.length; i++) {
                    message = lang.frontend_offline.replace(/\%s/, offline[i].username);
                    this.renderSystemMessage(message, offline[i].offline);
                    this.renderSystemMessage(message, config.room_all);
                    avatar = (typeof offline[i].avatar !== 'undefined' && offline[i].avatar.length > 0) ? offline[i].avatar : 'avatar.png';
                    this.userOfflineNotice(avatar, offline[i].username);
                }

            if (typeof this.userRemovedNotice != 'undefined')
                for (i = 0; i < removed.length; i++) {
                    avatar = (typeof removed[i].avatar !== 'undefined' && removed[i].avatar.length > 0) ? removed[i].avatar : 'avatar.png';
                    this.userRemovedNotice(avatar, removed[i].username);
                }
        }
        this.firstUpdate = false;
    },
    
    
    /**
     * write users own file again (for avatar/key changes)
     */
    rewriteUsersOwnFile: function() {
        var that = this;
        this.backendUserlist.userlistUpdateUsersOwnFile(this.ip, this.port, this.key, this.backendStorage.loadAvatar(), this.version, function() {
            that.backendUserlist.userlistUpdateTimer();
        });
    }
}));
