/**
 * helpers for local storage access
 *
 * @copyright  Copyright (c) Tobias Zeising (http://www.aditu.de)
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
define('sum-backend-storage', Class.extend({

    /**
     * backends crypto functions
     */
    backendCrypto: injected('sum-backend-crypto'),
    

    /**
     * load avatar from local storage
     * @return (string) base64 encoded avatar
     */
    loadAvatar: function() {
        return localStorage.avatar;
    },


    /**
     * save avatar in local storage
     * @param (string) avatar base64 encoded avatar
     */
    saveAvatar: function(avatar) {
        localStorage.avatar = avatar;
    },

    
    /**
     * save given roomlist
     * @param (Array) roomlist current rooms user is in
     */
    saveRoomlist: function(roomlist) {
        localStorage.roomlist = JSON.stringify(roomlist);
    },
    
    
    /**
     * load roomlist from local storage
     * @return (Array) roomlist
     */
    loadRoomlist: function() {
        if (typeof localStorage.roomlist != 'undefined' && localStorage.roomlist !== null)
            return JSON.parse(localStorage.roomlist);
        return [];
    },
    
    
    /**
     * return true if key is set (key management will be used).
     * @return (boolean) true if key management is active, false otherwise
     */
    hasKey:function() {
        return (typeof localStorage.keypair != 'undefined');
    },
    
    
    /**
     * load stored key pair
     * @return (NodeRSA|boolean) loaded key pair or false on decryption/parse error
     * @param (string) keys password
     */
    loadKey: function(password) {
        if (typeof localStorage.keypair != 'undefined') {
            var encrypted = localStorage.keypair;
            var decrypted = this.backendCrypto.aesdecrypt(password, encrypted);
            try {
                var keypair = JSON.parse(decrypted);
                var key = new NodeRSA();
                key.loadFromPEM(keypair.publicKey);
                key.loadFromPEM(keypair.privateKey);
                return key;
            } catch (err) {
                return false;
            }
        }
    },
    
    
    /**
     * save key pair in local storage
     * @param (NodeRSA) key
     * @param (string) password
     */
    saveKey: function(key, password) {
        var keypair = {
            'publicKey': key.getPublicPEM(),
            'privateKey': key.getPrivatePEM()
        };
        var encrypted = this.backendCrypto.aesencrypt(password, JSON.stringify(keypair));
        localStorage.keypair = encrypted;
    }
    
    
}));
