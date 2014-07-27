function require() {

}

config = {
    user_file: "c:/tmp/userfile.json",
    user_file_extended: "c:/tmp/#",
    lock_file: "c:/tmp/userfile.lock",
    user_timeout: 60000,
    user_remove: 86400000,
    user_list_update_intervall: 15000,
    lock_stale: 3000,
    lock_retry_minimum: 3000,
    lock_retry_maximum: 5000,
    room_all: "Alle",
    excluded_ips: "127.0.0.1",
    highlight_languages: {
        auto: 'Autoselect Syntax-Highlighting',
        xml: 'HTML und XML',
        css: 'CSS',
        javascript: 'JavaScript',
        php: 'PHP',
        json: 'JSON',
        java: 'Java',
        sql: 'SQL'
    }
};