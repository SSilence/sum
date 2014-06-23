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

// startup sim
var sim = {};

$(document).ready(function() {
    // initialize backend
    sim.backend.init();

    // initialize frontend
    sim.frontend.init(sim.backend);
});