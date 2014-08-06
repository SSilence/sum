if (typeof base64  == 'undefined') base64  = require('base64-stream');
if (typeof fs == 'undefined') fs = require('fs');

/**
 * client for sending encrypted chat messages and status updates
 *
 * @copyright  Copyright (c) Tobias Zeising (http://www.aditu.de)
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
define('sum-backend-client', Class.extend({

    /**
     * backends helpers
     */
    backendHelpers: injected('sum-backend-helpers'),


    /**
     * send new message or information to another user
     * @param receiver (mixed) the target user (with ip, port and key)
     * @param message (mixed) the message as object (depends from the content of the message)
     * @param success (function) callback on success
     * @param error (function) callback on error
     */
    send: function(receiver, message, success, error) {
        // encrypt message
        var encMessage = this.backendHelpers.encrypt(new NodeRSA(receiver.key), message);

        // send message
        var request = http.request({
            host: receiver.ip,
            port: receiver.port,
            path: '/',
            method: 'POST',
            headers: {
                'Content-Txype': 'application/json',
                'Content-Length': encMessage.length
            }
        }, function(res) {
            // result is ok? execute success
            if(res.statusCode == 200) {
                if (typeof success != 'undefined') {
                    success(res);
                }
            } else {
                error('Bei der Kommunikation mit ' + receiver.username.escape() + ' ist ein Fehler aufgetreten');
            }
        });

        // on error
        request.on('error', function(e) {
            error('Der Benutzer ' + receiver.username.escape() + ' ist nicht erreichber. Fehler: ' + e);
        });

        request.write(encMessage);
        request.end();
    },
    
    
    /**
     * load file from given receiver.
     * @return (binary) file
     * @param receiver (mixed) the target user (with ip and port)
     * @param id (string) id of the file
     * @param success (function) callback on success
     * @param error (function) callback on error
     * @param progress (function) callback on progress
     */
    file: function(receiver, id, success, error, progress) {
        this.send(receiver, {
            type: 'file-request',
            file: id
        }, function(response) {
            // decryption stream (password is file id, thats save because file id will be sent rsa encrypted)
            var base64 = require('base64-stream');
            var crypto = require('crypto');
            var aes = crypto.createDecipher('aes-256-cbc', crypto.createHash('sha256').update(id).digest('hex'));
                        
            // file stream
            var file = fs.createWriteStream('c:/tmp/received.jpg');
            response.pipe(base64.decode())  // decode base64
                    .pipe(aes)              // decrypt
                    .pipe(file);            // write in file
            
            // on data chunk received
            var received = 0; // progress counter
            response.on('data', function (chunk) {
                received += chunk.length;
                if (typeof progress !== 'undefined')
                    progress(received);
            });
            
            // on last data chunk received: file load complete
            response.on('end', function (chunk) {
                if (typeof success !== 'undefined')
                    success(file);
            });
           
        },
        error);
    }
}));
