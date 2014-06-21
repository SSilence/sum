/**
 * client for sending encrypted chat messages and status updates
 *
 * @copyright  Copyright (c) Tobias Zeising (http://www.aditu.de)
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
sim.backend.client = {

    /**
     * send new message or information to another user
     * @param receiver (mixed) the target user (with ip, port and key)
     * @param message (mixed) the message as object (depends from the content of the message)
     * @param success (function) callback on success
     * @param error (function) callback on error
     */
    send: function(receiver, message, success, error) {
        // encrypt message
        var encMessage = sim.backend.helpers.encrypt(new NodeRSA(receiver.key), message);
        
        // send message
        var req = http.request({
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
                    success();
                }
            } else {
                error('Bei der Kommunikation mit ' + receiver.username.escape() + ' ist ein Fehler aufgetreten');
            }
        });
        
        // on error
        req.on('error', function(e) {
            error('Der Benutzer ' + receiver.username.escape() + ' ist nicht erreichber. Fehler: ' + e);
        });
        
        req.write(encMessage);
        req.end();
    },
};