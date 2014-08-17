if (typeof http == 'undefined') http = require('http');
if (typeof request == 'undefined') request = require('request');

/**
 * handels userlist file update by using a web backend (see backend.php)
 *
 * @copyright  Copyright (c) Tobias Zeising (http://www.aditu.de)
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
define('sum-backend-userlist-web', Class.extend({

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
     * timestamp userfile was written
     */
    userfileTimestamp: false,


    /**
     * cache for all additional userinfos
     */
    userinfos: {},


    /**
     * write extended userfile with avatar, ip, chatport and other less frequently updated information
     * @param ip (string) current ip address
     * @param port (int) current port
     * @param key (string) current key
     * @param avatar (string) current avatar
     * @param success (callback) will be executed after successfully writing file
     */
    userlistUpdateUsersOwnFile: function(ip, port, key, avatar, version, success) {
        var that = this;
        var request = require('request');
        var sign = this.backendCrypto.sign(key, ip + port);

        // encrypt detail information
        var details = JSON.stringify({
            ip: ip,
            port: port,
            key: key.getPublicPEM(),
            avatar: avatar,
            version: version,
            signature: sign
        });
        var detail = this.backendCrypto.aesencrypt(details, config.web_aes_key);
        
        // send detail information
        request.post(config.web_url, { 
            form: { 
                'user': this.backendCrypto.sha256(this.backendHelpers.getUsername()),
                'detail': detail
            }
        }, function optionalCallback (err, httpResponse, body) {
            if (err) {
                that.backend.error(err);
            } else {
                that.userfileTimestamp = new Date().getTime();
                if (typeof success != 'undefined')
                    success();
            }
        });
    },


    /**
     * timer: regular userfile and userlist update for current user
     */
    userlistUpdateTimer: function() {
        var that = this;
        http.get(config.web_url, function(res) {
            var data = "";

            res.on('data', function(chunk){
                data += chunk;
            });

            res.on('end', function(){
                var users = JSON.parse(data);
                that.userlistUpdate(users);
            });

        }).on('error', function(e) {
            that.backend.error(e.message);
            that.restartUpdateTimer();
        }).end();
    },
    
    
    /**
     * updates userlist
     * @param encryptedUsers list of users
     */
    userlistUpdate: function(encryptedUsers) {
        var that = this;
        
        if ($.isArray(encryptedUsers) === false) {
            this.backend.error(lang.backend_userlist_web_decrypt_error);
            this.restartUpdateTimer();
            return;
        }
        
        // decrypt users array
        var users = [];
        $.each(encryptedUsers, function(index, encryptedUser) {
            if ($.trim(encryptedUser).length>0) {
                users[users.length] = JSON.parse(that.backendCrypto.aesdecrypt(encryptedUser, config.web_aes_key));
            }
        });
        
        // remove orphaned user entries
        var currentuser = this.backendHelpers.getUsername();
        var now = new Date().getTime();
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
            
            // delete inactive user
            } else {
                this.deleteInactiveUser(users[i].username);
            }
        }

        // add current user
        var currentUser = {
            timestamp: now,
            status: 'online',
            userfileTimestamp: this.userfileTimestamp,
            rooms: this.backend.roomlist,
            username: currentuser
        };
        userlist[userlist.length] = currentUser;
        
        // update currents user entry in web backend
        this.updateCurrentUser(currentUser);
        
        // load additional userinfos
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
                that.loadUserinfos(
                    users[currentIndex].username,
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
        this.restartUpdateTimer();
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
            if (key !== false && users[i].key !== key)
                users[i].invalidkey = true;
        }
        return users;
    },
    
    
    /**
     * loads additional userinfos
     * @param user (string) user name
     * @param success (function) success callback
     * @param error (function) error callback
     */
    loadUserinfos: function(user, success, error) {
        var that = this;
        
        request.get(config.web_url + '?user=' + this.backendCrypto.sha256(user),
            function(err, httpResponse, body) {
                if (err) {
                    error(err);
                    return;
                }
                try {
                    var decrypt = JSON.parse(that.backendCrypto.aesdecrypt(body, config.web_aes_key));
                    success(decrypt);
                } catch(e) {
                    error();
                }
            }
        );
    },
    
    
    /**
     * update currents user entry in web backend
     * @param user (object) user
     */
    updateCurrentUser: function(user) {
        var that = this;
        
        // encrypt user information
        var encrypted = this.backendCrypto.aesencrypt(JSON.stringify(user), config.web_aes_key);
        
        request.post(config.web_url, { 
            form: { 
                'user': this.backendCrypto.sha256(user.username),
                'pulse': encrypted
            }
        }, function(err, httpResponse, body) {
            if (err) {
                that.backend.error(err);
            }
        });
    },
    
    
    /**
     * delete inactive user form web backend
     * @param user (string) user name
     */
    deleteInactiveUser: function(user) {
        request.post(config.web_url, { 
            form: { 
                'user': this.backendCrypto.sha256(user),
                'delete': true
            } 
        });
    },
    
    
    /**
     * initialize next run of this userlist update job
     */
    restartUpdateTimer: function() {
        var that = this;
        window.setTimeout(function() {
            that.userlistUpdateTimer();
        }, config.user_list_update_intervall);
    }
    
}));
