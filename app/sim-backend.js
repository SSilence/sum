var gui = require('nw.gui');

/**
 * backend handles messaging, userlist management, update of userlist and all nodejs/node webkit tasks
 *
 * @copyright  Copyright (c) Tobias Zeising (http://www.aditu.de)
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
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
     * current port for chat communication
     */
    port: false,
    
    
    /**
     * timestamp userfile was written
     */
    userfileTimestamp: false,
    
    
    /**
     * current userlist
     */
    userlist: [],
    
    
    /**
     * cache for all additional userinfos
     */
    userinfos: {},
    
    
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
     * enable/disable notifications
     */
    enableNotifications: true,
    
    
    /**
     * don't send notifications on first update run on program startup
     */
    firstUpdate: true,
    
    
    /**
     * initialize backend
     */
    init: function() {
        // load alternative config given by command line?
        if (gui.App.argv.length > 0) {
            try {
                config = require(gui.App.argv[0]).extend(config);
            } catch(e) {
                // can't load config file? Then user parameter as username
                config.username = gui.App.argv[0];
            }
        }

        // initial generate rsa keys
        sim.backend.key = sim.backend.helpers.generateKeypair();
        
        // set ip
        sim.backend.ip = sim.backend.helpers.getIp();

        // init node webkit tray icon
        sim.backend.initTray();
        
        // start backend server for chat communication
        sim.backend.server.init(sim.backend, function(port) {
            // save port
            sim.backend.port = port;
            
            // create/update userfile (holds additional information as avatar, key, ip, ...)
            // afterwards start updating the userlist
            sim.backend.userlistUpdateUsersOwnFile(sim.backend.userlistUpdateTimer);
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
        menu.append(new gui.MenuItem({ type: 'normal', label: 'Exit', click: function() {
            gui.App.quit();  
        } }));
        tray.menu = menu;
        
        // click on tray icon = focus window
        tray.on('click', function() {
            gui.Window.get().show();
            gui.Window.get().focus();
        });
    },
    
    
    
    ////////////////////////////
    // userlist file handling //
    ////////////////////////////
    
    /**
     * timer: regular userfile and userlist update for current user
     */
    userlistUpdateTimer: function() {
        sim.backend.helpers.lock(function(err) {
            // can't get lock for exclusive userfile access? retry in random timeout
            if (typeof err != 'undefined') {
                var randomTimeout = Math.floor(Math.random() * config.lock_retry_maximum) + config.lock_retry_minimum;
                window.setTimeout(sim.backend.userlistUpdateTimer, randomTimeout);
                return;
            }
            
            // have lock? Update userlist
            sim.backend.userlistUpdater();
        });
    },
    
    
    /**
     * all users are registered in a single json file. This method updates or adds
     * an entry of the current user.
     */
    userlistUpdater: function() {
        sim.backend.helpers.readJsonFile(config.user_file, function(users) {
            var currentuser = sim.backend.helpers.getUsername();
            var now = new Date().getTime();
            
            // remove orphaned user entries
            var userlist = [];
            for(var i=0; i<users.length; i++) {
                // ignore entries without username and timestamp
                if (typeof users[i].username == 'undefined' || typeof users[i].timestamp == 'undefined')
                    continue;
                
                // current user will be added later
                if (users[i].username == currentuser)
                    continue;
                
                // only save active users
                if (users[i].timestamp + config.user_timeout > now)
                    userlist[userlist.length] = users[i];
            }
            
            // add current user
            userlist[userlist.length] = {
                username: currentuser,
                timestamp: now,
                userfileTimestamp: sim.backend.userfileTimestamp,
                rooms: sim.backend.roomlist
            };
            
            // write back updated userfile
            sim.backend.helpers.writeJsonFile(
                config.user_file,
                userlist,
                function() {
                    // release lock
                    sim.backend.helpers.unlock();
                },
                sim.backend.error
            );
            
            // load additional userinfos and update local userlist
            sim.backend.userlistLoadAdditionalUserinfos(userlist);
        });
    },
    
    
    /**
     * loads all additional userinfos from users single files
     * @param users (array) fetched users
     */
    userlistLoadAdditionalUserinfos: function(users) {
        // next step will be executed if all additonal informations of all users was loaded (toMerge == 0)
        var toMerge = users.length;
        
        // checks whether all userinfos was fetched
        var checkAllHandledThenExecuteRefreshUserlist = function() {
            toMerge--;
            if(toMerge==0)
                sim.backend.userlistRefreshFrontend(users);
        };
        
        // loads current userinfos for a single user
        var loadUserinfos = function(currentIndex) {
            // load from users file if not in cache or newer one available
            if (typeof sim.backend.userinfos[users[currentIndex].username] == 'undefined'
                || users[currentIndex].userfileTimestamp != sim.backend.userinfos[users[currentIndex].username].timestamp) {
                
                // read userinfos from file
                var file = config.user_file_extended.replace(/#/, CryptoJS.MD5(users[currentIndex].username));
                sim.backend.helpers.readJsonFile(
                    file, 
                    function(userinfos) {
                        // merge user and userinfos
                        if (typeof userinfos.ip != 'undefined' && typeof userinfos.port != 'undefined' && typeof userinfos.key != 'undefined') {
                            users[currentIndex] = sim.backend.helpers.mergeUserAndUserinfos(users[currentIndex], userinfos);
                            
                            // save userinfos in cache
                            userinfos.timestamp = users[currentIndex].userfileTimestamp;
                            sim.backend.userinfos[users[currentIndex].username] = userinfos;
                        }
                        checkAllHandledThenExecuteRefreshUserlist();
                    },
                    function() {
                        checkAllHandledThenExecuteRefreshUserlist();
                    }
                );
            
            // load from cache
            } else {
                users[currentIndex] = sim.backend.helpers.mergeUserAndUserinfos(users[currentIndex], sim.backend.userinfos[users[currentIndex].username]);
                checkAllHandledThenExecuteRefreshUserlist();
            }
        };
        
        // load additional infos per user from users own files
        for (var i=0; i<users.length; i++)
            loadUserinfos(i);
    },
    
    
    /**
     * refresh current userlist after reading userfile
     * @param users (array) fetched users
     */
    userlistRefreshFrontend: function(users) {
        // sort userlist by username
        users = sim.backend.helpers.sortUserlistByUsername(users);
    
        // show notification for users which are now online/offline
        if (sim.backend.firstUpdate==false) {
            var online = sim.backend.helpers.getUsersNotInListOne(sim.backend.userlist, users);
            var offline = sim.backend.helpers.getUsersNotInListOne(users, sim.backend.userlist);
            
            if (typeof sim.backend.userOnlineNotice != 'undefined')
                for(var i=0; i<online.length; i++)
                    sim.backend.userOnlineNotice(online[i].avatar, online[i].username);
            
            if (typeof sim.backend.userOfflineNotice != 'undefined')
                for(var i=0; i<offline.length; i++)
                    sim.backend.userOfflineNotice(offline[i].avatar, offline[i].username);
        }
        sim.backend.firstUpdate = false;
        
        // save userlist
        sim.backend.userlist = users;
        
        // inform frontend that new userlist is available
        if(typeof sim.backend.hasUserlistUpdate != "undefined")
            sim.backend.hasUserlistUpdate();
        
        // initialize next update
        window.setTimeout(sim.backend.userlistUpdateTimer, config.user_list_update_intervall);
    },
    
    
    /**
     * write extended userfile with avatar, ip, chatport and other less frequently updated information
     * @param success (callback) will be executed after successfully writing file
     */
    userlistUpdateUsersOwnFile: function(success) {
        var file = config.user_file_extended.replace(/#/, CryptoJS.MD5(sim.backend.helpers.getUsername()));
        sim.backend.helpers.writeJsonFile(
            file, 
            {
                ip: sim.backend.ip,
                port: sim.backend.port,
                key: sim.backend.key.getPublicPEM(),
                avatar: sim.backend.loadAvatar()
            }, 
            function() {
                sim.backend.userfileTimestamp = new Date().getTime();
                if (typeof success != 'undefined')
                    success();
            },
            sim.backend.error
        );
        
    },
    
    
    
    ////////////////////////////////////////////
    // callback registration for the frontend //
    ////////////////////////////////////////////
    
    /**
     * register callback for a new online user
     */
    onRoomInvite: function(callback) {
        sim.backend.roomInvite = callback;
    },
    
    /**
     * register callback for a new online user
     */
    onUserOnlineNotice: function(callback) {
        sim.backend.userOnlineNotice = callback;
    },
    
    /**
     * register callback for a user goes offline
     */
    onUserOfflineNotice: function(callback) {
        sim.backend.userOfflineNotice = callback;
    },
    
    /**
     * register callback for incoming new message
     */
    onNewMessage: function(callback) {
        sim.backend.newMessage = callback;
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
    
    /**
     * register callback for error message
     */
    onHasUserlistUpdate: function(callback) {
        sim.backend.hasUserlistUpdate = callback;
    },
    
    
    
    ////////////////////////////
    // functions for frontend //
    ////////////////////////////
    
    
    /**
     * update frontend with current userlist. onGetUserlistResponse will be executed.
     * @param conversation (string) the current conversation (room or user or nothing)
     */
    updateUserlist: function(conversation) {
        if(typeof sim.backend.getUserlistResponse != "undefined") {
            
            // per default: return all
            var users = sim.backend.userlist;
            
            // filter by room if user has selected a room
            if (typeof conversation != 'undefined' && conversation != false) {
                // given conversation is a room and not a user?
                if (sim.backend.getUser(conversation)==false) {
                    users = sim.backend.getUsersInRoom(conversation);
                }
            }
            
            // send userlist to frontend
            sim.backend.getUserlistResponse(users);
        }
    },
    
    
    /**
     * update frontend with current roomlist. onGetRoomlistResponse will be executed.
     */
    updateRoomlist: function() {
        if(typeof sim.backend.getRoomlistResponse != "undefined") {
            var rooms = [ { name: config.room_all} ]     // room: all users
                        .concat(sim.backend.roomlist)    // rooms user is in
                        .concat(sim.backend.invited);    // rooms user is invited
            sim.backend.getRoomlistResponse(rooms);
        }
    },
    
    
    /**
     * update frontend with given conversation. id is username or roomname. onGetContentResponse will be executed.
     * @param id (string) the conversation (room or user or nothing)
     */
    getConversation: function(id) {
        if(typeof sim.backend.getContentResponse != "undefined") {
            var conversation = (typeof sim.backend.conversations[id] != "undefined") ? sim.backend.conversations[id] : [];
            sim.backend.getContentResponse(id, conversation);
        }
    },
    
    
    /**
     * send new message. receiver is username or roomname.
     * @param receiver (string) user or room
     * @param text (string) the message
     */
    sendMessage: function(receiver, text) {
        // get user or users of a given room
        var users = sim.backend.helpers.getUser(sim.backend.userlist, receiver);
        if (users==false) {
            users = sim.backend.getUsersInRoom(receiver);
        } else {
            users = [ users ];
        }
        
        // no room or user found
        if (users.length==0) {
            sim.backend.error('Ungültiger Benutzer oder Raum');
            return;
        }
        
        // create new message
        var currentuser = sim.backend.helpers.getUsername();
        var message = {
            'type': 'message',
            'text': text,
            'sender': currentuser,
            'receiver': receiver
        };
        
        // save message in own conversation
        if (typeof sim.backend.conversations[receiver] == 'undefined') 
            sim.backend.conversations[receiver] = [];
        var conversation = sim.backend.conversations[receiver];
        conversation[conversation.length] = $.extend({}, message, { datetime: new Date().getTime() });
        sim.backend.getConversation(receiver);
        
        // send message to all users
        for (var i=0; i<users.length; i++) {
            // don't send message to this user
            if (users[i].username == currentuser)
                continue;
            
            // send message
            sim.backend.client.send(users[i], message, function() {
                sim.backend.getConversation(receiver);
            }, sim.backend.error);
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
     * save avatar in local storage
     * @param avatar (string) base64 encoded avatar
     */
    saveAvatar: function(avatar) {
        window.localStorage.avatar = avatar;
        sim.backend.userlistUpdateUsersOwnFile();
    },
    
    
    /**
     * load avatar from local storage
     * @return (string) base64 encoded avatar
     */
    loadAvatar: function() {
        return window.localStorage.avatar;
    },
    
    
    /**
     * get avatar of a given user or default avatar avatar.png
     * @return (string) base64 encoded avatar of the user (if available)
     * @param username (string) the username
     */
    getAvatar: function(username) {
        var avatar = "avatar.png";
        for(var i=0; i<sim.backend.userlist.length; i++) {
            if (sim.backend.userlist[i].username==username && typeof sim.backend.userlist[i].avatar != 'undefined') {
                avatar = sim.backend.userlist[i].avatar;
                break;
            }
        }
        return avatar;
    },
    
    
    /**
     * send system notification
     * @param image (string) little image shown in the notification
     * @param title (string) title of the notification
     * @param text (string) text of the notification
     */
    notification: function(image, title, text) {
        if(sim.backend.enableNotifications==true)
            window.LOCAL_NW.desktopNotifications.notify(image, title, text);
    },
    
    
    /**
     * returns array with all known users
     * @return (array) of all users
     * @param whithourCurrentUser (boolean) include current user in result or not
     */
    getAllUsers: function(withoutCurrentUser) {
        var currentuser = sim.backend.helpers.getUsername();
        var users = [];
        for(var i=0; i<sim.backend.userlist.length; i++) {
            if (withoutCurrentUser==true && sim.backend.userlist[i].username == currentuser)
                continue;
            users[users.length] = sim.backend.userlist[i].username;
        }
        return users;
    },
    
    
    /**
     * get user from userlist or false if user not available
     * @return (object) returns given user with detail informations
     * @param name (string) the name of the user
     */
    getUser: function(name) {
        return sim.backend.helpers.getUser(sim.backend.userlist, name);
    },
    
    
    /**
     * returns all users which are in a given room
     * @return (array) of all users in a given room
     * @param room (string) roomname
     */
    getUsersInRoom: function(room) {
        // room for all users?
        if (room==config.room_all)
            return sim.backend.userlist;
        
        // a user created room
        var users = [];
        for(var i=0; i<sim.backend.userlist.length; i++) {
            for(var n=0; n<sim.backend.userlist[i].rooms.length; n++) {
                if (sim.backend.userlist[i].rooms[n].name==room) {
                    users[users.length] = sim.backend.userlist[i];
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
        sim.backend.invited = sim.backend.helpers.removeRoomFromList(sim.backend.invited, room);
        sim.backend.updateRoomlist();
    },
    
    
    /**
     * accept room invitation
     * @param room (string) roomname
     */
    acceptInvitation: function(room) {
        // remove room from invitation list
        sim.backend.invited = sim.backend.helpers.removeRoomFromList(sim.backend.invited, room);
        
        // check still in room?
        if (sim.backend.helpers.isUserInRoomList(sim.backend.roomlist, room)) {
            sim.backend.error('Du bist bereits in dem Raum');
            return;
        }
        
        // add room to roomlist
        sim.backend.roomlist[sim.backend.roomlist.length] = { 'name': room };
        sim.backend.updateRoomlist();
    },
    
    
    /**
     * add new room
     * @param room (string) roomname
     * @param users (array) array of all usernames
     */
    addRoom: function(room, users) {
        var room = room.trim();
        sim.backend.inviteUsers(room, users);
        sim.backend.roomlist[sim.backend.roomlist.length] = { 'name': room };
        sim.backend.updateRoomlist();
    },
    
    
    /**
     * invite new users to room
     * @param room (string) roomname
     * @param users (array) array of all usernames
     */
    inviteUsers: function(room, users) {
        if (typeof users == 'undefined' || users == null)
            users = [];
        var usersFromList = [];
        for (var i=0; i<users.length; i++)
            usersFromList[usersFromList.length] = sim.backend.getUser(users[i]);
        users = usersFromList;
        
        var message = {
            'type': 'invite',
            'room': room,
            'sender': sim.backend.helpers.getUsername(),
            'receiver': ''
        };
        
        // send invite to all users
        for (var i=0; i<users.length; i++) {
            message.receiver = users[i].username;
            sim.backend.client.send(users[i], message, function() {}, sim.backend.error);
        }
    },
    
    
    /**
     * leave room
     * @param room (string) roomname
     */
    leaveRoom:function(room) {
        var newRoomlist = [];
        for (var i=0; i<sim.backend.roomlist.length; i++) {
            if (sim.backend.roomlist[i].name != room) {
                newRoomlist[newRoomlist.length] = sim.backend.roomlist[i];
            }
        }
        sim.backend.roomlist = newRoomlist;
        sim.backend.updateRoomlist();
    },
    
    
    /**
     * enable/disable notifications
     * @param enable (boolean) enable/disable system notifications
     */
    notifications: function(enable) {
        sim.backend.enableNotifications = enable;
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
        for(var i=0; i<sim.backend.userlist.length; i++) {
            for(var n=0; n<sim.backend.userlist[i].rooms.length; n++) {
                if (sim.backend.userlist[i].rooms[n].name.toLowerCase() == room) {
                    return true;
                }
            }
        }
        return false;
    },
    
    
    /**
     * returns username of current user
     * @return (string) username
     */
    getUsername: function() {
        return sim.backend.helpers.getUsername();
    }
};