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
     * initialize frontend
     */
    init: function(backend) {    
        // initialize window resize handler
        $(window).bind("resize", sim.frontend.resize);
        sim.frontend.resize();
        
        // initialize div inline scroller
        $("#contacts-wrapper, #rooms-wrapper, #content-wrapper").mCustomScrollbar({
            advanced:{
                updateOnContentResize: true,
            }
        });
        
        // load emoticons
        sim.frontend.initEmoticons();
            
        // initialize all events
        sim.frontend.initEvents(backend);
        
        // initialize backend callbacks
        sim.frontend.initBackendCallbacks(backend);
        
        // Userliste und Rooms updaten
        backend.updateUserlist();
        backend.updateRoomlist();
    },


    /**
     * set callbacks which will update the frontend on backend action (e.g. receiving a new message)
     */
    initBackendCallbacks: function(backend) {
        // alertify about new user state
        var userOnlineOffline = function(text) {
            alertify.log(text);
            backend.notification("", text);
            backend.updateUserlist();
            
            // update messagelist for updating online/offline state
            backend.getConversation(sim.frontend.currentConversation);
        }
        
        // user is now online
        backend.onUserOnlineNotice(userOnlineOffline);
        
        // register callback for a user goes offline
        backend.onUserOfflineNotice(userOnlineOffline);
        
        // register callback for user changes his state
        backend.onUserUpdateNotice(function(id, text) {
            alertify.log("Status: " + id + " " + text);
            backend.updateUserlist();
        });
        
        // register callback for incoming new message
        backend.onNewMessage(function(message) {
            backend.notification("Neue Nachricht von " + sim.frontend.helpers.escape(message.sender), message.text);
            if(sim.frontend.currentConversation == message.sender)
                backend.getConversation(sim.frontend.currentConversation);
            else {
                if (typeof sim.frontend.unreadMessagesCounter[message.sender] == "undefined") {
                    sim.frontend.unreadMessagesCounter[message.sender] = 0;
                }
                sim.frontend.unreadMessagesCounter[message.sender]++;
                backend.updateUserlist();
                backend.updateRoomlist();
            }
        });
        
        // register callback for user enters room
        backend.onRoomEnterNotice(function(room, user) {
            alertify.log("Benutzer: " + user + " hat den Raum " + room + " betreten");
            backend.updateUserlist();
        });
        
        // register callback for user leaves room
        backend.onRoomLeaveNotice(function() {
            alertify.log("Benutzer: " + user + " hat den Raum " + room + " verlassen");
            backend.updateUserlist();
        });
        
        // register callback for new room was opened
        backend.onRoomOpened(function(room) {
            alertify.log("Neuer Raum " + room + " wurde eröffnet");
            backend.updateRoomlist();
        });
        
        // register callback for room list update
        backend.onGetRoomlistResponse(function(rooms) {
            sim.frontend.updateRoomlist(rooms);
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
     * initialize events (clicks, ...)
     */
    initEvents: function(backend) {
        // close
        $('#main-close').click(function() {
            backend.quit();
        });
        
        // toggle emoticons
        $('#message-toggleemots').click(function() {
            var emoticonsPopup = $('#message-emoticons');
            $(this).toggleClass('active');
            if($(this).hasClass('active')) {
                emoticonsPopup.css('marginTop', -1 * emoticonsPopup.height() - parseInt(emoticonsPopup.css('padding')));
                emoticonsPopup.show();
            } else  {
                emoticonsPopup.hide();
            }
        });
        
        // emoticons click
        $('#message-emoticons').delegate("img", "click", function() {
            $('#message-input-textfield').val(
                $('#message-input-textfield').val() + " " + $(this).attr('title')
            );
            $('#message-toggleemots').click();
        });
        
        // switch to user
        $('.contacts').delegate("li", "click", function() {
            var user = $(this).find('.contacts-name').html();
            $('.rooms li, .contacts li').removeClass('active');
            $(this).addClass('active');
            sim.frontend.currentConversation = user;
            backend.getConversation(user);
            $('#main-metadata').css('visibility', 'visible');
        });
        
        // enter room click
        $('.rooms').delegate("li .name", "click", function() {
            var room = $(this).parent().find('.name').html();
            $('.rooms li, .contacts li').removeClass('active');
            $(this).parent().parent().addClass('active');
            sim.frontend.currentConversation = room;
            backend.joinRoom(room);
            backend.updateRoomlist();
            backend.getConversation(sim.frontend.currentConversation);
            $('#main-metadata').css('visibility', 'visible');
        });
        
        // leave room click
        $('.rooms').delegate("li .rooms-leave", "click", function(e) {
            var room = $(this).parent().find('.name').html();
            backend.leaveRoom(room);
        });
        
        // send message
        $('#message-send').click(function() {
            var message = $('#message-input-textfield').val();
            if (message.trim().length==0) {
                alertify.error('bitte eine Nachricht eingeben');
                return;
            }
            
            if (sim.frontend.currentConversation==false) {
                alertify.error('bitte einen Chat Kanal ausw&auml;hlen');
                return;
            }
            $('#message-input-textfield').val("");
            backend.sendMessage(sim.frontend.currentConversation, message);
        });
    },
    
    
    
    // ui update helpers
    
    
    /**
     * update current userlist
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
            
            // online state
            var state = 'online';
            if(user.state.toLowerCase()=='not_available')
                state = 'offline';
            if(user.state.toLowerCase()=='busy')
                state = 'notavailable';
            
            // avatar url
            var avatar = sim.frontend.helpers.gravatarUrl(user.email);
            
            // active
            var active = '';
            if(sim.frontend.currentConversation==user.username)
                active = 'class="active"';
            
            $('.contacts').append('<li ' + active + '>\
                <div class="' + state + ' contacts-state"></div>\
                <img src="' + avatar + '" class="contacts-avatar avatar" />\
                <div class="contacts-name">' + sim.frontend.helpers.escape(user.username) + '</div>\
                ' + unread + '\
            </li>');
        });
        
        // restore scroll state
        $("#contacts-wrapper").mCustomScrollbar("scrollTo", scrollPosition);
    },
    
    
    /**
     * update roomlist
     */
    updateRoomlist: function(rooms) {
        // save scroll state
        var scrollPosition = $("#rooms-wrapper").scrollTop();
        
        // update roomlist
        $('.rooms').html('');
        $.each(rooms, function(index, room) {
            // state
            var state = 'rooms-outside';
            var leave = '';
            if($.inArray(room, rooms.usersrooms)) {
                state = 'rooms-inside';
                leave = '<span class="rooms-leave ion-log-out"></span>';
            }
            
            // unread
            var unread = "";
            if (typeof sim.frontend.unreadMessagesCounter[room] != "undefined")
                unread = '<div class="contacts-unread">' + sim.frontend.unreadMessagesCounter[room] + '</div>';

            // active
            var active = '';
            if(sim.frontend.currentConversation==room)
                active = 'class="active"';
                
            $('.rooms').append('<li ' + active + '>\
                <div class="' + state + '"></div> \
                <div class="rooms-name"><span class="name">' + sim.frontend.helpers.escape(room) + '</span> ' + leave + ' </div>\
                ' + unread + '\
            </li>');
        });
        
        // restore scroll state
        $("#rooms-wrapper").mCustomScrollbar("scrollTo", scrollPosition);
    },
    
    
    /**
     * update current conversation
     */
    updateConversation: function(messages, backend) {
        // set unreadcounter to 0
        var unread = sim.frontend.unreadMessagesCounter[sim.frontend.currentConversation];
        delete sim.frontend.unreadMessagesCounter[sim.frontend.currentConversation];
        backend.updateUserlist();
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
            $('#content').append('<li class="entry">\
                <div class="entry-metadata">\
                    <img src="' + sim.frontend.helpers.gravatarUrl(message.email) + '" class="avatar" />\
                    <span>' + sim.frontend.helpers.escape(message.sender) + '</span>\
                    <span class="entry-datetime">' + sim.frontend.helpers.dateAgo(message.datetime) + '</span>\
                </div>\
                <div class="entry-content">\
                    ' + sim.frontend.helpers.emoticons(sim.frontend.helpers.escape(message.text)) + '\
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
        
    },
    
        
    /**
     * set automatically the height of the tags and set scrollbar for div scrolling
     */
    resize: function() {
        var start = $('#contacts-wrapper').position().top;
        var windowHeight = $(window).height();
        var roomsHeight = $('#rooms').outerHeight();
        $('#contacts-wrapper').height(windowHeight - start - roomsHeight);
        $("#contacts-wrapper").mCustomScrollbar("update");
        $('#contacts-wrapper').show();
        
        var headerHeight = $('#main-header').outerHeight();
        var messageHeight = $('#message').outerHeight();
        var padding = parseInt($('#content').css('padding-bottom')) * 2;
        
        $('#content-wrapper').height(windowHeight - headerHeight - messageHeight - padding);
    }
}