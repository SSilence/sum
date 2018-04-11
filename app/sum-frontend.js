/**
 * the frontend of sum
 *
 * @copyright  Copyright (c) Tobias Zeising (http://www.aditu.de)
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
define('sum-frontend', Class.extend({

    /**
     * frontends helpers
     */
    frontendHelpers: injected('sum-frontend-helpers'),


    /**
     * frontends events
     */
    frontendEvents: injected('sum-frontend-events'),


    /**
     * frontends messages
     */
    frontendMessages: injected('sum-frontend-messages'),


    /**
     *  the current backend
     */
    backend: injected('sum-backend'),


    /**
     * counts unread messages for every room/person
     */
    unreadMessagesCounter: {},


    /**
     * id of current visible conversation (on app startup user is in room all)
     */
    currentConversation: false,


    /**
     * show all items of a conversation or only the last 20
     */
    showAll: false,


    /**
     * initialize frontend
     */
    initialize: function() {
        // hide/show login
        if (this.backend.showLogin() === false)
            $('body').addClass('loggedin');
        
        // set version
        $('title').html($('title').html() + ' ' + this.backend.version);
        $('.version').html(this.backend.version);
        
        // set currentConversation
        this.currentConversation = config.room_all;

        // initialize div inline scroller
        $("#contacts-wrapper, #rooms-wrapper, #content-wrapper, #open-conversations-menue-dropdown").mCustomScrollbar({
            advanced:{
                updateOnContentResize: true
            },
            scrollInertia: 0,
            mouseWheel: {
                scrollAmount: 200
            },
            callbacks: {
                whileScrolling: function() {
                    $(this).data('scrollTop', -this.mcs.top);
                }
            }
        });

        // load emoticons
        this.initEmoticons();

        // initialize language-selection for syntax-highlighting
        this.initSelectForCodeBoxLanguage();

        // initialize all events
        this.frontendEvents.initialize();

        // initialize backend callbacks
        this.initBackendCallbacks();

        // update userlist and rooms
        this.backend.updateUserlist(this.currentConversation);
        this.backend.updateRoomlist();
        this.backend.updateOpenConversationList();
        this.backend.getConversation(this.currentConversation);
        
        // update public keys
        this.updatePublicKeyList(this.backend.getPublicKeys());
        
        // initialize timer for unread messages
        this.initNotificationReminder();
    },


    /**
     * set callbacks which will update the frontend on backend action (e.g. receiving a new message)
     */
    initBackendCallbacks: function() {
        var that = this;

        // register callback for errors
        this.backend.onError(function(error) {
            alertify.error(error);
        });

        // new room invite
        this.backend.onRoomInvite(function(room, user) {
            var text = lang.frontend_room_invite.replace(/\%s1/, user.escape()).replace(/\%s2/, room.escape());
            alertify.log(text);
            that.backend.notification("group.png", text, '');
        });

        // user is now online
        this.backend.onUserOnlineNotice(function(avatar, text) {
            text = lang.frontend_online.replace(/\%s/, text.escape());
            alertify.log(text);
            that.backend.notification(typeof avatar != "undefined" ? avatar : "avatar.png", text);
        });

        // register callback for a user goes offline
        this.backend.onUserOfflineNotice(function(avatar, text) {
            text = lang.frontend_offline.replace(/\%s/, text.escape());
            alertify.log(text);
            that.backend.notification(typeof avatar != "undefined" ? avatar : "avatar.png", text);
        });

        // register callback for a user has been removed
        this.backend.onUserRemovedNotice(function(avatar, text) {
            text = lang.frontend_leave.replace(/\%s/, text.escape());
            alertify.log(text);
            that.backend.notification(typeof avatar != "undefined" ? avatar : "avatar.png", text);
        });

        // register callback for incoming new message
        this.backend.onNewMessage(function(message) {
            // conversation = sender
            var conversationId = message.sender;

            // conversation = receiver if it is a room
            if (that.backend.doesRoomExists(message.receiver))
                conversationId = message.receiver;

            // show system tray notification
            that.backend.notification(that.backend.getAvatar(message.sender), lang.frontend_new_message + message.sender.escape(), message.text, conversationId);

            // update stream if conversation is currently visible and window is focused
            if (that.currentConversation == conversationId && that.backend.isFocused() === true) {
                that.backend.getConversation(that.currentConversation);

            // otherwise update unread messages counter
            } else {
                if (typeof that.unreadMessagesCounter[conversationId] == "undefined") {
                    that.unreadMessagesCounter[conversationId] = 0;
                }
                that.unreadMessagesCounter[conversationId]++;
                var unread = that.frontendHelpers.countAllUnreadMessages(that.unreadMessagesCounter);
                that.backend.setBadge(unread);
                that.backend.updateUserlist(that.currentConversation);
                that.backend.updateRoomlist();
                that.backend.getConversation(that.currentConversation);
            }

            // always update users messages
            that.backend.updateOpenConversationList();
        });

        // register callback for room list update
        this.backend.onGetRoomlistResponse(function(rooms) {
            that.updateRoomlist(rooms);
        });

        // register callback for user list update
        this.backend.onGetUserlistResponse(function(users) {
            that.updateUserlist(users);
        });

        // register callback for user list update
        this.backend.onGetOpenConversationList(function(all) {
            that.updateOpenConversationList(all);
        });

        // register callback for getting conversation
        this.backend.onGetContentResponse(function(id, messages) {
            if (id==that.currentConversation)
                that.updateConversation(messages);
        });

        // backend has update for userlist
        this.backend.onHasUserlistUpdate(function() {
            that.backend.updateUserlist(that.currentConversation);
            that.backend.updateOpenConversationList();
            that.updateConversationState();
        });
        
        // backend has removed an user
        this.backend.onUserIsRemoved(function(user) {
            // check if the currentConversation is the Conversation with the removed user...
            if  (that.currentConversation == user.username) {
                // ...if so, switch conversation to "room_all"
                that.currentConversation = config.room_all;
                that.backend.getConversation(that.currentConversation);
                that.backend.updateUserlist(that.currentConversation);
            }
        });
        
        // switchConversation to user or room
        this.backend.onSwitchConversation(function(conversationName) {
            if  (that.currentConversation != conversationName) {
                that.currentConversation = conversationName;
                that.backend.getConversation(that.currentConversation);
                that.backend.updateUserlist(that.currentConversation);
            }
        });
        
        // rerender changed messages
        this.backend.onRerenderMessage(function(message) {
            var ele = $('#' + message.id);
            if (ele.length === 0)
                return;
            
            // rerender single message
            ele.replaceWith(that.frontendMessages.renderMessage(message));
        });
        
        // window will be focused: reset unread counter for current stream
        this.backend.onFocus(function() {
            delete that.unreadMessagesCounter[that.currentConversation];
            that.backend.updateUserlist(that.currentConversation);
            that.backend.updateRoomlist();
            that.backend.updateOpenConversationList();
            that.backend.getConversation(that.currentConversation);

            // show open conversations on unread messages
            if (that.frontendHelpers.countAllUnreadMessages(that.unreadMessagesCounter) > 0) {
                $('#open-conversations-menue-dropdown').show();
            }
        });
    },


    /**
     * load all available emoticons
     */
    initEmoticons: function() {
        var emotbox = $('#message-emoticons');
        var lastEmot = "";

        var groups = Object.keys(emoticons);
        var html = "";

        // render emoticons
        $.each(groups, function(index, group) {
            html = html + '<div id="emoticons-' + group + '" class="emoticons-content">';

            $.each(emoticons[group], function(shortcut, emoticon) {
                if(lastEmot != emoticon)
                    html = html + '<img class="emoticons" src="'+ emoticon +'" title="' + shortcut + '"/>';
                lastEmot = emoticon;
            });

            html = html + '</div>';
        });

        // render tabs
        html = html + '<ul class="emoticons-tabs">';
        $.each(groups, function(index, group) {
            html = html + '<li id="' + group + '" class="emoticons-tab">' + lang['frontend_emoticons_' + group] + '</li>';
        });
        html = html + '</ul>';

        emotbox.html(html);

        // initial show basic emoticons
        $('#basic').addClass('active');
        $('#emoticons-basic').show();
    },


    /**
     * create a select input for code box language
     */
    initSelectForCodeBoxLanguage: function() {
        var select = $('#message-add-code-box-language');

        $.each(config, function(key, value) {
            if (key.indexOf('highlight_languages_') !== 0)
                return true;
            var option = document.createElement("option");
            option.setAttribute('value', key.replace(/highlight_languages_/, ''));
            option.innerHTML = value;
            select.append(option);
        });

        $(select).selectize({
            create: true
        });
    },

    
    /**
     * starts timer for reminder which opens in fix intervall a notification if a unread message is available
     */
    initNotificationReminder: function() {
        var that = this;
        setTimeout(function() {
            var unread = that.frontendHelpers.countAllUnreadMessages(that.unreadMessagesCounter);
            if(unread>0)
                that.backend.notification('', lang.frontend_notifications_reminder.replace(/\%s/, unread), '');
            that.initNotificationReminder();
        }, config.notification_reminder);
    },
    
    
    /**
     * updates list of public keys
     * @param publicKeys (array) public keys
     */
    updatePublicKeyList: function(publicKeys) {
        var el = $('#key-menue-keys');
        el.find('option').remove();
        $.each(publicKeys, function(index, publicKey) {
            el.append('<option value="' + publicKey.username.escape() + '">' + publicKey.username.escape() + '</option>');
        });
    },


    /**
     * update current userlist
     * @param users (array) list of users for updating
     */
    updateUserlist: function(users) {
        // update badge
        var unread = this.frontendHelpers.countAllUnreadMessages(this.unreadMessagesCounter);
        this.backend.setBadge(unread > 0 ? unread : "");
        
        // save scroll state
        var contactsWrapper = $("#contacts-wrapper");
        var scrollPosition = typeof contactsWrapper.data('scrollTop') != 'undefined' ? contactsWrapper.data('scrollTop') : 0;

        // update userlist
        var html = '';
        var that = this;
        $.each(users, function(index, user) {
            html = html + that.renderUser(user);
        });
        $('.contacts').html(html);

        // restore scroll state
        contactsWrapper.mCustomScrollbar("scrollTo", scrollPosition);
    },


    /**
     * update open messages list
     */
    updateOpenConversationList: function(all) {
        // update small badge
        var unread = this.frontendHelpers.countAllUnreadMessages(this.unreadMessagesCounter);
        var unreadElement = $('#open-conversations-menue .unread');
        if (unread === 0) {
            unreadElement.hide();
        } else {
            unreadElement.html(unread);
            unreadElement.show();
        }

        var html = '';
        var that = this;
        $.each(all, function(index, entry) {
            if (typeof entry.username != 'undefined') {
                html = html + that.renderUser(entry);
            } else {
                html = html + that.renderRoom(entry);
            }
        });

        if (all.length === 0) {
            html = '<li class="empty">' + lang.menue_usermessages + '</li>';
        }

        $('#open-conversations-menue-dropdown .openconversations').html(html);
    },
    
    
    /**
     * renders a single user entry in contact list
     * @param user (object) single user
     * @return html user in contact list
     */
    renderUser: function(user) {
        // unread
        var unread = "";
        if (typeof this.unreadMessagesCounter[user.username] != "undefined")
            unread = '<div class="contacts-unread">' + this.unreadMessagesCounter[user.username] + '</div>';

        // avatar url
        var avatar = (typeof user.avatar != "undefined") ? user.avatar : "avatar.png";

        // active
        var active = (this.currentConversation==user.username) ? 'active' : '';

        // invalid key?
        var invalidkey = '';
        if (typeof user.invalidkey !== 'undefined' && user.invalidkey)
            invalidkey = ' <div class="contacts-invalidkey ion-key"></div>';
        else if (typeof user.invalidkey !== 'undefined' && user.invalidkey === false)
            invalidkey = ' <div class="contacts-validkey ion-key"></div>';
            
        // add new entry
        return '<li class="contact ' + active + '">' +
            '<div class="' + user.status + ' contacts-state" ' +
            'title="' + (typeof user.version != 'undefined' ? user.version : '') + '"></div>' +
            '<img src="' + avatar + '" class="contacts-avatar avatar" />' +
            invalidkey +
            '<div class="contacts-name">' + user.username.escape() + '</div>' + unread + '</li>';
    },


    /**
     * update roomlist
     * @param rooms (array) list of rooms for updating
     */
    updateRoomlist: function(rooms) {
        // update badge
        var unread = this.frontendHelpers.countAllUnreadMessages(this.unreadMessagesCounter);
        this.backend.setBadge(unread > 0 ? unread : "");
        
        // save scroll state
        var roomsWrapper = $("#rooms-wrapper");
        var scrollPosition = typeof roomsWrapper.data('scrollTop') != 'undefined' ? roomsWrapper.data('scrollTop') : 0;

        // update roomlist
        $('.rooms').html('');
        var that = this;
        $.each(rooms, function(index, room) {
            $('.rooms').append(that.renderRoom(room));
        });

        // remove all room invite popups on redraw
        $('.rooms-popup.invite').remove();

        // show invite dialog
        $.each(rooms, function(index, room) {
            if(typeof room.invited !== 'undefined') {
                var div = $(that.frontendHelpers.createRoomsPopup($('#rooms-add'), "invite"));
                div.append('<p>' + lang.frontend_invitation.replace(/\%s1/, room.name.escape()).replace(/\%s2/, room.invited.escape()) + '</p>');
                div.append('<input class="name" type="hidden" value="' + room.name.escape() + '" />');
                div.append('<input class="save" type="button" value="' + lang.frontend_invitation_accept + '" /> <input class="cancel" type="button" value="' + lang.frontend_invitation_decline + '" />');
            }
        });

        // restore scroll state
        roomsWrapper.mCustomScrollbar("scrollTo", scrollPosition);
    },


    /**
     * Renders a given room as html.
     * @param room object
     */
    renderRoom: function(room) {
        // state
        var state = 'rooms-outside';
        var edit = '';
        if(typeof room.invited == 'undefined' && room.name != config.room_all) {
            state = 'rooms-inside';
            edit = '<span class="rooms-invite ion-plus-round"></span> <span class="rooms-leave ion-log-out"></span>';
        } else if(room.name == config.room_all) {
            state = 'rooms-inside';
        }

        // unread
        var unread = "";
        if (typeof this.unreadMessagesCounter[room.name] != "undefined")
            unread = '<div class="contacts-unread">' + this.unreadMessagesCounter[room.name] + '</div>';

        // active
        var active = '';
        if(this.currentConversation == room.name)
            active = 'active';

        return '<li class="room ' + active + '">\
                <div class="' + state + '"></div> \
                <div class="rooms-name"><span class="name">' + room.name.escape() + '</span> ' + edit + ' </div>\
                ' + unread + '\
            </li>';
    },


    /**
     * update current conversation
     * @param messages (array) list of all messages
     */
    updateConversation: function(messages) {
        this.updateConversationHeader();
        
        // show messages
        var that = this;
        var html = '';

        // show more link
        var startIndex = 0;
        if (this.showAll === false && messages.length > config.conversation_items) {
            html += '<div class="show-all">' + lang.frontend_messages_show_all.replace(/\%d/, messages.length) + '</div>';
            startIndex = messages.length - config.conversation_items;
        }

        // render messages
        for(var i = startIndex; i < messages.length; i++)
            html += that.frontendMessages.renderMessage(messages[i]);

        // add (new) messages
        $('#content').html(html);

        // scroll 2 bottom
        $("#content").waitForImages(function() {
            $("#content-wrapper").mCustomScrollbar("scrollTo","bottom");
        });

        // hyphenator and code numbering
        this.frontendHelpers.numberCode($('#content'));
    },


    /**
     * update current updateConversationHeader
     */
    updateConversationHeader: function(){
        // set metadata: avatar
        var avatar = 'group.png';
        var roomClass = "isroom";
        if($('.contacts .active').length > 0) {
            avatar = $('.contacts .active .avatar').attr('src');
            roomClass = "";
        }
        avatar = '<img src="' + avatar + '" class="avatar" />';

        // set metadata: state
        var state = 'online';
        var stateElement = $('.active > div:first');
        if(stateElement.length > 0) {
            if(stateElement.hasClass('offline')) {
                state = 'offline';
            } else if(stateElement.hasClass('notavailable')) {
                state = 'notavailable';
            }
        }
        
        var invalidkey = '';
        if ($('.contacts .active .contacts-invalidkey').length > 0)
            invalidkey = '<span class="invalidkey">' + lang.frontend_invalid_key + '</span>';

        // write metadata
        $('#main-metadata').html(avatar + '<span>' + this.currentConversation.escape() + '</span><span id="conversationState" class="' + roomClass + " " + state + '"></span>' + invalidkey);
    },


    /**
     * update current conversationStatus
     */
    updateConversationState: function () {
        // set metadata: state
        var state = 'online';
        var stateElement = $('.active > div:first');
        if(stateElement.length > 0) {
            if(stateElement.hasClass('offline')) {
                state = 'offline';
            } else if(stateElement.hasClass('notavailable')) {
                state = 'notavailable';
            }
        }

        $('#conversationState').removeClass('online');
        $('#conversationState').removeClass('offline');
        $('#conversationState').removeClass('notavailable');
        $('#conversationState').addClass(state);
    }
}));
