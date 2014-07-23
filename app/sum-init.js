/**
 * startup sim
 *
 * @copyright  Copyright (c) Tobias Zeising (http://www.aditu.de)
 * @license    GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html)
 */
$(document).ready(function() {
    var backend = inject('sum-backend');
    var frontend = inject('sum-frontend');
    backend.initialize();
    frontend.initialize();
});
