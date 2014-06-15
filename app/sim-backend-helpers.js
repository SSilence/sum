var fs = require('fs');
var NodeRSA = require('node-rsa');
var os = require('os');
var lockFile = require('lockfile');

sim.backend.helpers = {

    /**
     * all users are registered in a single json file. This method updates or adds
     * an entry of the current user.
     */
    updateUserlist: function(file, key, success) {
        sim.backend.helpers.readJsonFile(file, function(users) {
            var currentuser = sim.backend.helpers.getUsername();
            
            // search own user
            var found = false;
            var now = new Date().getTime();
            var newUserlist = [];
            for(var i=0; i<users.length; i++) {
                // only save active users
                if (users[i].timestamp + config.user_timeout > now) {
                    newUserlist[newUserlist.length] = users[i];
                }
                
                // update timestamp of current user
                if (newUserlist.length > 0 && newUserlist[newUserlist.length-1].username == currentuser) {
                    newUserlist[newUserlist.length-1].timestamp = now;
                    found = true;
                }
            }
            
            // user not found: add it
            if(found==false) {
                newUserlist[newUserlist.length] = {
                    username: currentuser,
                    timestamp: now,
                    key: key,
                    ip: sim.backend.ip,
                    port: config.chatport,
                    state: 'ONLINE', // todo
                    email: '', // todo
                    rooms: [] // todo
                }
            }
            
            // write back userfile
            sim.backend.helpers.writeJsonFile(file, newUserlist);
            
            // execute success method
            success(newUserlist);
        });
    },


    /**
     * returns new RSA Key Pair
     */
    generateKeypair: function() {
        return new NodeRSA({b: 2048});
    },
    
    
    /**
     * returns current ip
     */
    getIp: function() {
        var ifaces=os.networkInterfaces();
        var ip = false;
        for (var dev in ifaces) {
            ifaces[dev].forEach(function(details){
                if (details.family=='IPv4' && details.address!="127.0.0.1")
                    ip = details.address;
            });
        }
        return ip;
    },
    
    
    /**
     * returns current systems username
     */
    getUsername: function() {
        if (typeof config.username == "undefined")
            return process.env.USERNAME;
        else
            return config.username;
    },
    
    
    /**
     * write object as json in file
     */
    writeJsonFile: function(file, content) {
        fs.writeFile(file, JSON.stringify(content, null, 4), 'utf8', function(err) {
            if(err)
                alertify.error('Fehler beim Schreiben der Userliste: ' + err);
        }); 
    },
    
    
    /**
     * read json encoded file and return as object
     */
    readJsonFile: function(file, callback) {
        fs.readFile(file, 'utf8', function (err, data) {
            var res = [];
            if (err) {
                callback(res);
                return;
            }

            try {
                res = JSON.parse(data);
            } catch (er) {
                // do nothing, return []
            }

            callback(res);
        });
    },

    /**
     * get lock for user list file.
     */
    lock: function(callback) {
        lockFile.lock(config.lock_file, { stale: config.lock_stale }, callback);
    },
    
    
    /**
     * release lock for user list file.
     */
    unlock: function() {
        lockFile.unlock(config.lock_file, function(err) {});
    },
    
    
    /**
     * encrypt with RSA
     */
    encrypt: function(key, data) {
        return key.encrypt(data, 'base64');
    },
    
    
    /**
     * decrypt with RSA
     */
    decrypt: function(key, data) {
        return key.decrypt(data).toString();
    },
    
    
    /**
     * search user in userlist
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
     * send new message or information to another user
     */
    sendMessage: function(receiver, message, success) {
        // find user in userlist
        var user = sim.backend.helpers.getUser(sim.backend.userlist, receiver);
        if(user==false) {
            alertify.error('Benutzer nicht gefunden');
            return;
        }
        
        // encrypt message
        var message = sim.backend.helpers.encrypt(new NodeRSA(user.key), message);
        
        // send message
        var req = http.request({
            host: user.ip,
            port: user.port,
            path: '/',
            method: 'POST',
            headers: {
                'Content-Txype': 'application/json',
                'Content-Length': message.length
            }
        }, function(res) {
            if(res.statusCode == 200) {
                success();
            }
        });
        req.on('error', function(e) {
            alertify.error('Konnte Nachricht nicht senden ' + e);
        });
        req.write(message);
        req.end();
    }
    
};