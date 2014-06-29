/**
 * static helpers for the frontend
 *
 * @copyright  Copyright (c) Tobias Zeising (http://www.aditu.de)
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
sim.frontend.helpers = {


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
        
        if(found==false)
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
            timeout = 1000;
        else if(ageInHours<1)
            timeout = 1000 * 60;
        else if(ageInDays<1)
            timeout = 1000 * 60 * 60;
        else
            return;
        
        // update element
        $(element).html(sim.frontend.helpers.dateAgo(dateInSeconds));
        
        // trigger next update
        window.setTimeout(function() {
            sim.frontend.helpers.startDateAgoUpdater(date, element);
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
            return 'vor ' + Math.floor(ageInSeconds) + ' Sekunden';
        if(ageInHours<1)
            return 'vor ' + Math.floor(ageInMinutes) + ' Minuten';
        if(ageInDays<1)
            return 'vor ' + Math.floor(ageInHours) + ' Stunden';
        
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
            text = text.replace(re, '<img src="'+ emoticon +'" title="' + shortcut + '"/>');
        });
        
        return text;
    },
    
    
    /**
     * search for BB-Tag "code"
     * @return (boolean) true or false
     * @param text (string) text with BB-Tags
     */
    hasCode: function(text) {        
        
        if (text.search(/\[code\]/) != -1) {
            return true;
        } else {
            return false;
        }
    },
    

    /**
     * Replace BB-Tag "code" with HTML code-block
     * @return (string) text surounded with code-block (<pre><code>)
     * @param text (string) text with bb-tag "code"
     */
    setPreCodeBlock: function(text) {
        
        text = text.replace(/\[code\]/g, "<pre><code>");
        text = text.replace(/\[\/code\]/g, "</pre></code>");
        
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
            height = height * ratio;    // Reset height to match scaled image
        }

        width = $(img).width();    // Current image width
        height = $(img).height();  // Current image height
        
        // Check if current height is larger than max
        if(height > maxHeight){
            ratio = maxHeight / height; // get ratio for scaling image
            $(img).css("height", maxHeight);   // Set new height
            $(img).css("width", width * ratio);    // Scale width based on ratio
            width = width * ratio;    // Reset width to match scaled image
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
     * crop and resize image with canvas.
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
        
        factorX = ori.width / $(image).width();
        factorY = ori.height / $(image).height();
        
        var canvas = document.createElement("canvas");
        canvas.width  = "200";
        canvas.height = "200";
        var context = canvas.getContext('2d');
        context.drawImage(image, left * factorX, top * factorY, width * factorX, height * factorY, 0, 0, 200, 200);
        return canvas.toDataURL();
    }
}