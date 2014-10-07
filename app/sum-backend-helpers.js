if (typeof os == 'undefined') os = require('os');
if (typeof gui == 'undefined') gui = require('nw.gui');

/**
 * helpers for backend
 *
 * @copyright  Copyright (c) Tobias Zeising (http://www.aditu.de)
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
define('sum-backend-helpers', Class.extend({

    /**
     * search user in userlist
     * @return (object|boolean) user object or false if none was found
     * @param userlist (array of object) list with all users (object with property username)
     * @param user (string) username which will be searched
     */
    getUser: function(userlist, user) {
        user = user.toLowerCase();
        for(var i=0; i<userlist.length; i++) {
            if (userlist[i].username.toLowerCase() == user) {
                return userlist[i];
            }
        }
        return false;
    },


    /**
     * removes a room from given list
     * @return (Array) list without given room
     * @param list (array) with objects with property name
     * @param room (string) roomname which should be removed
     */
    removeRoomFromList: function(list, room) {
        var newList = [];
        for(var i=0; i<list.length; i++) {
            if (list[i].name == room)
                continue;
            newList[newList.length] = list[i];
        }
        return newList;
    },


    /**
     * returns true if user is in list
     * @return (boolean) true if user was found, false otherwise
     * @param list (array) with users
     * @param room (string) roomname in which the user should be
     */
    isUserInRoomList: function(list, room) {
        for (var i=0; i<list.length; i++) {
            if (list[i].name == room) {
                return true;
            }
        }
        return false;
    },


    /**
     * returns all users, which are not in list but in compare
     * @return (Array) list with all users, which are in the first list but not in the second
     * @param list (array) with users with property username
     * @param compare (array) with users with property username
     */
    getUsersNotInListOne: function(list, compare) {
        var notInList = [];
        for(var i=0; i<compare.length; i++) {
            var inList = false;
            for(var n=0; n<list.length; n++) {
                if(compare[i].username==list[n].username)
                    inList = true;
            }
            if (inList===false)
                notInList[notInList.length] = compare[i];
        }
        return notInList;
    },


    /**
     * returns all users, which have the same status
     * @return (array) list with all users, which have the same status
     * @param list (array) with users
     * @param status (string) the user status
     */
    getUsersByStatus: function(list, status) {
        var usersWithStatus = [];
        for(var i=0; i<list.length; i++) {
            if (list[i].status === status)
                usersWithStatus[usersWithStatus.length] = list[i];
        }
        return usersWithStatus;
    },


    /**
     * sort userlist by username
     * @param userlist (array) unsorted userlist
     * @return (array) sorted userlist
     */
    sortUserlistByUsername: function(userlist) {
        return userlist.sort(function(a,b) {
            if (a.username.toLowerCase() < b.username.toLowerCase())
                return -1;
            if (a.username.toLowerCase() > b.username.toLowerCase())
                return 1;
            return 0;
        });
    },


    /**
     * merge user and extended userinfos (as avatar, ip, ...)
     * @return (object) with user and userinfos data
     * @param user (object) userobject
     * @param userinfos (object) additional userinfos
     */
    mergeUserAndUserinfos: function(user, userinfos) {
        user.ip = userinfos.ip;
        user.port = userinfos.port;
        user.key = userinfos.key;
        user.version = userinfos.version;

        if (typeof userinfos.avatar != 'undefined')
            user.avatar = userinfos.avatar;

        return user;
    },

    
    /**
     * returns current ip
     * @return (string|boolean) the ip of the current user
     */
    getIp: function() {
        var ifaces=os.networkInterfaces();
        var ip = false;
        var excluded = config.excluded_ips.split(',');
        for (var dev in ifaces) {
            ifaces[dev].forEach(function(details){
                if (details.family!='IPv4')
                    return;

                for (var i = 0; i<excluded.length; i++) {
                    if (details.address.indexOf(excluded[i])===0) {
                        return;
                    }
                }

                ip = details.address;
            });
        }
        return ip;
    },


    /**
     * returns current systems username
     * @return (string) the username of the current user (from System environment variables)
     */
    getUsername: function() {
        if (typeof config.username == "undefined")
            return (process.env.USER || process.env.USERNAME).toLowerCase();
        else
            return config.username.toLowerCase();
    },


    /**
     * find message in given conversations array
     * @return (boolean|object) message or false
     * @param conversations (array) array with all conversations
     * @param id (string) id of message
     */
    findMessage: function(conversations, id) {
        for (var key in conversations) {
            for (var i=0; i<conversations[key].length; i++) {
                if (conversations[key][i].id == id) {
                    return conversations[key][i];
                }
            }
        }
        return false;
    },


    /**
     * generates new guid for messages
     * @returns {string} unique id as string
     */
    genereateGUID: function(){
        var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
        return guid;
    },


    /**
     * returns true if given version is newer than the current version
     * @param current (string) version
     * @param given (string) version
     */
    isVersionNewer: function(current, given) {
        // wrong format? return false
        if (given.search(/^\d+\.\d+\.\d+$/) == -1)
            return false;

        if (current.search(/^\d+\.\d+\.\d+$/) == -1)
            return false;

        // parse version number
        var regex = /(\d+)\.(\d+)\.(\d+)/;
        var currentVersion = regex.exec(current);
        var givenVersion = regex.exec(given);

        // convert to int
        var i;
        for(i=0; i<currentVersion.length; i++)
            currentVersion[i] = parseInt(currentVersion[i]);
        for(i=0; i<givenVersion.length; i++)
            givenVersion[i] = parseInt(givenVersion[i]);

        // compare
        return currentVersion[1] == givenVersion[1] && currentVersion[2] == givenVersion[2] && currentVersion[3] < givenVersion[3] ||
               currentVersion[1] == givenVersion[1] && currentVersion[2] < givenVersion[2] ||
               currentVersion[1] < givenVersion[1];
    },

    
    /**
     * get room in list
     * @return (boolean|object) false or room object
     * @param list (array) of rooms
     * @param room (string) roomname
     */
    getRoom: function(list, room) {
        var found = false;
        $.each(list, function(index, value) {
            if (value.name === room) {
                found = value;
                return false;
            }
        });
        return found;
    },


    /**
     * shows game dialog window with given game
     * @param game (string) game name
     * @param width (int) windows width
     * @param height (int) windows height
     */
    openGameWindow: function(game, width, height) {
        gui.Window.open('../gamez/' + game + '/index.html', {
            position: 'center',
            width: typeof width === 'undefined' ? 700 : width,
            height: typeof height === 'undefined' ? 500 : height,
            focus: true,
            toolbar: false,
            frame: true
        });
    },
    
    
    /**
     * removes newlines and ---- BEGIN PUBLIC KEY -----...
     * @return (string) only base64 key
     * @param (string) key
     */
    extractBase64Key: function(key) {
        return key.replace(/(\-)+[^\-]+(\-)+/g, '').replace(/[^a-z0-9+/=]/gi,'');
    }
}));
