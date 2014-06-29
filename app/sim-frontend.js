/**
 * the frontend of sum
 *
 * @copyright  Copyright (c) Tobias Zeising (http://www.aditu.de)
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
sim.frontend = {

    /**
     * counts unread messages for every room/person
     */
    unreadMessagesCounter: {},
    
    
    /**
     * id of current visible conversation
     */
    currentConversation: false,
    
    
    /**
     * window height before last resize event
     */
    lastWindowHeight: $(window).height(),
    
    
    /**
     * initialize frontend
     * @param backend (object) the current backend
     */
    init: function(backend) {    
       
        // initialize div inline scroller
        $("#contacts-wrapper, #rooms-wrapper, #content-wrapper").mCustomScrollbar({
            advanced:{
                updateOnContentResize: true,
            }
        });
        
        // load emoticons
        sim.frontend.initEmoticons();
		
		// initialize code highlighting
		sim.frontend.initHighlight();
		
        // initialize all events
        sim.frontend.events.init(backend);
        
        // initialize backend callbacks
        sim.frontend.initBackendCallbacks(backend);
        
        // Userliste und Rooms updaten
        backend.updateUserlist(sim.frontend.currentConversation);
        backend.updateRoomlist();
    },


    /**
     * set callbacks which will update the frontend on backend action (e.g. receiving a new message)
     * @param backend (object) the current backend
     */
    initBackendCallbacks: function(backend) {
        // register callback for errors
        backend.onError(function(error) {
            alertify.error(error);
        });
        
        // new room invite
        backend.onRoomInvite(function(room, user) {
            var text = user.escape() + ' hat dich in den Raum ' + room.escape() + ' eingeladen';
            alertify.log(text);
            backend.notification("group.png", text);
        });
        
        // user is now online
        backend.onUserOnlineNotice(function(avatar, text) {
            text = text.escape() + ' ist jetzt online';
            alertify.log(text);
            backend.notification(typeof avatar != "undefined" ? avatar : "favicon.png", text);
        });
        
        // register callback for a user goes offline
        backend.onUserOfflineNotice(function(avatar, text) {
            text = text.escape() + ' ist jetzt offline';
            alertify.log(text);
            backend.notification(typeof avatar != "undefined" ? avatar : "favicon.png", text);
        });
        
        // register callback for incoming new message
        backend.onNewMessage(function(message) {
            if (message.sender != backend.getUsername())
                backend.notification(backend.getAvatar(message.sender), "Neue Nachricht von " + message.sender.escape(), message.text);
            
            // conversation = sender
            var conversationId = message.sender;
            
            // conversation = receiver if it is a room
            if (backend.doesRoomExists(message.receiver))
                conversationId = message.receiver;
            
            if(sim.frontend.currentConversation == conversationId)
                backend.getConversation(sim.frontend.currentConversation);
            else {
                if (typeof sim.frontend.unreadMessagesCounter[conversationId] == "undefined") {
                    sim.frontend.unreadMessagesCounter[conversationId] = 0;
                }
                sim.frontend.unreadMessagesCounter[conversationId]++;
                backend.updateUserlist(sim.frontend.currentConversation);
                backend.updateRoomlist();
            }
        });
        
        // register callback for room list update
        backend.onGetRoomlistResponse(function(rooms, invitedRooms) {
            sim.frontend.updateRoomlist(rooms, invitedRooms);
        });
        
        // register callback for user list update
        backend.onGetUserlistResponse(function(users) {
            sim.frontend.updateUserlist(users);
        });
        
        // register callback for getting conversation
        backend.onGetContentResponse(function(id, messages) {
            if (id==sim.frontend.currentConversation)
                sim.frontend.updateConversation(messages, backend);
        });
        
        // backend has update for userlist
        backend.onHasUserlistUpdate(function() {
            backend.updateUserlist(sim.frontend.currentConversation);
        });
    },
    
    
    /**
     * load all available emoticons
     */
    initEmoticons: function() {
        var emotbox = $('#message-emoticons');
        var lastEmot = "";
        $.each(emoticons, function(shortcut, emoticon) {
            if(lastEmot != emoticon)
                emotbox.append('<img src="'+ emoticon +'" title="' + shortcut + '"/>');
            lastEmot = emoticon;
        });
    },
	
	
	 /**
     * initialize code highlighting
     */
    initHighlight: function() {
        hljs.configure({useBR: true});
    },
    
    
    /**
     * update current userlist
     * @param users (array) list of users for updating
     */
    updateUserlist: function(users) {
        // save scroll state
        var scrollPosition = $("#contacts-wrapper").scrollTop();
        
        // update userlist
        $('.contacts').html('');
        $.each(users, function(index, user) {
            // unread
            var unread = "";
            if (typeof sim.frontend.unreadMessagesCounter[user.username] != "undefined")
                unread = '<div class="contacts-unread">' + sim.frontend.unreadMessagesCounter[user.username] + '</div>';
            
            // avatar url
            var avatar = "avatar.png";
            if (typeof user.avatar != "undefined")
                avatar = user.avatar;
            
            // active
            var active = '';
            if(sim.frontend.currentConversation==user.username)
                active = 'class="active"';
            
            $('.contacts').append('<li ' + active + '>\
                <div class="online contacts-state"></div>\
                <img src="' + avatar + '" class="contacts-avatar avatar" />\
                <div class="contacts-name">' + user.username.escape() + '</div>\
                ' + unread + '\
            </li>');
        });
        
        // restore scroll state
        $("#contacts-wrapper").mCustomScrollbar("scrollTo", scrollPosition);
    },
    
    
    /**
     * update roomlist
     * @param rooms (array) list of rooms for updating
     */
    updateRoomlist: function(rooms) {
        // save scroll state
        var scrollPosition = $("#rooms-wrapper").scrollTop();
        
        // update roomlist
        $('.rooms').html('');
        var invited = [];
        $.each(rooms, function(index, room) {
            // state
            var state = 'rooms-outside';
            var edit = '';
            if(typeof room.invited == 'undefined' && room.name != config.room_all) {
                state = 'rooms-inside';
                edit = '<span class="rooms-invite ion-plus-round"></span> <span class="rooms-leave ion-log-out"></span>';
            } else if(room.name == config.room_all) {
                state = 'rooms-inside';
            } else {
                invited[invited.length] = room;
            }
            
            // unread
            var unread = "";
            if (typeof sim.frontend.unreadMessagesCounter[room.name] != "undefined")
                unread = '<div class="contacts-unread">' + sim.frontend.unreadMessagesCounter[room.name] + '</div>';

            // active
            var active = '';
            if(sim.frontend.currentConversation == room.name)
                active = 'class="active"';
                
            $('.rooms').append('<li ' + active + '>\
                <div class="' + state + '"></div> \
                <div class="rooms-name"><span class="name">' + room.name.escape() + '</span> ' + edit + ' </div>\
                ' + unread + '\
            </li>');
        });
        
        // remove all room invite popups on redraw
        $('.rooms-popup.invite').remove();
        
        // show invite dialog
        $.each(invited, function(index, room) {
            var div = $(sim.frontend.helpers.createRoomsPopup($('#rooms-add'), "invite"));
            div.append('<p>Einladung f&uuml;r den Raum ' + room.name + ' von ' + room.invited + ' annehmen?</p>');
            div.append('<input class="name" type="hidden" value="' + room.name.escape() + '" />');
            div.append('<input class="save" type="button" value="annehmen" /> <input class="cancel" type="button" value="ablehnen" />');
        });
        
        // restore scroll state
        $("#rooms-wrapper").mCustomScrollbar("scrollTo", scrollPosition);
    },
    
    
    /**
     * update current conversation
     * @param messages (array) list of all messages
     * @param backend (object) the current backend
     */
    updateConversation: function(messages, backend) {
        // set unreadcounter to 0
        var unread = sim.frontend.unreadMessagesCounter[sim.frontend.currentConversation];
        delete sim.frontend.unreadMessagesCounter[sim.frontend.currentConversation];
        backend.updateUserlist(sim.frontend.currentConversation);
        backend.updateRoomlist();
        
        // set metadata: avatar
        var avatar = 'group.png';
        if($('.contacts .active').length > 0)
            avatar = $('.contacts .active .avatar').attr('src');
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
        
        // write metadata
        $('#main-metadata').html(avatar + '<span>' + sim.frontend.currentConversation + '</span><span class="' + state + '"></span>');
        
        // show messages (highlite new messages)
        $('#content').html('');
        $.each(messages, function(index, message) {
            var messageText = message.text.escape();
            if (sim.frontend.helpers.hasCode(messageText)) {
                // hljs.configure({useBR: true});
                messageText = hljs.highlightAuto(messageText).value;
                // messageText = sim.frontend.helpers.setPreCodeBlock(messageText);
            } else {            
                messageText = sim.frontend.helpers.emoticons(messageText);
                messageText = sim.frontend.helpers.urlify(messageText);
            }
            $('#content').append('<li class="entry">\
                <div class="entry-metadata">\
                    <img src="' + backend.getAvatar(message.sender) + '" class="avatar" />\
                    <span>' + message.sender.escape() + '</span>\
                    <span class="entry-datetime">' + sim.frontend.helpers.dateAgo(message.datetime) + '</span>\
                </div>\
                <div class="entry-content">\
                    ' + messageText + '\
                </div>\
            </li>');
            
            // set time ago updater
            var dateTimeElement = $('#content .entry-datetime:last');
            sim.frontend.helpers.startDateAgoUpdater(message.datetime, dateTimeElement);
            
            // scroll 2 bottom
            if(index==messages.length-1) {
                window.setTimeout(function() { $("#content-wrapper").mCustomScrollbar("scrollTo","bottom"); }, 500);
            }
        });
        
    }
    
}