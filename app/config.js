var config = {
    // path of user file
    user_file: "c:/tmp/userfile.json",
    
    // path of lock file
    lock_file: "c:/tmp/userfile.lock",
    
    // remove users from list after ms inactivity
    user_timeout: 60000,
    
    // update every n seconds users entry in userlist file
    user_list_update_intervall: 3000,
    
    // port for chat communication
    chatport: 60123,
    
    // max age in milliseconds of lock file
    lock_stale: 3000
};