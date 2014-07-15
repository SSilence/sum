// add escape for string
String.prototype.escape = function () {
    var entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;'
    };

    return this.replace(/[&<>"']/g, function (s) {
        return entityMap[s];
    });
};
