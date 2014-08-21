if (typeof NodeRSA == 'undefined') NodeRSA = require('node-rsa');
if (typeof crypto == 'undefined') crypto = require('crypto');
if (typeof CryptoJS == 'undefined') CryptoJS = require('crypto-js');

/**
 * helpers for encryption and decryption
 *
 * @copyright  Copyright (c) Tobias Zeising (http://www.aditu.de)
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
define('sum-backend-crypto', Class.extend({

    /**
     * returns new RSA Key Pair
     * @return (NodeRSA) new RSA keypair
     */
    generateKeypair: function() {
        return new NodeRSA({b: 2048});
    },

    
    /**
     * returns sha256 hash
     * @return (string) sha256 hash
     * @param text (string) text to hash
     */
    sha256: function(text) {
        return require('crypto').createHash('sha256').update(config.sha256_salt + text).digest('hex');
    },
    
    
    /**
     * returns md5 hash
     * @return (string) md5 hash
     * @param text (string) text to hash
     */
    md5: function(text) {
        return require('crypto').createHash('md5').update(text).digest('hex');
    },
    

    /**
     * encrypt with AES
     * @return (string) clear text
     * @param cleardata (string) encryptdata cleartext to encrypt
     * @param password (string) password
     */
    aesencrypt: function(cleardata, password) {
        var CryptoJS = require('crypto-js');
        var iv = CryptoJS.enc.Hex.parse(config.iv);
        var secret = CryptoJS.AES.encrypt(cleardata, password, { iv: iv });
        return secret.toString();
    },
    
    
    /**
     * decrypt with AES
     * @return (string) decrypted text
     * @param encryptdata (string) encrypted data to decrypt
     * @param password (string) password
     */
    aesdecrypt: function(encryptdata, password) {
        var CryptoJS = require('crypto-js');
        var iv = CryptoJS.enc.Hex.parse(config.iv);
        return CryptoJS.AES.decrypt(encryptdata, password, { iv: iv }).toString(CryptoJS.enc.Utf8);
    },
    
 
    
    /**
     * encrypt with RSA
     * @return encrypted string
     * @param key (string) public key for encryption
     * @param data (mixed) data for encryption
     */
    rsaencrypt: function(key, data) {
        return key.encrypt(data, 'base64');
    },


    /**
     * decrypt with RSA
     * @return (string) decrypted string
     * @param key (string) public key for decryption
     * @param data (mixed) data for decryption
     */
    rsadecrypt: function(key, data) {
        return key.decrypt(data).toString();
    },


    /**
     * sign given data with given key
     * @returns (string) signature
     * @param key (object) private key
     * @param data (string) data for signing
     */
    sign: function(key, data) {
        var hash = this.sha256(data);
        return key.sign(hash, 'base64').toString();
    },


    /**
     * verify signature
     * @param key (object) key private
     * @param data (string) for verifying
     * @param signature (string) given signature
     * @returns true on success, false otherwise
     */
    verify: function(key, data, signature) {
        var hash = this.sha256(data);
        return key.verify(hash, signature, 'utf8', 'base64');
    },


    /**
     * sign given message
     * @return (object) signed message
     * @param message (object) unsigned message
     * @param key (object) key for signing
     */
    signMessage: function(message, key) {
        var sign = this.sign(key, this.messageToString(message));
        return $.extend(message, { signature: sign });
    },


    /**
     * verify messages signature
     * @param message given message
     * @param key given public key
     */
    verifyMessage: function(message, key) {
        return this.verify(key, this.messageToString(message), message.signature);
    },
    
    
    /**
     * converts a message object into one string
     * @return (string) message key values concated as string
     * @param (object) message
     */
    messageToString: function(message) {
        var messagestring = "";
        $.each(Object.keys(message).sort(), function(index, key) {
            if (key !== 'signature')
                messagestring = messagestring + key + message[key];
        });
        return messagestring;
    }
}));
