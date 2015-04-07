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
     * @param avatar (string) base64 encoded avatar
     */
    saveAvatar: function(avatar) {
        localStorage.avatar = avatar;
    },
    
    
    /**
     * remove avatar from local storage
     */
    removeAvatar: function() {
        localStorage.removeItem('avatar');
    },


    /**
     * save given window size
     * @param width (int) current width
     * @param height (int) current height
     */
    saveWindowSize: function(width, height) {
        localStorage.width = width;
        localStorage.height = height;
    },


    /**
     * load window size
     * @return (object) {width: 123, height: 456}
     */
    loadWindowSize: function() {
        if (typeof localStorage.width != 'undefined' && localStorage.width !== null && typeof localStorage.height != 'undefined' && localStorage.height !== null)
            return { width: localStorage.width, height: localStorage.height};
        return false;
    },


    /**
     * save given window position
     * @param x (int) left
     * @param y (int) top
     */
    saveWindowPosition: function(x, y) {
        localStorage.x = x;
        localStorage.y = y;
    },


    /**
     * load saved room size
     * @returns (int|boolean) size or false
     */
    loadRoomHeight: function() {
        if (typeof localStorage.roomheight != 'undefined' && localStorage.roomheight !== null)
            return localStorage.roomheight;
        return false;
    },


    /**
     * save height of rooms
     * @param height new height
     */
    saveRoomHeight: function(height) {
        localStorage.roomheight = height;
    },


    /**
     * load saved contacts size
     * @returns (int|boolean) size or false
     */
    loadContactsWidth: function() {
        if (typeof localStorage.contactswidth != 'undefined' && localStorage.contactswidth !== null)
            return localStorage.contactswidth;
        return false;
    },


    /**
     * save size of contacts
     * @param width new width
     */
    saveContactsWidth: function(width) {
        localStorage.contactswidth = width;
    },


    /**
     * load window position
     * @return (object) {x: 123, y: 456}
     */
    loadWindowPosition: function() {
        if (typeof localStorage.x != 'undefined' && localStorage.x !== null && typeof localStorage.y != 'undefined' && localStorage.y !== null)
            return { x: localStorage.x, y: localStorage.y};
        return false;
    },


    /**
     * save given roomlist
     * @param roomlist (Array) current rooms user is in
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
     * load stored key pair without encrypting it
     * @return (string) encrypted keys
     */
    loadKeyEncrypted: function() {
        return localStorage.keypair;
    },
    
    
    /**
     * load stored key pair
     * @return (NodeRSA|boolean) loaded key pair or false on decryption/parse error
     * @param password (string) keys password
     */
    loadKey: function(password) {
        if (typeof localStorage.keypair != 'undefined') {
            try {
                var encrypted = localStorage.keypair;
                var decrypted = this.backendCrypto.aesdecrypt(encrypted, password);
                var keypair = JSON.parse(decrypted);
                var key = new NodeRSA();
                key.loadFromPEM(keypair.publicKey);
                key.loadFromPEM(keypair.privateKey);
                return key;
            } catch (err) {
                return false;
            }
        }
        return false;
    },
    
    
    /**
     * save key pair in local storage
     * @param key (NodeRSA) key
     * @param password (string) password
     */
    saveKey: function(key, password) {
        var keypair = {
            'publicKey': key.getPublicPEM(),
            'privateKey': key.getPrivatePEM()
        };
        localStorage.keypair = this.backendCrypto.aesencrypt(JSON.stringify(keypair), password);
    },
    
    
    /**
     * purge key pair
     */
    resetKey: function() {
        localStorage.removeItem('keypair');
    },
    
    
    /**
     * purge public keys
     */
    resetPublicKeys: function() {
        localStorage.removeItem('publickeys');
    },
    
    
    /**
     * loads all public keys of other users
     * @return (array) of objects with username, key property
     */
    loadPublicKeys: function() {
        if(typeof localStorage.publickeys !== 'undefined') {
            try {
                return JSON.parse(localStorage.publickeys);
            } catch(err) {
                return false;
            }
        }
        return false;
    },
    
    
    /**
     * save all public keys of other users
     * @param keys (array) of username: key objects
     */
    savePublicKeys: function(keys) {
        localStorage.publickeys = JSON.stringify(keys);
    }
    
}));
