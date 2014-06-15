SUM - S Ultimate Messenger
==========================

Copyright (c) 2013 Tobias Zeising, tobias.zeising@aditu.de  
http://www.aditu.de  
Licensed under the GPLv3 license  
Version 0.1-SNAPSHOT


SUM is a simple instant messenger for local networks. No server infrastructure is needed. User find each other by registering in a single file which will be stored at a shared network folder.


STILL IN DEVELOPMENT
--------------------

ToDo List:
* room handling (add room, enter and leave room, one static room for all)
* avatars
* notifications for all events


CONFIG AND DEBUGGING
--------------------

You can configure SUM by changing app/config.js. You can also give a other config as command line argument:

```
nw.exe ./../config_ext.js
```

Following configuration parameters are available:
* ``user_file``: path of the file where all users register themself
* ``lock_file``: path of the lock file for the user file. ensures that only one user access the user file
* ``user_timeout``: remove users from list after ms inactivity
* ``user_list_update_intervall``: update every n seconds users entry in userlist file
* ``chatport``: port for chat communication
* ``lock_stale``: max age in milliseconds of lock file

You can access the debugger by setting ``"toolbar": true`` in ``package.json``



CHANGELOG
---------

Version 0.1-SNAPSHOT
* initial commit



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