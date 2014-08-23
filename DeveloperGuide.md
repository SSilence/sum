SUM Developement Guide
======================

This is a short introduction in the architecture of SUM. This guide is for all who plan to enhance or change SUM.

SUM uses node-webkit as environment, jquery for the frontend, node for the backend. Ensure that you understand the basics of this frameworks.


BASIC SETUP
-----------

For running SUM in development mode, building SUM executable or building setup, you have to install following tools:

 1. install [node.js](http://nodejs.org/)
 2. ```npm install nodewebkit -g``` installs node webkit which is a webkit browser with build in node
 3. ```npm install grunt-cli -g``` installs the build tool grunt
 4. ```npm install``` in SUM folder install all development dependencies
 5. if you plan to build a setup then install [InnoSetup](http://www.jrsoftware.org/isinfo.php) and add it to your path environment variable

 
 
RUN, BUILD, TEST SUM
--------------------

After doing basic setup you can run, build and test SUM. Open your command line and change into the SUM directory.

 - ```nodewebkit``` starts SUM
 - ```grunt build``` compiles SUM executable
 - ```grunt check``` runs tests and jshint
 - ```grunt version --newversion=1.2.3``` updates the version information in package.json, setup.iss and readme.md
 - ```grunt``` tests SUM, compiles the SUM executable and builds the setup
 - ```grunt --newversion=1.2.3``` updates version information, tests SUM, compiles the SUM executable and builds the setup


 
CLASSES
-------

For defining classes I use [John Resigs](http://ejohn.org/blog/simple-javascript-inheritance/) little classes script. Currently there is no inheritance in SUM but its nice to have this option and I like how classes are defined. You can find this in ``libs/class.js``

This shows, how Johns class definition will be used:
```javascript
var Person = Class.extend({
  init: function(isDancing){
    this.dancing = isDancing;
  }
});
 
var Ninja = Person.extend({
  init: function(){
    this._super( false );
  }
});
 
var p = new Person(true);
p.dancing; // => true
 
var n = new Ninja();
n.dancing; // => false
```



Dependency Injection
--------------------

I use a simple self made dependency injection script for creating instances of classes. The value ``injected('classname')`` of a object property will be replaced with an instance of the given class. The dependency injection script is defined in ``libs/injector.js``

Following example shows how you can use di:

```javascript
define('oneclass', function() {
    this.foo = 'bar';
});

define('anotherclass', function() {
    this.oneclass = injected('oneclass');
});

var anotherclass = inject('anotherclass');
console.info(anotherclass.oneclass.foo); // 'bar'
```



STRUCTURE OF SUM
----------------

SUM consists of two parts:

![frontend knows backend, but backend doesn't know frontend](http://yuml.me/diagram/scruffy;dir:TB/class/%252F%252F%20Cool%20Class%20Diagram,%20%5Bsum-frontend%5D-%3E%5Bsum-backend%5D.png)


 - **frontend**: this handels all UI events, and showing any new messages and data coming from backend
 - **backend**: this handels chat communication, updating the userlist and encryption

The frontend knows the backend and uses the backend (only the ``sum-backend`` class). Backend doesn't know and call the frontend. The frontend registers a few callbacks at backend, which will be called for backend events as receiving new messages or informing the frontend about a new user which is now online.



FRONTEND
--------

The frontend consits of following parts:

![sums frontend](http://yuml.me/diagram/scruffy/class/%5Bsum-frontend%5D-initialize%3E%5Bsum-frontend-events%5D%2C%5Bsum-frontend%5D-renders%20single%20message%3E%5Bsum-frontend-messages%5D%2C%5Bsum-frontend-events%5D-handles%3E%5Bsum-frontend-command%5D%2C%5Bsum-frontend-command%5D-%3E%5Bsum-backend%5D%2C%5Bsum-frontend-events%5D-%3E%5Bsum-backend%5D%2C%5Bsum-frontend-messages%5D-%3E%5Bsum-backend%5D%2C%5Bsum-frontend%5D-%3E%5Bsum-backend%5D)

 - ``sum-frontend`` the basic entry point which initialize the frontend. This class refreshes the userlist, roomlist and conversation view. Frontend will always repaint the whole user and roomlist.
 - ``sum-frontend-events`` defines all event handler on ui events (like button click handler, menue clicks, ...). It calls directly the backend (e.g. sends a message).
 - ``sum-frontend-command`` handles any command input like /exit or /reload in the message input field
 - ``sum-frontend-messages`` renders the single messages, depending on the message type (text message, code message, file invite, ...)
 - ``sum-frontend-helpers`` holds a few helpers for formatting or popup creation or any other simple repeating thing

Basic page layout is defined in ``index.html`` and ``main.css``.

 
BACKEND
-------

The Backend has a few helper classes:

![sums frontend](http://yuml.me/diagram/scruffy;dir:LR/class/%5Bsum-backend%5D-%3E%5Bsum-backend-client%5D%2C%5Bsum-backend%5D-%3E%5Bsum-backend-crypto%5D%2C%5Bsum-backend%5D-%3E%5Bsum-backend-filesystem%5D%2C%5Bsum-backend%5D-%3E%5Bsum-backend-storage%5D%2C%5Bsum-backend%5D-%3E%5Bsum-backend-helpers%5D)

 - ``sum-backend-client`` execute HTTP requests
 - ``sum-backend-crypto`` encryption and decryption
 - ``sum-backend-filesystem`` any filesystem operation
 - ``sum-backend-helpers`` static helpers for sorting lists, search in lists, ...
 - ``sum-backend-storage`` saves and loads from local storage

**List of all users**

For finding other users SUM supports two userfile types: on filesystem (``sum-backend-userlist-file``) or using a little backend.php script (``sum-backend-userlist-web``):

![sums frontend](http://yuml.me/diagram/scruffy;dir:TB/class/%5Bsum-backend-userlist-file%7Csum-backend-userlist-web%5D-updates%20userlist%3E%5Bsum-backend%5D%2C%5Bsum-backend%5D-init%20timer%3E%5Bsum-backend-userlist-file%7Csum-backend-userlist-web%5D)

SUM updates the current user periodicaly with an updated timestamp and removes timedout users from list. A second file per user holds rarely updated informations as avatar, ip and the public key.

**Server**

For receiving messages from other users and sending files  SUM starts an server (```sum-backend-server```). This server receives the messages of other users, validates them, and updates the backend and informs the frontend (using the callbacks which was registered at the backend on application startup).

![sums frontend](http://yuml.me/diagram/scruffy;dir:TB/class/%5Bsum-backend-server%5D-execute%20frontends%20callbacks%3E%5Bsum-backend%5D%2C%5Bsum-backend%5D-start%20server%3E%5Bsum-backend-server%5D)

**login, config, language**

In ``sum-init.js`` the application shows the login screen (if key management is activated), parses the ``config.ini`` and reads the current language file.
