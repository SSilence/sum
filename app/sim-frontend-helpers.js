sim.frontend.helpers = {
    /**
     * updates ago during element is visible
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
     * escape html
     */
    escape: function(string) {
        var entityMap = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': '&quot;',
            "'": '&#39;',
            "/": '&#x2F;'
          };

        return String(string).replace(/[&<>"'\/]/g, function (s) {
          return entityMap[s];
        });
    },
    
    
    /**
     * insert emoticons
     */
    emoticons: function(text) {
        $.each(emoticons, function(shortcut, emoticon) {
            // escape shortcut
            shortcut = shortcut.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
            
            var re = new RegExp(shortcut, 'g');
            text = text.replace(re, '<img src="'+ emoticon +'" title="' + shortcut + '"/>');
        });
        return text;
    },
    
    
    /**
     * resize image to smaller size in frontend
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

        // Check if current height is larger than max
        if(height > maxHeight){
            ratio = maxHeight / height; // get ratio for scaling image
            $(img).css("height", maxHeight);   // Set new height
            $(img).css("width", width * ratio);    // Scale width based on ratio
            width = width * ratio;    // Reset width to match scaled image
        }
    }
}