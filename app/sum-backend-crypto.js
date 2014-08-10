if (typeof NodeRSA == 'undefined') NodeRSA = require('node-rsa');
if (typeof crypto == 'undefined') crypto = require('crypto');

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
     * @param (string) text to hash
     */
    sha256: function(text) {
        return require('crypto').createHash('sha256').update(config.sha256_salt + text).digest('hex');
    },
    
    
    /**
     * returns md5 hash
     * @return (string) md5 hash
     * @param (string) text to hash
     */
    md5: function(text) {
        return require('crypto').createHash('md5').update(text).digest('hex');
    },
    

    /**
     * decrypt with AES
     * @return (string) decrypted text
     * @param (string) cryptkey password
     * @param (string) encryptdata encrypted data to decrypt
     */
    aesdecrypt: function(cryptkey, encryptdata) {
        cryptkey = require('crypto').createHash('sha256').update(cryptkey).digest();
        encryptdata = new Buffer(encryptdata, 'base64').toString('binary');
        var decipher = require('crypto').createDecipheriv('aes-256-cbc', cryptkey, config.iv);
        var decoded = decipher.update(encryptdata, 'binary', 'utf8');
        decoded += decipher.final('utf8');
        return decoded;
    },
 
 
    /**
     * encrypt with AES
     * @return (string) clear text
     * @param (string) cryptkey password
     * @param (string) encryptdata cleartext to encrypt
     */
    aesencrypt: function(cryptkey, cleardata, iv) {
        cryptkey = require('crypto').createHash('sha256').update(cryptkey).digest();
        var encipher = require('crypto').createCipheriv('aes-256-cbc', cryptkey, config.iv);
        var encryptdata = encipher.update(cleardata, 'utf8', 'binary');
        encryptdata += encipher.final('binary');
        encode_encryptdata = new Buffer(encryptdata, 'binary').toString('base64');
        return encode_encryptdata;
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
     * @param (string) key public key for decryption
     * @param (mixed) data for decryption
     */
    rsadecrypt: function(key, data) {
        return key.decrypt(data).toString();
    },


    /**
     * sign given data with given key
     * @returns (string) signature
     * @param (object) key private key
     * @param (string) data for signing
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
     * @param (object) message unsigned
     * @param (object) key for signing
     */
    signMessage: function(message, key) {
        var sign = this.sign(key, JSON.stringify(message));
        return $.extend(message, { signature: sign });
    },


    /**
     * verify messages signature
     * @param message given message
     * @param key given public key
     */
    verifyMessage: function(message, key) {
        if (typeof message.signature !== 'string')
            return false;

        var messageWithoutSign = $.extend({}, message);
        delete messageWithoutSign.signature;
        return this.verify(key, JSON.stringify(messageWithoutSign), message.signature);
    }
}));
