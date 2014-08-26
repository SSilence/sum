/**
 * registers events (mostly click events) for the frontend
 *
 * @copyright  Copyright (c) Tobias Zeising (http://www.aditu.de)
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
define('sum-frontend-events', Class.extend({

    /**
     * the current backend
     */
    backend: injected('sum-backend'),


    /**
     * backends command handler
     */
    frontendCommand: injected('sum-frontend-command'),


    /**
     * the current frontend
     */
    frontend: injected('sum-frontend'),


    /**
     * the current frontend helpers
     */
    frontendHelpers: injected('sum-frontend-helpers'),


    /**
     * the jcrop selection
     */
    selection: false,

    
    /**
     * input history
     */
    history: [],
    
    
    /**
     * cursor in history
     */
    historyCursor: 0,
    
    
    /**
     * window height before last resize event
     */
    lastWindowHeight: $(window).height(),
    
    
    /**
     * initialize events (clicks, ...)
     */
    initialize: function() {
        this.initGeneral();
        this.initMenue();
        this.initKeyMenue();
        this.initMessages();
        this.initMessageMenue();
        this.initMessageInput();
        this.initNavigation();
    },
    
    
    /**
     * initialize general events
     */
    initGeneral: function() {
        var that = this;

        // initialize window resize handler
        $(window).bind("resize", function() {
            that.resize();
        });
        this.resize();

        // open external links in new window
        $('body').delegate("a.extern", "click", function(e) {
            that.backend.openUrl($(this).attr('href'));
            e.preventDefault();
            return false;
        });

        // close menues when clicking somewhere
        $('body').click(function(event) {
            // no click inside main menue: close it
            if ($(event.target).parents('#main-menue-dropdown').length===0 && event.target.id != 'main-menue') {
                $('#main-menue-dropdown li').show();
                $('#main-menue-avatar-croper, #main-menue-dropdown').hide();
            }
            
            // no click inside key menue: close it
            if ($(event.target).parents('#key-menue-dropdown').length===0 && event.target.id != 'key-menue') {
                $('#key-menue-dropdown').hide();
            }

            // no click inside add menue: close it
            if ($(event.target).parents('#message-add-menue-dropdown').length===0 && event.target.id != 'message-add-menue')
                $('#message-add-menue-dropdown').hide();

            // no click inside add code box: close it
            if ($(event.target).parents('#message-add-code-box, #message-add-menue-dropdown').length===0 && event.target.id != 'message-add-menue') {
                $('#message-add-code-box').hide();
                $('#message-add-code-box-area').val('');
            }
        });

        // update version
        $('#newversion').click(function() {
            gui.Shell.openExternal($(this).data('url'));
        });
    },
    
    
    /**
     * initialize top menue events
     */
    initMenue: function() {
        var that = this;
    
        // menue: toggle
        $('#main-menue').click(function() {
            $('#main-menue-dropdown').toggle();
        });
        
        // menue: select avatar
        $('#main-menue-avatar').click(function() {
            that.selectAvatar();
        });
        
        // menue: removeAvatar avatar
        $('#main-menue-remove-avatar').click(function() {
            that.backend.removeAvatar();
            alertify.log(lang.frontend_events_avatar_removed);
            $('#main-menue-dropdown').toggle();
        });

        // menue: save avatar
        $('#main-menue-avatar-croper .save').click(function() {
            if (that.selection===false) {
                alertify.error(lang.frontend_events_save_avatar_no_selection);
                return;
            }
            $('#main-menue-dropdown li').show();
            $('#main-menue-avatar-croper').hide();

            var image = that.frontendHelpers.cropAndResize(
                $('#main-menue-avatar-croper img')[0],
                that.selection.x,
                that.selection.y,
                that.selection.w,
                that.selection.h);

            that.backend.saveAvatar(image);
            $('#main-menue-dropdown').hide();
            that.backend.updateUserlist(that.frontend.currentConversation);
        });

        // menue: cancel avatar
        $('#main-menue-avatar-croper .cancel').click(function() {
            $('#main-menue-dropdown li').show();
            $('#main-menue-avatar-croper').hide();
            $('#main-menue-dropdown').hide();
        });

        // menue: notification status
        $('#main-menue-status').click(function() {
            if($(this).hasClass('inactive')) {
                $(this).removeClass('inactive');
                that.backend.notifications(true);
            } else {
                $(this).addClass('inactive');
                that.backend.notifications(false);
            }
            $('#main-menue-dropdown').hide();
        });

        // menue: about
        $('#main-menue-quit').click(function() {
            that.backend.quit();
        });

        // menue: about
        $('#main-menue-about').click(function() {
            gui.Shell.openExternal(config.about_url);
            $('#main-menue-dropdown').hide();
        });

        // menue: quit
        $('#main-close').click(function() {
            that.backend.close();
        });
    },
    
    
    /**
     * initialize key menue
     */
    initKeyMenue: function() {
        var that = this;
        
        var showMenue = function() {
            $('#key-menue-dropdown li').hide();
            if(that.backend.showLogin()===false) {
                $('#key-menue-enable').show();
            } else {
                $('#key-menue-dropdown .menue').show();
            }
        };
        
        var hideMenue = function() {
            $('#key-menue-dropdown .menue').hide();
        };
        
        var validateNewPasswords = function(newPassword, newPasswordAgain) {
            // passwords given
            if($.trim(newPassword).length === 0 || $.trim(newPasswordAgain).length === 0) {
                alertify.error(lang.frontend_events_validate_passwords_missing_field);
                return false;
            }
            
            // new passwords equals?
            if(newPassword !== newPasswordAgain) {
                alertify.error(lang.frontend_events_validate_passwords_not_equal_passwords);
                return false;
            }
            return true;
        };

        // cancel button (all = back to menue)
        $('#key-menue-dropdown .cancel').click(function() {
            showMenue();
        });
    
        // key menue: toggle
        $('#key-menue').click(function() {
            showMenue();
            $('#key-menue-dropdown').toggle();
        });
        
        // show enable key management password input
        $('#key-menue-enable .save').click(function() {
            $('#key-menue-enable').hide();
            $('#key-menue-enable-container').show();
        });
        
        // show password input for private key
        $('#key-menue-password').click(function() {
            hideMenue();
            $('#key-menue-password-container').show();
        });
        
        // show manage keys
        $('#key-menue-manage').click(function() {
            hideMenue();
            $('#key-menue-manage-container').show();
        });
        
        // show reset password
        $('#key-menue-reset').click(function() {
            hideMenue();
            $('#key-menue-reset-container').show();
        });
        
        // show share
        $('#key-menue-share').click(function() {
            hideMenue();
            $('#key-menue-share-container').show();
        });
        
        // show export
        $('#key-menue-export').click(function() {
            hideMenue();
            $('#key-menue-export-container').show();
        });
        
        // show import
        $('#key-menue-import').click(function() {
            hideMenue();
            $('#key-menue-import-container').show();
        });
        
        // show disable
        $('#key-menue-disable').click(function() {
            hideMenue();
            $('#key-menue-disable-container').show();
        });
        
        // enable key management: save
        $('#key-menue-enable-container .save').click(function() {
            // validate passwords
            var newPassword = $('#key-menue-enable-container .password').val();
            var newPasswordAgain = $('#key-menue-enable-container .password-again').val();
            if (validateNewPasswords(newPassword, newPasswordAgain) === false)
                return;
                
            // save key
            that.backend.saveKey(newPassword);
            
            alertify.log(lang.frontend_events_key_mangement_activated);
            showMenue();
        });
        
        // manage keys: add new key
        $('#key-menue-manage-container .save').click(function() {
            var fileInput = $('<input type="file" />');
            fileInput.change(function() {
                // check file given?
                if ($(this).val() === '')
                    return;

                // save key
                that.backend.addPublicKey($(this).val(), function() {
                    // update public keys
                    that.frontend.updatePublicKeyList(that.backend.getPublicKeys());
                });
            });
            fileInput.trigger('click');
        });
        
        // manage keys: remove key
        $('#key-menue-manage-container .remove').click(function() {
            if ($('#key-menue-keys').val() === '' || $('#key-menue-keys').val() === null)
                return alertify.error(lang.frontend_events_no_user_selected);
            
            // remove key
            $.each($('#key-menue-keys').val(), function(index, item) {
                that.backend.removePublicKey(item);
            });
            
            // update public keys
            that.frontend.updatePublicKeyList(that.backend.getPublicKeys());
        });
        
        // change password: save
        $('#key-menue-password-container .save').click(function() {
            // validate passwords
            var oldPassword = $('#key-menue-password-container .old-password').val();
            var newPassword = $('#key-menue-password-container .new-password').val();
            var newPasswordAgain = $('#key-menue-password-container .new-password-again').val();
            
            // passwords given
            if($.trim(oldPassword).length === 0)
                return alertify.error(lang.frontend_events_validate_passwords_missing_field);
            
            // old password correct?
            if(that.backend.checkKeyPassword(oldPassword) !== true)
                return alertify.error(lang.frontend_events_invalid_old_password);
            
            // validate new passwords
            if (validateNewPasswords(newPassword, newPasswordAgain) === false)
                return;
                
            // change password
            $('#key-menue-password-container .old-password').val('');
            $('#key-menue-password-container .new-password').val('');
            $('#key-menue-password-container .new-password-again').val('');
            that.backend.saveKey(newPassword);
            
            showMenue();
            alertify.log(lang.frontend_events_password_changed);
            $('#key-menue-dropdown').toggle();
        });
        
        // reset key
        $('#key-menue-reset-container .save').click(function() {
            // validate new passwords
            var newPassword = $('#key-menue-reset-container .new-password').val();
            var newPasswordAgain = $('#key-menue-reset-container .new-password-again').val();
            if (validateNewPasswords(newPassword, newPasswordAgain) === false)
                return;
                
            // reset key
            $('#key-menue-reset-container .new-password').val('');
            $('#key-menue-reset-container .new-password-again').val('');
            that.backend.resetKey(newPassword);
            
            // show success
            alertify.log(lang.frontend_events_key_reset_success);
            $('#key-menue-dropdown').toggle();
        });
        
        // export public key
        $('#key-menue-share-container .save').click(function() {
            var fileInput = $('<input type="file" />');
            fileInput.attr('nwsaveas', 'public.key');
            fileInput.change(function() {
                // check file given?
                if ($(this).val() === '')
                    return;

                // export key
                that.backend.exportPublicKey($(this).val(), function() {
                    alertify.log(lang.frontend_events_export_public_key_success);
                    $('#key-menue-dropdown').toggle();
                });
            });
            fileInput.trigger('click');
        });
        
        // export key
        $('#key-menue-export-container .save').click(function() {
            var fileInput = $('<input type="file" />');
            fileInput.attr('nwsaveas', 'keypair.key');
            fileInput.change(function() {
                // check file given?
                if ($(this).val() === '')
                    return;

                // export key
                that.backend.exportKey($(this).val(), function() {
                    alertify.log(lang.frontend_events_export_key_success);
                    $('#key-menue-dropdown').toggle();
                });
            });
            fileInput.trigger('click');
        });
        
        // import key
        $('#key-menue-import-container .save').click(function() {
            var fileInput = $('<input type="file" />');
            fileInput.change(function() {
                // check file given?
                if ($(this).val() === '')
                    return;

                // import key
                that.backend.importKey(
                    $(this).val(), 
                    $('#key-menue-import-container .password').val(),
                    function() {
                        $('#key-menue-import-container .password').val('');
                        alertify.log(lang.frontend_events_import_key_success);
                        $('#key-menue-dropdown').toggle();
                    });
            });
            fileInput.trigger('click');
        });
        
        // disable key managmement
        $('#key-menue-disable-container .save').click(function() {
            if(confirm(lang.frontend_events_confirm_disable) !== true)
                return;
            that.backend.removeKey();
            that.frontend.updatePublicKeyList(that.backend.getPublicKeys());
            alertify.log(lang.frontend_events_disable_success);
            $('#key-menue-dropdown').toggle();
        });
    },
    
    
    /**
     * initialize events inside messages
     */
    initMessages: function() {
        var that = this;
        
        // cancel file invitation
        $('body').delegate(".entry-file-cancel", "click", function(e) {
            var messageId = $(this).parents('.entry').attr('id');
            that.backend.cancelFileInvite(messageId);
        });
        
        // download file
        $('body').delegate(".entry-file-download", "click", function(e) {
            var messageId = $(this).parents('.entry').attr('id');
            var message = that.backend.getMessage(messageId);
            
            var fileInput = $('<input type="file"/>');
            fileInput.attr('nwsaveas', message.path);
            fileInput.change(function() {
                // check file given?
                if ($(this).val() === '')
                    return;
                
                // set target
                var target = $(this).val();
                $(this).val('');
                message.saved = target;
                
                // save file
                that.backend.saveFile({
                    message:  message,
                    success:  function() {
                                  that.backend.rerenderMessage(message);
                              },
                    error:    alertify.error,
                    progress: function(progress) {
                                  message.progress = progress;
                                  that.backend.rerenderMessage(message);
                              },
                    cancel:   function() {
                                  delete message.progress;
                                  that.backend.rerenderMessage(message);
                              }
                });
            });
            fileInput.trigger('click');
        });
        
        // cancel download process
        $('body').delegate(".entry-file-cancel-download", "click", function(e) {
            var messageId = $(this).parents('.entry').attr('id');
            that.backend.cancelFileDownload(messageId);
        });
        
        // open downloaded file
        $('body').delegate(".entry-file-open", "click", function(e) {
            var messageId = $(this).parents('.entry').attr('id');
            that.backend.openFile(messageId);
        });
    },
    
    
    /**
     * initialize message menue events
     */
    initMessageMenue: function() {
        var that = this;
        
        // message menue: toggle
        $('#message-add-menue').click(function() {
            $('#message-add-menue-dropdown').toggle();
        });

        // message menue: add code
        $('#message-add-menue-code').click(function() {
            that.showCodeBox();
        });

        // message menue: send file
        $('#message-add-menue-file').click(function() {
            that.selectFile();
            $('#message-add-menue-dropdown').hide();
        });

        // message menue: clear conversation
        $('#message-add-menue-clear').click(function() {
            that.backend.clearConversation(that.frontend.currentConversation);
            that.backend.getConversation(that.frontend.currentConversation);
            $('#message-add-menue-dropdown').hide();
        });

        // message menue: send code block
        $('#message-add-code-box-send').click(function() {
            // code given?
            if ($('#message-add-code-box-area').val().trim().length===0) {
                alertify.error(lang.frontend_events_enter_message);
                return;
            }

            // chat channel selected?
            if (that.frontend.currentConversation===false) {
                alertify.error(lang.frontend_events_no_chat_channel_selected);
                return;
            }

            var text = $('#message-add-code-box-area').val();
            var language = $('#message-add-code-box-language').val();

            // send message
            $('#message-add-code-box').hide();
            $('#message-add-code-box-area').val('');
            that.backend.sendMessage({
                receiver: that.frontend.currentConversation,
                type: 'codeblock-message',
                text: text,
                language: language
            });
        });

        // message menue: cancel code block
        $('#message-add-code-box-cancel').click(function() {
            $('#message-add-code-box').hide();
            $('#message-add-code-box-area').val('');
        });
    },
    
    
    /**
     * initialize message input events
     */
    initMessageInput: function() {
        var that = this;
        
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
            $('#message-input-textfield').focus();
        });
        
        // send message
        $('#message-send').click(function() {
            var text = $('#message-input-textfield').val();

            // message given?
            if (text.trim().length===0) {
                alertify.error(lang.frontend_events_enter_message);
                return;
            }

            // chat channel selected?
            if (that.frontend.currentConversation===false) {
                alertify.error(lang.frontend_events_no_chat_channel_selected);
                return;
            }
            
            // save in history
            if (typeof that.history[that.frontend.currentConversation] === 'undefined')
                that.history[that.frontend.currentConversation] = [];
            var history = that.history[that.frontend.currentConversation];
            history[history.length] = text;
            
            // command?
            if (text.indexOf('/') === 0) {
                that.frontendCommand.handle(text, that.frontend.currentConversation);
                $('#message-input-textfield').val("");
                return;
            }

            // send message
            $('#message-input-textfield').val("");
            that.backend.sendMessage({
                receiver: that.frontend.currentConversation,
                type: 'text-message',
                text: text
            });
        });

        // send message by enter
        $('#message-input-textfield').keydown(function(e) {
            // create history entry for this conversation if not defined
            if (typeof that.history[that.frontend.currentConversation] === 'undefined')
                that.history[that.frontend.currentConversation] = [];
            
            // enter
            if(e.which == 13) {
                $('#message-send').click();
            
            // down
            } else if(e.which == 40) {
                that.historyCursor = (that.historyCursor+1>that.history[that.frontend.currentConversation].length) ? that.historyCursor : that.historyCursor+1;
                $('#message-input-textfield').val(that.history[that.frontend.currentConversation][that.historyCursor]);
                
            // up
            } else if(e.which == 38) {
                that.historyCursor = (that.historyCursor===0) ? 0 : that.historyCursor-1;
                $('#message-input-textfield').val(that.history[that.frontend.currentConversation][that.historyCursor]);
                
            // other
            } else {
                that.historyCursor = that.history[that.frontend.currentConversation].length + 1;
            }
        });
    },
    
    
    /**
     * initialize left navigation events
     */
    initNavigation: function() {
        var that = this;
        
        // select user
        $('.contacts').delegate("li", "click", function() {
            var user = $(this).find('.contacts-name').html();
            $('.rooms li, .contacts li').removeClass('active');
            that.frontend.currentConversation = user;
            delete that.frontend.unreadMessagesCounter[that.frontend.currentConversation];
            that.backend.updateUserlist(that.frontend.currentConversation);
            that.backend.getConversation(user);
            $('#main-metadata').css('visibility', 'visible');
            $('#message-input-textfield').focus();
        });

        // select room
        $('.rooms').delegate("li", "click", function() {
            if ( $(this).find('.rooms-outside').length>0 ) {
                alertify.error(lang.frontend_events_select_room_not_in);
                return;
            }
            var room = $(this).find('.name').html();
            $('.rooms li, .contacts li').removeClass('active');
            that.frontend.currentConversation = room;
            delete that.frontend.unreadMessagesCounter[that.frontend.currentConversation];
            that.backend.updateRoomlist();
            that.backend.updateUserlist(that.frontend.currentConversation);
            that.backend.getConversation(that.frontend.currentConversation);
            $('#main-metadata').css('visibility', 'visible');
            $('#message-input-textfield').focus();
        });

        // rooms add: show dialog
        $('#rooms-add').click(function() {
            that.showAddRoomsDialog(this);
        });

        // rooms add: cancel
        $('body').delegate(".rooms-popup.add .cancel", "click", function() {
            $('.rooms-popup.add').remove();
        });

        // rooms add: save
        $('body').delegate(".rooms-popup.add .save", "click", function() {
            var room = $(this).parent().find('.name').val();
            var users = $(this).parent().find('select').val();

            // room name given?
            if($.trim(room).length===0) {
                alertify.error(lang.frontend_events_add_room_no_name);
                return;
            }

            // don't add room with same name
            if(that.backend.doesRoomExists(room)) {
                alertify.error(lang.frontend_events_room_already_exists);
                return;
            }

            // don't add room of name of a user
            if(that.backend.getUser(room)!==false) {
                alertify.error(lang.frontend_events_user_with_roomname_exists);
                return;
            }

            // add room
            that.backend.addRoom(room, users);

            // hide popup
            $('.rooms-popup.add').remove();
            alertify.log(lang.frontend_events_room_added);
        });

        // rooms invitation: accept
        $('body').delegate(".rooms-popup.invite .save", "click", function() {
            var room = $(this).parent().find('.name').val();
            that.backend.acceptInvitation(room);
            $(this).parent().remove();
        });

        // rooms invitation: decline
        $('body').delegate(".rooms-popup.invite .cancel", "click", function() {
            var room = $(this).parent().find('.name').val();
            that.backend.declineInvitation(room);
            $(this).parent().remove();
        });

        // rooms: invite user
        $('.rooms').delegate("li .rooms-invite", "click", function() {
            that.showInviteRoomsDialog(this);
        });

        // rooms: invite user save
        $('body').delegate(".rooms-popup.edit .save", "click", function() {
            var room = $(this).parent().find('.name').val();
            var users = $(this).parent().find('select').val();

            that.backend.inviteUsers(room, users);

            $('.rooms-popup.edit').remove();
            alertify.log(lang.frontend_events_invites_sent);
        });

        // rooms: invite user cancel
        $('body').delegate(".rooms-popup.edit .cancel", "click", function() {
            $('.rooms-popup.edit').remove();
        });

        // rooms: leave
        $('.rooms').delegate("li .rooms-leave", "click", function(e) {
            if(confirm(lang.frontend_events_confirm_room_leave) !== true)
                return;
            var room = $(this).parent().find('.name').html();
            that.backend.leaveRoom(room);
            $('.rooms li:first').click();
            e.preventDefault();
            return false;
        });
    },


    /**
     * select new avatar
     */
    selectAvatar: function() {
        var that = this;
        var fileInput = $('<input type="file" />');
        fileInput.attr('accept', '.jpg,.jpeg,.png,.gif');
        fileInput.change(function() {
            // check file given?
            if ($(this).val() === '')
                return;

            // show cropper
            $('#main-menue-dropdown li').hide();
            $('#main-menue-avatar-croper').show();

            // load file
            var file = $(this).val();
            $(this).val('');
            that.backend.getFile(
                file,
                function(data) {
                    // check filetype
                    var filetype = file.split('.').pop();
                    filetype = typeof filetype === 'string' ? filetype.toLowerCase() : '';
                    if (filetype != "png" && filetype != "jpg" && filetype != "gif") {
                        alertify.error(lang.frontend_events_filetype_error);
                        $('#main-menue-avatar-croper .cancel').click();
                        return;
                    }

                    // init jCrop
                    $('#main-menue-avatar-croper *:not(input)').remove();
                    $('#main-menue-avatar-croper').prepend('<img />');
                    $('#main-menue-avatar-croper img').attr('src', 'data:image/' + filetype + ';base64,' + data.toString('base64'));
                    that.frontendHelpers.resizeImage($('#main-menue-avatar-croper img'), 200, 200);
                    that.selection = false;

                    var img = $('#main-menue-avatar-croper img');
                    var max = img.width()>img.height() ? img.height() : img.width();
                    $('#main-menue-avatar-croper img').Jcrop({
                        onSelect: function(c) {
                            that.selection = c;
                        },
                        setSelect: [max*0.1, max*0.1, max*0.9, max*0.9],
                        aspectRatio: 1
                    });
                },
                alertify.error
            );
        });
        fileInput.trigger('click');
    },

    
    /**
     * select file for sending
     */
    selectFile: function() {
        var that = this;
        var fileInput = $('<input type="file" />');
        fileInput.change(function() {
            // check file given?
            if ($(this).val() === '')
                return;

            // chat channel selected?
            if (that.frontend.currentConversation===false) {
                alertify.error(lang.frontend_events_no_chat_channel_selected);
                return;
            }
            
            // send file using backend
            var file = $(this).val();
            $(this).val('');
            that.backend.sendFileInvite(file, that.frontend.currentConversation);
        });
        fileInput.trigger('click');
    },

    
    /**
     * show add room dialog popup
     */
    showAddRoomsDialog: function(element) {
        // remove existing popups
        $('.rooms-popup.add, .rooms-popup.edit').remove();

        // create select with all users
        var select = this.createSelectForAllOnlineUsers();

        // create popup with text and buttons
        var div = $(this.frontendHelpers.createRoomsPopup(element, "add"));
        div.append('<input type="text" class="name selectize-input" placeholder="' + lang.frontend_events_add_room_placeholder + '">');
        div.append(select);
        div.append('<input class="save" type="button" value="' + lang.frontend_events_add_room_save + '" /> <input class="cancel" type="button" value="' + lang.frontend_events_add_room_cancel + '" />');

        // make user select selectize.js
        $(select).selectize({plugins: ['remove_button']});
    },


    /**
     * shows the invite more users dialog
     */
    showInviteRoomsDialog: function(element) {
        var room = $(element).parent().find('.name').html();

        // create select with all users
        var select = this.createSelectForAllOnlineUsers();

        // create popup with text and buttons
        var div = $(this.frontendHelpers.createRoomsPopup($('#rooms-add'), "edit"));
        div.append('<p>' + lang.frontend_events_invite + '</p>');
        div.append('<input class="name" type="hidden" value="' + room.escape() + '" />');
        div.append(select);
        div.append('<input class="save" type="button" value="' + lang.frontend_events_invite_save + '" /> <input class="cancel" type="button" value="' + lang.frontend_events_invite_cancel + '" />');

        // make user select selectize.js
        $(select).selectize({plugins: ['remove_button']});
    },


    /**
     * create a select input for all online users
     */
    createSelectForAllOnlineUsers: function() {
        // get all online users from backend
        var users = this.backend.getAllOnlineUsers();

        // create select with all online users
        var select = document.createElement("select");
        select.setAttribute('placeholder', lang.frontend_events_invite_user_placeholder);
        select.setAttribute('multiple', 'multiple');
        for (var i=0; i<users.length; i++) {
            var option = document.createElement("option");
            option.setAttribute('value', users[i].username);
            option.innerHTML = users[i].username;
            select.appendChild(option);
        }

        return select;
    },


    /**
     * show codeBox with textarea for code
     */
    showCodeBox: function() {
        $('#message-add-menue-dropdown').hide();
        $('#message-add-code-box').show();
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
        var padding = parseInt($('#content').css('padding-bottom'));

        $('#content-wrapper').height(windowHeight - headerHeight - messageHeight - padding);

        // set new position for rooms popups
        var diff = windowHeight - this.lastWindowHeight;
        this.lastWindowHeight = windowHeight;
        $('.rooms-popup').each(function(index, item) {
            $(item).css('top', parseInt($(item).css('top')) + diff);
        });
    }
}));
