// add escape for string
String.prototype.escape = function () {
    var entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;',
        "/": '&#x2F;'
    };

    return this.replace(/[&<>"'\/]/g, function (s) {
        return entityMap[s];
    });
};


var sim = {};

$(document).ready(function() {
    // initialize backend
    sim.backend.init();

    // initialize frontend
    sim.frontend.init(sim.backend);
});