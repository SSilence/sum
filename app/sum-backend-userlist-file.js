/**
 * handels userlist file update by using a file in shared file system
 *
 * @copyright  Copyright (c) Tobias Zeising (http://www.aditu.de)
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
define('sum-backend-userlist-file', Class.extend({

    /**
     * backends
     */
    backend: injected('sum-backend'),


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
     * timestamp userfile was written
     */
    userfileTimestamp: false,


    /**
     * cache for all additional userinfos
     */
    userinfos: {},


    /**
     * count userfile update error
     */
    userfileError: 0,


    /**
     * write extended userfile with avatar, ip, chatport and other less frequently updated information
     * @param ip (string) current ip address
     * @param port (int) current port
     * @param key (string) current key
     * @param avatar (string) current avatar
     * @param success (callback) will be executed after successfully writing file
     */
    userlistUpdateUsersOwnFile: function(ip, port, key, avatar, version, success) {
        var file = config.user_file_extended.replace(/\?/, this.backendCrypto.md5(this.backendHelpers.getUsername()));
        var that = this;

        this.backendFilesystem.writeEncryptedFile(
            file,
            {
                ip: ip,
                port: port,
                key: key.getPublicPEM(),
                avatar: avatar,
                version: version
            },
            function() {
                that.userfileTimestamp = new Date().getTime();
                if (typeof success != 'undefined')
                    success();
            },
            that.backend.error,
            config.aes_key
        );

    },


    /**
     * timer: regular userfile and userlist update for current user
     */
    userlistUpdateTimer: function() {
        var that = this;
        this.backendFilesystem.lock(function(err) {
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
        that.backendFilesystem.readEncryptedFile(
            config.user_file,
            function(users) {
                that.userlistUpdate(users);
            },
            function(err) {
                that.userlistUpdate([]);
            },
            config.aes_key
        );
    },


    /**
     * updates userlist
     * @param users list of users
     */
    userlistUpdate: function(users) {
        // reset error counter
        this.userfileError = 0;

        var currentuser = this.backendHelpers.getUsername();
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
            if (users[i].timestamp + config.user_remove > now) {
                // if user has a timeout, set status to offline
                if (users[i].status == 'online' && users[i].timestamp + config.user_timeout < now) {
                    users[i].status = 'offline';
                }
                
                userlist[userlist.length] = users[i];
            }
        }

        // add current user
        userlist[userlist.length] = {
            timestamp: now,
            status: 'online',
            userfileTimestamp: this.userfileTimestamp,
            rooms: this.backend.roomlist,
            username: currentuser
        };

        // write back updated userfile
        var that = this;
        this.backendFilesystem.writeEncryptedFile(
            config.user_file,
            userlist,
            function() {
                // release lock
                that.backendFilesystem.unlock();
            },
            this.backend.error,
            config.aes_key
        );

        // load additional userinfos and update local userlist
        this.userlistLoadAdditionalUserinfos(userlist);
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
                var file = config.user_file_extended.replace(/\?/, that.backendCrypto.md5(users[currentIndex].username));
                that.backendFilesystem.readEncryptedFile(
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
                    },
                    config.aes_key
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
        // fix corrupt userlist
        users = this.compensateCorruptUserlist(users);

        // check public keys of users
        users = this.checkPublickeys(users);
        
        // sort userlist by username
        users = this.backendHelpers.sortUserlistByUsername(users);

        // show notification for users which are now online/offline/removed
        this.backend.showOnlineOfflineNotifications(users);
        
        // save userlist
        this.backend.userlist = users;
        
        // inform frontend that new userlist is available
        if(typeof this.backend.hasUserlistUpdate != "undefined")
            this.backend.hasUserlistUpdate();

        // initialize next update
        var that = this;
        window.setTimeout(function() {
            that.userlistUpdateTimer();
        }, config.user_list_update_intervall);
    },


    /**
     * check public keys
     * @return (array) users with invalidkey value on wrong public key
     * @param users (array) all users
     */
    checkPublickeys: function(users) {
        // check public key
        for (var i = 0; i < users.length; i++) {
            var key = this.backend.getPublicKey(users[i].username);
            if (key !== false && users[i].key === key)
                users[i].invalidkey = false;
            else if (key !== false)
                users[i].invalidkey = true;
        }
        return users;
    },
    
    
    /**
     * Compensates corrupt or wrong userfile. If a user is in local userlist and not in userlist.json
     * and user is not timedout for removing from list, the user will be restored in the userlist.
     * @param users userlist
     * @returns (array) userlist with restored users
     */
    compensateCorruptUserlist: function(users) {
        // search in old userlist
        $.each(this.backend.userlist, function(index, oldUser) {
            var found = false;

            // search oldUser in new userlist
            $.each(users, function(index, user) {
                if(oldUser.username == user.username) {
                    found = true;
                    return false;
                }
                return true;
            });

            // if user is not in new userlist and not timedout: restore it
            var now = new Date().getTime();
            if (found === false && oldUser.timestamp + config.user_remove > now) {
                users[users.length] = oldUser;
            }

            return true;
        });

        return users;
    }

}));
