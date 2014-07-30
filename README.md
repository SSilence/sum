SUM - S Ultimate Messenger
==========================

Copyright (c) 2013 Tobias Zeising, tobias.zeising@aditu.de  
http://www.aditu.de  
Licensed under the GPLv3 license  
Version 0.4.0-SNAPSHOT


SUM is a simple instant messenger for local networks. No server infrastructure is needed. User find each other by registering in a file which will be stored at a shared network folder.

[![Build Status](https://travis-ci.org/SSilence/sum.svg?branch=master)](https://travis-ci.org/SSilence/sum) [![Dependency Status](https://david-dm.org/ssilence/sum.svg)](https://david-dm.org/ssilence/sum)


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

You can configure SUM by adding config.ini in your base dir (same folder where package.json, and README.md is). 
Per default all configuration values taken from app/default.ini. By setting single values in your config.ini you 
can overwrite them. 

example config.ini in base folder:
```
user_file = //myserver/simfolder/userfile.json
user_file_extended = //myserver/simfolder/?
lock_file = //myserver/simfolder/userfile.lock
```

You can also set a config as parameter:

```
nodewebkit . c:\tmp\otherconfig.ini
```

or 

```
SUM.exe c:\tmp\otherconfig.ini
```

For only setting another username just use a username as parameter:
```
nodewebkit . KarlMustermann
```

or

```
SUM.exe KarlMusermann
```


Following configuration parameters are available in config.ini:
* ``user_file``: path of the file where all users register themself
* ``user_file_extended``: file per user where avatar and key will be stored. ? will be replaced by the md5 hash of the username
* ``lock_file``: path of the lock file for the user file. ensures that only one user access the user file
* ``version_file``: path of version file
* ``version_update``: link to version update file
* ``version_update_intervall``: how often sum checks for new version
* ``user_timeout``: set user status to offline after ms inactivity
* ``user_remove``: remove users from list after ms inactivity
* ``user_list_update_intervall``: update every n seconds users entry in userlist file
* ``lock_stale``: max age in milliseconds of lock file
* ``lock_retry_minimum``: retry in minimum random ms when file is locked
* ``lock_retry_maximum``: retry in maximum random ms when file is locked
* ``room_all``: name of the default room for all users
* ``excluded_ips``: ips which will be ignored on creating server
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
* grunt: http://gruntjs.com/
* grunt node webkit builder: https://github.com/mllrsohn/grunt-node-webkit-builder
* grunt shell: https://github.com/sindresorhus/grunt-shell
* grunt contrib jasmine: https://github.com/gruntjs/grunt-contrib-jasmine
* grunt coverage template: https://github.com/maenu/grunt-template-jasmine-istanbul
* jasmine unit test: http://jasmine.github.io/
* wait for images: https://github.com/alexanderdickson/waitForImages

  [1]: http://nodejs.org/
  [2]: http://www.jrsoftware.org/isinfo.php
