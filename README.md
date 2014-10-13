SUM - Secure Ultimate Messenger
===============================

Copyright (c) 2014 Tobias Zeising, tobias.zeising@aditu.de  
http://www.sum-messenger.org/<br />
Licensed under the GPLv3 license  
Version 1.3.0-SNAPSHOT

[![Build Status](https://travis-ci.org/SSilence/sum.svg?branch=master)](https://travis-ci.org/SSilence/sum) [![Dependency Status](https://david-dm.org/ssilence/sum.svg)](https://david-dm.org/ssilence/sum)


SUM is a simple secure desktop instant messenger for local networks. No server infrastructure is needed. User find each other by registering in a file which will be stored at a shared network folder or optionally by an simple backend written in php. The communication between users is RSA encrypted. User can verify the identity of the other users by sharing their public keys. SUM is ideal for communication in company's because no messages will be stored anywhere. The integrated public/private key management allows a encrypted communication and ensures a tap-proof and tamper-proof messaging.

![SUM Screenshot](https://raw.githubusercontent.com/SSilence/sum/master/website/screenshot_medium.png)



Features
--------

* no server needed
* full encrypted
* signature check (public / private key management)
* send files (encrypted)
* rooms
* send formatted source code
* avatars for users
* emoticons



INSTALLATION & CONFIGURATION
----------------------------

[Download](https://github.com/SSilence/sum/releases) and unzip ``sum.zip``. You can start sum by executing ``sum.exe``. 

You can configure SUM by adding ``config.ini`` in the same folder as your ``sum.exe``. You can also enter the path of the ``config.ini`` as command line argument for ``sum.exe``. 

```
SUM.exe c:\tmp\otherconfig.ini
```

Before you can use SUM you have to configure first how your chat clients will find each other. You can choose between using a network drive (shared directory) or using a php based backend script on a webserver.


**Using a network drive or shared directory**

If you use a shared folder as backend then insert following values in your config.ini. You have to specify myserver/simfolder:

```
userlist = file
user_file = //myserver/simfolder/userfile.json
user_file_extended = //myserver/simfolder/?
lock_file = //myserver/simfolder/userfile.lock
```


**Using the backend script on a webserver**

You can also use the ``backend.php`` on your webserver. This little script saves the userlist in a sqlite database (you don't have to configure anything, just give the script write permissions to the folder backend.php is in). Before the SUM client saves the data in the backend.php script it encrypts it. You can specify the AES password. Only your clients can decrypt the data stored on the webserver.

```
userlist = web
web_url = http://myserver/sum/backend.php
aes_key = mysecretpassword
sha256_salt = anysaltstring
```

The AES key will be used for encrypting all user informations before putting them on your share or server. This ensures that no internal information (like IP addresses or usernames) will be accessible outside your closed network.




CONFIGURATION
-------------


You can configure following values in your config.ini. See default.ini for default settings.

Following configuration parameters are available in config.ini:
* ``userlist``: use file or web for using file based or web based (backend.php) userlist management
* ``web_url``: if you use web for parameter userlist this specifies the url where backend.php runs
* ``aes_key``: this specifies the AES password for encrypting the userfile and any data the backend.php script will save on server
* ``sha256_salt``: salt for password hashing
* ``user_file``: if you use file for parameter userlist this specifies the path of the userlist file where all users register themself
* ``user_file_extended``: if you use file for parameter userlist this specifies the path of the file where a user saves data as their avatar, key, ip and port which changes rarely
* ``lock_file``: if you use file for parameter userlist this specifies the lock file for ensuring that only one user access the userfile at once
* ``iv``: initialization vector for aes encryption
* ``language``: language (de for German, en for English)
* ``version_file``: path of version file. There you can enter the newest SUM version and all user which has a lower version will get a note about an update
* ``version_update``: url to the newest version for downloading
* ``version_update_intervall``: how often sum checks for new version
* ``user_timeout``: set user status to offline after ms inactivity
* ``user_remove``: remove users from list after ms inactivity
* ``user_list_update_intervall``: update every n seconds users entry in userlist file
* ``lock_stale``: max age in milliseconds of lock file
* ``lock_retry_minimum``: retry in minimum random ms when file is locked
* ``lock_retry_maximum``: retry in maximum random ms when file is locked
* ``notification_reminder``: timeout for notification about unread messages reminder in ms
* ``excluded_ips``: ips which will be ignored on creating server
* ``about_url``: url for menue entry 'about sum'
* ``highlight_languages_value``: supported highlight.js languages in code input selection (replace value by language key)



DEVELOPING & CONTRIBUTING
-------------------------

See [developer guide](https://github.com/SSilence/sum/blob/master/DeveloperGuide.md) for more information about SUMs architecture, how you install the development environment, test, build and debug SUM.
Feel free to send a pull request.



CREDITS
-------

Thanks a lot to [Andi](https://github.com/DaAndi82) for implementing code message type.

Special thanks to the great programmers of this libraries which will be used in SUM:

* node-webkit: https://github.com/rogerwang/node-webkit
* jquery: http://jquery.com/
* lockfile: https://github.com/isaacs/lockfile
* node-rsa: https://github.com/rzcoder/node-rsa
* ini: https://github.com/isaacs/ini
* nw-desktop-notifications: https://github.com/robrighter/nw-desktop-notifications
* alertify: http://fabien-d.github.io/alertify.js/
* jquery custom content scroller: http://manos.malihu.gr/jquery-custom-content-scroller/
* jCrop: http://deepliquid.com/content/Jcrop.html
* selectize.js: http://brianreavis.github.io/selectize.js/
* highlight.js: http://highlightjs.org/
* Simple Class Creation and Inheritance: http://ejohn.org/blog/simple-javascript-inheritance/
* grunt: http://gruntjs.com/
* grunt node webkit builder: https://github.com/mllrsohn/grunt-node-webkit-builder
* grunt shell: https://github.com/sindresorhus/grunt-shell
* grunt contrib jasmine: https://github.com/gruntjs/grunt-contrib-jasmine
* grunt coverage template: https://github.com/maenu/grunt-template-jasmine-istanbul
* grunt contrib compress: https://github.com/gruntjs/grunt-contrib-compress
* jasmine unit test: http://jasmine.github.io/
* wait for images: https://github.com/alexanderdickson/waitForImages
* request: https://github.com/mikeal/request
* CryptoJS: https://code.google.com/p/crypto-js/
* ionicons: http://ionicons.com/
* WebIconset.com Emoticons: http://www.webiconset.com/emoticons-smilies-icon-set/
* Website Template: http://html5up.net/
* Application Icon: http://www.graphicsfuel.com/
* Font Oswald: http://www.fontsquirrel.com/fonts/oswald
