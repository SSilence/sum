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
        
        // register callback for incoming new message
        backend.onNewMessage(function(message) {
            backend.notification(backend.getAvatar(message.sender), "Neue Nachricht von " + sim.frontend.helpers.escape(message.sender), message.text);
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
        
        // menue
        $('#main-menue').click(function() {
            $('#main-menue-dropdown').toggle();
        });
        
        // menue: select avatar
        $('#main-menue-avatar').click(function(evt) {
            $('#fileDialog').change(function(evt) {
                $('#main-menue-dropdown li').hide();
                $('#main-menue-avatar-croper').show();
                
                var file = $(this).val();
                backend.helpers.readFile(file, function(data) {
                    var filetype = file.split('.').pop();
                    if (filetype != "png" && filetype != "jpg" && filetype != "gif") {
                        alertify.error("Bitte PNG, JPG oder GIF Datei w&auml;hlen");
                        $('#main-menue-avatar-croper .cancel').click();
                        return;
                    }
                    
                    $('#main-menue-avatar-croper img, .evroneCropCanvas').remove();
                    $('#main-menue-avatar-croper').prepend('<img />');
                    $('#main-menue-avatar-croper img').attr('src', 'data:image/' + filetype + ';base64,' + data.toString('base64'));
                    sim.frontend.helpers.resizeImage($('#main-menue-avatar-croper img'), 200, 200);
                    $('#main-menue-avatar-croper img').evroneCrop({
                      size: {w: 150, h: 150}, 
                      ratio: 1
                    });
                });
            });
            $('#fileDialog').trigger('click');
        });
        
        // menue: save avatar
        $('#main-menue-avatar-croper .save').click(function() {
            $('#main-menue-dropdown li').show();
            $('#main-menue-avatar-croper').hide();
            backend.saveAvatar($('#main-menue-avatar-croper img').data('evroneCrop'));
            $('#main-menue-dropdown').hide();
            backend.updateUserlist();
        });
        
        // menue: cancel avatar
        $('#main-menue-avatar-croper .cancel').click(function() {
            $('#main-menue-dropdown li').show();
            $('#main-menue-avatar-croper').hide();
            $('#main-menue-dropdown').hide();
        });
        
        
        // menue: about
        $('#main-menue-about').click(function() {
            gui.Shell.openExternal('https://github.com/SSilence/sum');
        });
        
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
                    <img src="' + backend.getAvatar(message.sender) + '" class="avatar" />\
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