var sim = {};

$(document).ready(function() {
    // initialize backend
    sim.backend.init();

    // initialize frontend
    sim.frontend.init(sim.backend);
});