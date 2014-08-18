SUM - S Ultimate Messenger
==========================

Copyright (c) 2014 Tobias Zeising, tobias.zeising@aditu.de  
http://www.sum-messenger.org/<br />
Licensed under the GPLv3 license  
Version 0.9.0-SNAPSHOT

[![Build Status](https://travis-ci.org/SSilence/sum.svg?branch=master)](https://travis-ci.org/SSilence/sum) [![Dependency Status](https://david-dm.org/ssilence/sum.svg)](https://david-dm.org/ssilence/sum)


SUM is a simple secure desktop instant messenger for local networks. No server infrastructure is needed. User find each other by registering in a file which will be stored at a shared network folder or optionally by an simple backend written in php. The communication between users is RSA encrypted. User can verify the identity of the other users by sharing their public keys. SUM is ideal for communication in company's because no messages will be stored anywhere. The integrated public/private key management allows a encrypted communication and ensures a tap-proof and tamper-proof messaging.

![SUM Screenshot][1]



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



RUN SUM
-------

You can start sum by executing sum.exe. You have to configure at least your backend for using SUM in your own network. Create a config.ini in the folder of your sum.exe.

If you use a shared folder as backend then insert following values in your config.ini:
```
userlist = file
user_file = //myserver/simfolder/userfile.json
user_file_extended = //myserver/simfolder/?
lock_file = //myserver/simfolder/userfile.lock
```

If you use the php based backend, then upload backend.php on your server and configure:
```
userlist = web
web_url = http://myserver/sum/backend.php
web_aes_key = mysecretpassword
sha256_salt = anysaltstring
```

The AES key will be used for encrypting all user informations before putting them on your server. This ensures that no internal information (like IP addresses or usernames) will be accessible outside your closed network.



RUN SUM FOR DEVELOPMENT
-----------------------

 1. install [node.js][2]
 2. install node webkit: ```npm install nodewebkit -g```
 3. now you can start sum with ```nodewebkit``` from command line



BUILD RELEASE (only Windows)
----------------------------

this has to be done only once:
 1. install [InnoSetup][3]
 2. add InnoSetup program directory to path variable
 3. install [node.js][4]
 4. install grunt: ```npm install -g grunt-cli```
 5. install all developments node_modules: ```npm install```

for creating a new build you have to do following:
 1. you can set a new version by adding the optional parameter ```--newversion=1.2.3``` to grunt
 2. build sum and setup: ```grunt``` (with current version) or ```grunt --newversion=1.0.0``` (for setting new version)
 3. you can find the sum setup in the ```bin``` folder

If you are behind a proxy you have to set your proxy server for npm and nodewebkit in c:\Users\username\.npmrc
```
proxy = http://username:secret@yourproxy.de:8080/
https-proxy = https://username:secret@yourproxy.de:8080/
```

You need also proxy settings for installing nodewebkit and using grunt. You have to set ```http_proxy``` as environment variable.



TEST SUM
--------

You have three options for running unit tests:
 * unit tests will be executed on running ```grunt``` which builds also a sum.exe and setup (see build release chapter) from command line
 * only execute jshint and jasmine with ```grunt check``` from command line
 * open ```run.html``` in folder ```test``` in your browser



CONFIG
------

You can configure SUM by adding config.ini in your base dir (same folder where package.json, and README.md is). Using compiled sum.exe you can place the config.ini in the same folder as your sum.exe is. You can also enter the path of the config.ini as command line argument for sum.exe.

Per default all configuration values taken from app/default.ini. By setting single values in your config.ini you can overwrite them. 

example config.ini in base folder:
```
user_file = //myserver/simfolder/userfile.json
user_file_extended = //myserver/simfolder/?
lock_file = //myserver/simfolder/userfile.lock
```

You can also set a config as parameter:

```
nodewebkit c:\tmp\otherconfig.ini
```

or 

```
SUM.exe c:\tmp\otherconfig.ini
```

For only setting another username just use a username as parameter:
```
nodewebkit KarlMustermann
```

or

```
SUM.exe KarlMusermann
```


Following configuration parameters are available in config.ini:
* ``userlist``: use file or web for using file based or web based (backend.php) userlist management
* ``web_url``: if you use web for parameter userlist this specifies the url where backend.php runs
* ``web_aes_key``: if you use web for parameter userlist this specifies the AES password for encrypting any data the backend.php script will save on server
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

You can access the debugger by setting ``"toolbar": true`` in ``package.json``



CREDITS
-------

Special thanks to the great programmers of this libraries which will be used in SUM:

* node-webkit: https://github.com/rogerwang/node-webkit
* jquery: http://jquery.com/
* lockfile: https://github.com/isaacs/lockfile
* node-rsa: https://github.com/rzcoder/node-rsa
* ini: https://github.com/isaacs/ini
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


  [1]: https://raw.githubusercontent.com/SSilence/sum/master/website/screenshot_medium.png
  [2]: http://nodejs.org/
  [3]: http://www.jrsoftware.org/isinfo.php
  [4]: http://nodejs.org/
