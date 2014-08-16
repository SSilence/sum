if (typeof base64  == 'undefined') base64  = require('base64-stream');
if (typeof fs == 'undefined') fs = require('fs');
if (typeof http == 'undefined') http = require('http');

/**
 * client for sending encrypted chat messages and status updates
 *
 * @copyright  Copyright (c) Tobias Zeising (http://www.aditu.de)
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
define('sum-backend-client', Class.extend({

    /**
     * backends crypto functions
     */
    backendCrypto: injected('sum-backend-crypto'),


    /**
     * list of message id for canceling download
     */
    cancelList: [],
    

    /**
     * send new message or information to another user
     * @param receiver (mixed) the target user (with ip, port and key)
     * @param message (mixed) the message as object (depends from the content of the message)
     * @param success (function) callback on success
     * @param error (function) callback on error
     */
    send: function(receiver, message, success, error) {
        // encrypt message
        var encMessage = this.backendCrypto.rsaencrypt(new NodeRSA(receiver.key), message);

        // send message
        var request = http.request({
            host: receiver.ip,
            port: receiver.port,
            path: '/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': encMessage.length
            }
        }, function(res) {
            // result is ok? execute success
            if(res.statusCode == 200) {
                if (typeof success != 'undefined') {
                    success(res);
                }
            } else {
                error(lang.backend_client_send_error.replace(/\%s/, receiver.username.escape()), res.statusCode);
            }
        });

        // on error
        request.on('error', function(e) {
            error(lang.backend_client_send_not_reachable.replace(/\%s1/, receiver.username.escape()).replace(/\%s2/, e.toString().escape()));
        });

        request.write(encMessage);
        request.end();
    },
    
    
    /**
     * load file from given receiver.
     * @return (binary) file
     * @param params (object) params for file download
     */
    file: function(params) {
        var that = this;
        this.send(
            params.user,
            {
                type: 'file-request',
                file: params.file,
                sender: params.sender
            },
            function(response) {
                // decryption stream (password is file id, thats save because file id will be sent rsa encrypted)
                var base64 = require('base64-stream');
                var crypto = require('crypto');
                var aes = crypto.createDecipher('aes-256-cbc', crypto.createHash('sha256').update(params.file).digest('hex'));
                            
                // file stream
                var file = fs.createWriteStream(params.target);
                var base64reader = base64.decode();
                response.pipe(base64reader)  // decode base64
                        .pipe(aes)              // decrypt
                        .pipe(file);            // write in file
                
                // write file error
                file.on('error', function() {
                    params.error(lang.backend_filesystem_write_error);
                });
                
                // on data chunk received
                aes.on('data', function (chunk) {
                    // cancel download?
                    if (that.checkCancelResponse(response, params.file)) {
                        params.cancel();
                        return;
                    }
                    
                    // target not created: continue
                    if (fs.existsSync(params.target) === false)
                        return;
                    
                    var fileSize = fs.statSync(params.target).size;
                    var percent = Math.floor((fileSize / params.size) * 100);
                    if (typeof params.progress !== 'undefined' && percent % 5 === 0)
                        params.progress(percent);
                });
                
                // on last data chunk received: file load complete
                aes.on('end', function (chunk) {
                    params.progress(100);
                    if (typeof params.success !== 'undefined')
                        params.success();
                });
                
                // on error close aes stream (other client quits unexpectly)
                aes.on('error', function (err) {
                    aes.emit('close');
                });
                
            },
            function(error, status) {
                if (typeof status !== 'undefined' && status === 404)
                    params.error(lang.backend_client_file_not_available);
                else
                    params.error(error);
            }
        );
    },
    
    
    /**
     * cancels download
     * @return (boolean) true if canceled
     * @param response (object) object
     * @param file (string) file id
     */
    checkCancelResponse: function(response, file) {
        var cancel = false;
        
        // search id
        $.each(this.cancelList, function(index, item) {        
            if (item === file) {
                response.removeAllListeners("data");
                response.destroy();
                cancel = true;
                return false;
            }
        });
        
        // remove id from list
        if (cancel === true) {
            var newCancelList = [];
            $.each(this.cancelList, function(index, item) {
                if (item !== file)
                    newCancelList[newCancelList.lenth] = item;
            });
            this.cancelList = newCancelList;
        }
        
        return cancel;
    }
}));
