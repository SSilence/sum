if (typeof fs == 'undefined') fs = require('fs');
if (typeof NodeRSA == 'undefined') NodeRSA = require('node-rsa');
if (typeof os == 'undefined') os = require('os');
if (typeof lockFile == 'undefined') lockFile = require('lockfile');

/**
 * helpers for backend
 *
 * @copyright  Copyright (c) Tobias Zeising (http://www.aditu.de)
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
define('sum-backend-helpers', Class.extend({

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
     * returns new RSA Key Pair
     * @return (NodeRSA) new RSA keypair
     */
    generateKeypair: function() {
        return new NodeRSA({b: 2048});
    },


    /**
     * returns current ip
     * @return (string or boolean) the ip of the current user
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
            return process.env.USERNAME.toLowerCase();
        else
            return config.username.toLowerCase();
    },


    /**
     * write object as json in file
     * @param file (string) filename for writing the content
     * @param content (object) will be json encoded written into file
     * @param success (callback) will be called on success
     * @param error (function) will be executed on error
     */
    writeJsonFile: function(file, content, success, error) {
        if (typeof error == 'undefined')
            error = function(error) {
                throw new Error(error);
            };

        fs.writeFile(file, JSON.stringify(content, null, 4), 'utf8', function(err) {
            if(err)
                error('Fehler beim Schreiben der Userliste: ' + err);
            else if (typeof success != 'undefined')
                success();
        });
    },


    /**
     * read json encoded file and return as object
     * @param file (string) path and filename
     * @param success (function) after successfully reading and json parsing content of file
     * @param error (function) after error on reading and json parsing content of file
     */
    readJsonFile: function(file, success, error) {
        if (typeof error == 'undefined')
            error = function() {};

        fs.readFile(file, 'utf8', function (err, data) {
            var res = [];
            if (err) {
                error(err);
                return;
            }

            try {
                res = JSON.parse(data);
            } catch (er) {
                error('json parse error');
            }

            success(res);
        });
    },


    /**
     * read file and return as ByteBuffer
     * @param file (string) path and filenam
     * @param success (function) contains file data
     * @param error (function) will be executed on error
     */
    readFile: function(file, success, error) {
        fs.readFile(file, function (err, data) {
            if (err) {
                error('Datei konnte nicht geladen werden');
                return;
            }

            success(data);
        });
    },


    /**
     * get lock for user list file.
     * @param callback (function) callback after locking successfully or not successfully the file
     */
    lock: function(callback) {
        lockFile.lock(config.lock_file, { stale: config.lock_stale }, callback);
    },


    /**
     * release lock for user list file
     */
    unlock: function() {
        lockFile.unlock(config.lock_file, function(err) {});
    },


    /**
     * encrypt with RSA
     * @return encrypted string
     * @param key (string) public key for encryption
     * @param data (mixed) data for encryption
     */
    encrypt: function(key, data) {
        return key.encrypt(data, 'base64');
    },


    /**
     * decrypt with RSA
     * @return (string) decrypted string
     * @param key (string) public key for decryption
     * @param data (mixed) data for decryption
     */
    decrypt: function(key, data) {
        return key.decrypt(data).toString();
    },


    /**
     * search user in userlist
     * @return (object or boolean) user object or false if none was found
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
        var i=0;
        for(i=0; i<currentVersion.length; i++)
            currentVersion[i] = parseInt(currentVersion[i]);
        for(i=0; i<givenVersion.length; i++)
            givenVersion[i] = parseInt(givenVersion[i]);

        // compare
        return currentVersion[1] == givenVersion[1] && currentVersion[2] == givenVersion[2] && currentVersion[3] < givenVersion[3] ||
               currentVersion[1] == givenVersion[1] && currentVersion[2] < givenVersion[2] ||
               currentVersion[1] < givenVersion[1];
    }
}));
