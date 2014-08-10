/**
 * helpers for local storage access
 *
 * @copyright  Copyright (c) Tobias Zeising (http://www.aditu.de)
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
define('sum-backend-storage', Class.extend({

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
        window.localStorage.avatar = avatar;
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
    }
}));
