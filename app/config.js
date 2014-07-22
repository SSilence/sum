var config = {
    // path of user file
    user_file: "c:/tmp/userfile.json",
    
    // file per user where avatar and key will be stored. # will be replaced by the md5 hash of the username
    user_file_extended: "c:/tmp/#",
    
    // path of lock file
    lock_file: "c:/tmp/userfile.lock",
    
    // remove users from list after ms inactivity
    user_timeout: 60000,
    
    // update every n seconds users entry in userlist file
    user_list_update_intervall: 15000,
    
    // max age in milliseconds of lock file
    lock_stale: 3000,
    
    // retry in minimum random ms when file is locked
    lock_retry_minimum: 3000,
    
    // retry in maximum random ms when file is locked
    lock_retry_maximum: 5000,
    
    // name of the room for all chatters
    room_all: "Alle",
    
    // ips which will be ignored
    excluded_ips: "127.0.0.1",
    
    // available languages for syntax highlighting
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