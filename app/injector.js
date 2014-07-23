/**
 * simple dependency injection
 *
 * @copyright  Copyright (c) Tobias Zeising (http://www.aditu.de)
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
var injectCallable = {};
var injectObjects = {};

var define = function(name, obj) {
    injectCallable[name] = obj;
};

var inject = function(name) {
    if (typeof injectCallable[name] == 'undefined')
        throw name + " was not found";
    if (typeof injectObjects[name] == 'undefined') {
        injectObjects[name] = new injectCallable[name]();

        for (property in injectObjects[name]) {
            if (typeof injectObjects[name][property] == 'string' && injectObjects[name][property].indexOf('@inject:') == 0) {
                var obj = injectObjects[name][property].substr(8);
                injectObjects[name][property] = inject(obj);
            }
        }
    }

    return injectObjects[name];
};