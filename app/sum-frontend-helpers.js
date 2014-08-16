/**
 * helpers for the frontend
 *
 * @copyright  Copyright (c) Tobias Zeising (http://www.aditu.de)
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
define('sum-frontend-helpers', Class.extend({

    /**
     * updates ago during element is visible
     * @param date (date) given date
     * @param element (DOMNode) HTML Element which should holds the time
     */
    startDateAgoUpdater: function(date, element) {

        // no longer update removed elements
        var found = false;
        $('#content .entry-datetime').each(function(index, item) {
            if($(item).html()==$(element).html()) {
                found = true;
                return false;
            }
        });

        if(found===false)
            return;

        // calculate update interval
        var dateInSeconds = date / 1000;
        var now = new Date().getTime() / 1000;
        var ageInSeconds = now - dateInSeconds;
        var ageInMinutes = ageInSeconds / 60;
        var ageInHours = ageInMinutes / 60;
        var ageInDays = ageInHours / 24;

        var timeout = 1000;
        if(ageInMinutes<1)
            timeout = 60000;
        else if(ageInHours<1)
            timeout = 1000 * 60;
        else if(ageInDays<1)
            timeout = 1000 * 60 * 60;
        else
            return;

        // update element
        $(element).html(this.dateAgo(dateInSeconds));

        // trigger next update
        var that = this;
        window.setTimeout(function() {
            that.startDateAgoUpdater(date, element);
        }, timeout);
    },


    /**
     * convert date in vor n Minuten
     * @return (string) formatted date
     * @param date (date) given date
     */
    dateAgo: function(date) {
        var now = new Date().getTime() / 1000;

        var ageInSeconds = now - date;
        var ageInMinutes = ageInSeconds / 60;
        var ageInHours = ageInMinutes / 60;
        var ageInDays = ageInHours / 24;

        if(ageInMinutes<1)
            return ' ' + lang.frontend_helpers_a_few_seconds_ago;
        if(ageInHours<1)
            return ageInMinutes < 2 ? lang.frontend_helpers_a_minute_ago : lang.frontend_helpers_n_minutes_ago.replace(/\%s/, Math.floor(ageInMinutes));
        if(ageInDays<1)
            return ageInHours < 2 ? lang.frontend_helpers_a_hour_ago : lang.frontend_helpers_n_hours_ago.replace(/\%s/, Math.floor(ageInHours));

        var dateObj = new Date(date*1000);
        return dateObj.getHours() + ':' + dateObj.getMinutes() + ':' + dateObj.getSeconds();
    },


    /**
     * insert emoticons
     * @return (string) text with emoticons images
     * @param text (string) text with emoticons shortcuts
     */
    emoticons: function(text) {
        $.each(emoticons, function(shortcut, emoticon) {
            // escape shortcut
            shortcut = shortcut.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");

            // replace shortcut
            var re = new RegExp(shortcut, 'g');
            text = text.replace(re, '<img class="emoticons" src="'+ emoticon +'" title="' + shortcut + '"/>');
        });

        return text;
    },


    /**
     * resize image to smaller size in frontend
     * @param img (DOMNode) image for resizing
     * @param maxWidth (int) maximal allowed width
     * @param maxHeight (int) maximal allowed height
     */
    resizeImage: function(img, maxWidth, maxHeight) {
        var ratio = 0;  // Used for aspect ratio
        var width = $(img).width();    // Current image width
        var height = $(img).height();  // Current image height

        // Check if the current width is larger than the max
        if(width > maxWidth){
            ratio = maxWidth / width;   // get ratio for scaling image
            $(img).css("width", maxWidth); // Set new width
            $(img).css("height", height * ratio);  // Scale height based on ratio
        }

        width = $(img).width();    // Current image width
        height = $(img).height();  // Current image height

        // Check if current height is larger than max
        if(height > maxHeight){
            ratio = maxHeight / height; // get ratio for scaling image
            $(img).css("height", maxHeight);   // Set new height
            $(img).css("width", width * ratio);    // Scale width based on ratio
        }
    },


    /**
     * create popup for rooms messages
     * @param e (DOMNode) HTML Element for positioning of the popup
     * @param name (string) additional class for the new popup
     */
    createRoomsPopup: function(e, name) {
        var pos = $(e).offset();
        var div = document.createElement("div");
        div.setAttribute('class', 'rooms-popup ' + name);
        div.style.top = pos.top + "px";
        div.style.left = pos.left + "px";
        $(document.body).append(div);
        return div;
    },


    /**
     * detects links an replace it with a tag
     * @return (string) text with a tags
     * @param text (string) given text
     */
    urlify: function(text) {
        return text.replace(/(https?:\/\/[^\s]+)/g, function(url) {
            return '<a href="' + url + '" class="extern">' + url + '</a>';
        });
    },


    /**
     * crop and resize image with canvas
     * @return (string) base64 encoded png
     * @param image (element) img element
     * @param left (int) start cropping from left
     * @param top (int) start cropping from top
     * @param width (int) crop width
     * @param height (int) crop height
     */
    cropAndResize: function(image, left, top, width, height) {
        var ori = new Image();
        ori.src = $(image).attr('src');

        var factorX = ori.width / $(image).width();
        var factorY = ori.height / $(image).height();

        var canvas = document.createElement("canvas");
        canvas.width  = "200";
        canvas.height = "200";
        var context = canvas.getContext('2d');
        context.drawImage(image, left * factorX, top * factorY, width * factorX, height * factorY, 0, 0, 200, 200);
        return canvas.toDataURL();
    },


    /**
     * hyphenator and code numbering
     * @param element target element
     */
    numberCode: function(element) {
        // numbering for pre>code blocks
        $(element).find('pre code').each(function(){
            var lines = $(this).text().split(/\r\n|\r|\n/).length;
            var $numbering = $('<ul/>').addClass('pre-numbering');
            $(this).addClass('has-numbering').parent().append($numbering);
            for(var i=1;i<=lines;i++)
                $numbering.append($('<li/>').text(i));
        });
    },
    
    
    /**
     * format file size to human readable size
     * @return (string) size in readable format e.g. 10 MB
     * @param bytes (int) filesize
     */
    humanFileSize: function(bytes) {
        var thresh = 1024;
        if(bytes < thresh) return bytes + ' B';
        var units = ['kB','MB','GB','TB'];
        var u = -1;
        do {
            bytes /= thresh;
            ++u;
        } while(bytes >= thresh);
        return bytes.toFixed(1) + ' '+units[u];
    },
    
    
    /**
     * returns sum of all unread messages in all conversations
     * @return (int) amount of unread messages
     * @param conversations (array) conversations array
     */
    countAllUnreadMessages: function(conversations) {
        var sum = 0;
        $.each(conversations, function(index, item) {
            sum += item;
        });
        return sum;
    }
}));
