SUM - S Ultimate Messenger
==========================

Copyright (c) 2013 Tobias Zeising, tobias.zeising@aditu.de  
http://www.aditu.de  
Licensed under the GPLv3 license  
Version 0.0.4


SUM is a simple instant messenger for local networks. No server infrastructure is needed. User find each other by registering in a file which will be stored at a shared network folder.



RUN SUM
-------

 1. install [node.js][1]
 2. install node webkit: ```npm install nodewebkit -g```
 3. now you can start sum with ```nodewebkit``` from command line



BUILD RELEASE (only Windows)
----------------------------

this has to be done only once:
 1. install [InnoSetup][2]
 2. add InnoSetup program directory to path variable
 3. install [node.js][1]
 5. install grunt: ```npm install -g grunt-cli```

for creating a new build you have to do following:
 1. set version in README.md, index.html (title), package.json and setup.iss
 2. build sum: ```grunt``` (you can find the sum application in bin/releases/SUM/win/SUM/)
 3. build setup: ```grunt setup``` creates the setup file



CONFIG
------

You can configure SUM by changing app/config.js. You can also give a other config as command line argument:

```
nodewebkit ./../config_ext.js
```

config_ext.js content could be:
```
exports.extend = function(config) {
    config.username = "Karl Mustermann";
    return config;
};
```

For only setting another username just use a username as parameter:
```
nodewebkit KarlMustermann
```

Following configuration parameters are available:
* ``user_file``: path of the file where all users register themself
* ``user_file_extended``: file per user where avatar and key will be stored. # will be replaced by the md5 hash of the username
* ``lock_file``: path of the lock file for the user file. ensures that only one user access the user file
* ``user_timeout``: remove users from list after ms inactivity
* ``user_list_update_intervall``: update every n seconds users entry in userlist file
* ``lock_stale``: max age in milliseconds of lock file
* ``lock_retry_minimum``: retry in minimum random ms when file is locked
* ``lock_retry_maximum``: retry in maximum random ms when file is locked
* ``room_all``: name of the default room for all users
* ``excluded_ips``: ips which will be ignored on creating server
* ``highlight_languages``: supported highlight.js languages in code input selection

You can access the debugger by setting ``"toolbar": true`` in ``package.json``




CREDITS
-------

Special thanks to the great programmers of this libraries which will be used in SUM:

* node-webkit: https://github.com/rogerwang/node-webkit
* jquery: http://jquery.com/
* lockfile: https://github.com/isaacs/lockfile
* node-rsa: https://github.com/rzcoder/node-rsa
* nw-desktop-notifications: https://github.com/robrighter/nw-desktop-notifications
* alertify: http://fabien-d.github.io/alertify.js/
* cryptojs: https://code.google.com/p/crypto-js/
* ionicons: http://ionicons.com/
* jquery custom content scroller: http://manos.malihu.gr/jquery-custom-content-scroller/
* Font Oswald: http://www.fontsquirrel.com/fonts/oswald
* jCrop: http://deepliquid.com/content/Jcrop.html
* selectize.js: http://brianreavis.github.io/selectize.js/
* crypto-js: https://code.google.com/p/crypto-js/
* highlight.js: http://highlightjs.org/
* Simple Class Creation and Inheritance: http://ejohn.org/blog/simple-javascript-inheritance/
* WebIconset.com Emoticons: http://www.webiconset.com/emoticons-smilies-icon-set/
* Website Template: http://html5up.net/


  [1]: http://nodejs.org/
  [2]: http://www.jrsoftware.org/isinfo.php
