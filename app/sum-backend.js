var gui = require('nw.gui');

/**
 * backend handles messaging, userlist management, update of userlist and all nodejs/node webkit tasks
 *
 * @copyright  Copyright (c) Tobias Zeising (http://www.aditu.de)
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
var Backend = Class.extend({

    /**
     * backends helpers
     */
    backendHelpers: false,


    /**
     * backends client
     */
    backendClient: false,


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
     * @param backendHelpers (object) the current backends helpers
     * @param backendServer (object) the server of the backend
     * @param backendClient (object) the client of the backend
     */
    init: function(backendHelpers, backendServer, backendClient) {
        // save instances
        this.backendHelpers = backendHelpers;
        this.backendClient = backendClient;

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
        this.key = backendHelpers.generateKeypair();

        // set ip
        this.ip = backendHelpers.getIp();

        // init node webkit tray icon
        this.initTray();

        // start backend server for chat communication
        var that = this;
        backendServer.start(this, backendHelpers, function(port) {
            // save port
            that.port = port;

            // create/update userfile (holds additional information as avatar, key, ip, ...)
            // afterwards start updating the userlist
            that.userlistUpdateUsersOwnFile(function() {
                that.userlistUpdateTimer();
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
        var that = this;
        this.backendHelpers.lock(function(err) {
            // can't get lock for exclusive userfile access? retry in random timeout
            if (typeof err != 'undefined') {
                var randomTimeout = Math.floor(Math.random() * config.lock_retry_maximum) + config.lock_retry_minimum;
                window.setTimeout(function() {
                    that.userlistUpdateTimer();
                }, randomTimeout);
                return;
            }

            // have lock? Update userlist
            that.userlistUpdater();
        });
    },


    /**
     * all users are registered in a single json file. This method updates or adds
     * an entry of the current user.
     */
    userlistUpdater: function() {
        var that = this;
        that.backendHelpers.readJsonFile(config.user_file, function(users) {
            var currentuser = that.backendHelpers.getUsername();
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
                userfileTimestamp: that.userfileTimestamp,
                rooms: that.roomlist
            };

            // write back updated userfile
            that.backendHelpers.writeJsonFile(
                config.user_file,
                userlist,
                function() {
                    // release lock
                    that.backendHelpers.unlock();
                },
                that.error
            );

            // load additional userinfos and update local userlist
            that.userlistLoadAdditionalUserinfos(userlist);
        });
    },


    /**
     * loads all additional userinfos from users single files
     * @param users (array) fetched users
     */
    userlistLoadAdditionalUserinfos: function(users) {
        var that = this;

        // next step will be executed if all additonal informations of all users was loaded (toMerge == 0)
        var toMerge = users.length;

        // checks whether all userinfos was fetched
        var checkAllHandledThenExecuteRefreshUserlist = function() {
            toMerge--;
            if(toMerge===0)
                that.userlistRefreshFrontend(users);
        };

        // loads current userinfos for a single user
        var loadUserinfos = function(currentIndex) {
            // load from users file if not in cache or newer one available
            if (typeof that.userinfos[users[currentIndex].username] == 'undefined' ||
                users[currentIndex].userfileTimestamp != that.userinfos[users[currentIndex].username].timestamp) {

                // read userinfos from file
                var file = config.user_file_extended.replace(/#/, CryptoJS.MD5(users[currentIndex].username));
                that.backendHelpers.readJsonFile(
                    file,
                    function(userinfos) {
                        // merge user and userinfos
                        if (typeof userinfos.ip != 'undefined' && typeof userinfos.port != 'undefined' && typeof userinfos.key != 'undefined') {
                            users[currentIndex] = that.backendHelpers.mergeUserAndUserinfos(users[currentIndex], userinfos);

                            // save userinfos in cache
                            userinfos.timestamp = users[currentIndex].userfileTimestamp;
                            that.userinfos[users[currentIndex].username] = userinfos;
                        }
                        checkAllHandledThenExecuteRefreshUserlist();
                    },
                    function() {
                        checkAllHandledThenExecuteRefreshUserlist();
                    }
                );

            // load from cache
            } else {
                users[currentIndex] = that.backendHelpers.mergeUserAndUserinfos(users[currentIndex], that.userinfos[users[currentIndex].username]);
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
        users = this.backendHelpers.sortUserlistByUsername(users);

        // show notification for users which are now online/offline
        if (this.firstUpdate===false) {
            var online = this.backendHelpers.getUsersNotInListOne(this.userlist, users);
            var offline = this.backendHelpers.getUsersNotInListOne(users, this.userlist);
            var i=0;

            if (typeof this.userOnlineNotice != 'undefined')
                for(i=0; i<online.length; i++)
                    this.userOnlineNotice(online[i].avatar, online[i].username);

            if (typeof this.userOfflineNotice != 'undefined')
                for(i=0; i<offline.length; i++)
                    this.userOfflineNotice(offline[i].avatar, offline[i].username);
        }
        this.firstUpdate = false;

        // save userlist
        this.userlist = users;

        // inform frontend that new userlist is available
        if(typeof this.hasUserlistUpdate != "undefined")
            this.hasUserlistUpdate();

        // initialize next update
        var that = this;
        window.setTimeout(function() {
            that.userlistUpdateTimer();
        }, config.user_list_update_intervall);
    },


    /**
     * write extended userfile with avatar, ip, chatport and other less frequently updated information
     * @param success (callback) will be executed after successfully writing file
     */
    userlistUpdateUsersOwnFile: function(success) {
        var file = config.user_file_extended.replace(/#/, CryptoJS.MD5(this.backendHelpers.getUsername()));
        var that = this;
        this.backendHelpers.writeJsonFile(
            file,
            {
                ip: that.ip,
                port: that.port,
                key: that.key.getPublicPEM(),
                avatar: that.loadAvatar()
            },
            function() {
                that.userfileTimestamp = new Date().getTime();
                if (typeof success != 'undefined')
                    success();
            },
            that.error
        );

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



    ////////////////////////////
    // functions for frontend //
    ////////////////////////////


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
     * send new message. receiver is username or roomname.
     * @param receiver (string) user or room
     * @param text (string) the message
     */
    sendMessage: function(receiver, text) {
        // get user or users of a given room
        var users = this.backendHelpers.getUser(this.userlist, receiver);
        if (users===false) {
            users = this.getUsersInRoom(receiver);
        } else {
            users = [ users ];
        }

        // no room or user found
        if (users.length===0) {
            this.error('Ungültiger Benutzer oder Raum');
            return;
        }

        // create new message
        var currentuser = this.backendHelpers.getUsername();
        var message = {
            'type': 'message',
            'text': text,
            'sender': currentuser,
            'receiver': receiver
        };

        // save message in own conversation
        if (typeof this.conversations[receiver] == 'undefined')
            this.conversations[receiver] = [];
        var conversation = this.conversations[receiver];
        conversation[conversation.length] = $.extend({}, message, { datetime: new Date().getTime() });
        this.getConversation(receiver);

        // send message to all users
        var that = this;
        for (var i=0; i<users.length; i++) {
            // don't send message to this user
            if (users[i].username == currentuser)
                continue;

            // send message
            this.backendClient.send(users[i], message, function() {
                that.getConversation(receiver);
            }, this.error);
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
        this.userlistUpdateUsersOwnFile();
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
        for(var i=0; i<this.userlist.length; i++) {
            if (this.userlist[i].username==username && typeof this.userlist[i].avatar != 'undefined') {
                avatar = this.userlist[i].avatar;
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
        if(this.enableNotifications===true)
            window.LOCAL_NW.desktopNotifications.notify(image, title, text);
    },


    /**
     * returns array with all known users
     * @return (array) of all users
     * @param whithourCurrentUser (boolean) include current user in result or not
     */
    getAllUsers: function(withoutCurrentUser) {
        var currentuser = this.backendHelpers.getUsername();
        var users = [];
        for(var i=0; i<this.userlist.length; i++) {
            if (withoutCurrentUser === true && this.userlist[i].username == currentuser)
                continue;
            users[users.length] = this.userlist[i].username;
        }
        return users;
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
     * returns all users which are in a given room
     * @return (array) of all users in a given room
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
        this.invited = this.backendHelpers.removeRoomFromList(this.invited, room);
        this.updateRoomlist();
    },


    /**
     * accept room invitation
     * @param room (string) roomname
     */
    acceptInvitation: function(room) {
        // remove room from invitation list
        this.invited = this.backendHelpers.removeRoomFromList(this.invited, room);

        // check still in room?
        if (this.backendHelpers.isUserInRoomList(this.roomlist, room)) {
            this.error('Du bist bereits in dem Raum');
            return;
        }

        // add room to roomlist
        this.roomlist[this.roomlist.length] = { 'name': room };
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
        var i = 0;
        for (i=0; i<users.length; i++)
            usersFromList[usersFromList.length] = this.getUser(users[i]);
        users = usersFromList;

        var message = {
            'type': 'invite',
            'room': room,
            'sender': this.backendHelpers.getUsername(),
            'receiver': ''
        };

        // send invite to all users
        for (i=0; i<users.length; i++) {
            message.receiver = users[i].username;
            this.backendClient.send(users[i], message, function() {}, this.error);
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
        this.updateRoomlist();
    },


    /**
     * enable/disable notifications
     * @param enable (boolean) enable/disable system notifications
     */
    notifications: function(enable) {
        this.enableNotifications = enable;
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


    /**
     * returns username of current user
     * @return (string) username
     */
    getUsername: function() {
        return this.backendHelpers.getUsername();
    }
});
