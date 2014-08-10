describe('backend helper', function() {
    var testUserlist;
    var backendHelper = inject('sum-backend-helpers');
    
    beforeEach(function() {
        testUserlist = [
            { 
                username: 'Erich',
                timestamp: new Date().getTime(),
                status: 'online',
                userfileTimestamp: new Date().getTime(),
                rooms: ['room1']
            },
            { 
                username: 'Peter',
                timestamp: new Date().getTime(),
                status: 'offline',
                userfileTimestamp: new Date().getTime(),
                rooms: ['room2']
            },
            { 
                username: 'Anton',
                timestamp: new Date().getTime(),
                status: 'online',
                userfileTimestamp: new Date().getTime(),
                rooms: ['room1']
            },
            { 
                username: 'Dieter',
                timestamp: new Date().getTime() - 30000,
                status: 'offline',
                userfileTimestamp: new Date().getTime() - 30000,
                rooms: []
            }
        ];
    });

    
    it('sortUserlistByUsername: sorts correctly', function() {
        var sorted = backendHelper.sortUserlistByUsername(testUserlist);

        expect(sorted[0].username).toBe('Anton');
        expect(sorted[1].username).toBe('Dieter');
        expect(sorted[2].username).toBe('Erich');
        expect(sorted[3].username).toBe('Peter');
    });
    
    
    it('mergeUserAndUserinfos: merge user and userinfos correctly', function() {
        var userinfos = {
            ip: '192.122.122.122',
            port: 12,
            key: 'publickey123'
        };
        var merged = backendHelper.mergeUserAndUserinfos(testUserlist[0], userinfos);
        
        expect(merged.ip).toBe(userinfos.ip);
        expect(merged.port).toBe(userinfos.port);
        expect(merged.key).toBe(userinfos.key);
        expect(merged.username).toBe(testUserlist[0].username);
        expect(merged.timestamp).toBe(testUserlist[0].timestamp);
        expect(merged.status).toBe(testUserlist[0].status);
        expect(merged.userfileTimestamp).toBe(testUserlist[0].userfileTimestamp);
    });
    
    
    it('getUsername: returns the username from environment variable', function() {
        process = {};
        process.env = {};
        process.env.USERNAME = 'bla';
        expect(backendHelper.getUsername()).toBe('bla');
    });
    
    
    it('getUsername: returns the username from config if no environment variable USERNAME is available', function() {
        config.username = 'blub';
        expect(backendHelper.getUsername()).toBe('blub');
    });

    
    it('getUser: search user in userlist', function() {
        expect(backendHelper.getUser(testUserlist, 'Anton')).toBe(testUserlist[2]);
    });
    
    
    it('removeRoomFromList: removes room from list', function() {
        var roomlist = [{ name: 'room1'}, { name: 'room2' }, { name: 'room3'}];
        var newList = backendHelper.removeRoomFromList(roomlist, 'room2');
        for (item in newList)
            expect(item.name).not.toBe('room2');
    });
    
    
    it('isUserInRoomList: checks corretly whether a user is in a room or not', function() {
        var rooms = [{name: 'room1'}, {name: 'room2'}];
        expect(backendHelper.isUserInRoomList(rooms, 'room2')).toBeTruthy();
        expect(backendHelper.isUserInRoomList(rooms, 'room3')).toBeFalsy();
    });
    
    
    it('getUsersNotInListOne: returns all users, which are not in list but in other one', function() {
        var stripped = [];
        for(var i = 0; i < testUserlist.length-1; i++)
            stripped[i] = testUserlist[i];
        var usersNotInListOne = backendHelper.getUsersNotInListOne(stripped, testUserlist);
        expect(usersNotInListOne).toBeDefined();
        expect(usersNotInListOne.length).toBe(1);
        expect(usersNotInListOne[0].username).toBe('Dieter');
        
        expect(backendHelper.getUsersNotInListOne(testUserlist, testUserlist).length).toBe(0);
    });
    
    
    it('getUsersByStatus: returns all users with given status', function() {
        var online = backendHelper.getUsersByStatus(testUserlist, 'online');
        var offline = backendHelper.getUsersByStatus(testUserlist, 'offline');
        
        expect(online).toBeDefined();
        expect(offline).toBeDefined();
        
        expect(online.length).toBe(2);
        expect(offline.length).toBe(2);
        $.each(online, function(index, user) {
            expect(user.username).toMatch(/Erich|Anton/);
        });
        $.each(offline, function(index, user) {
            expect(user.username).toMatch(/Peter|Dieter/);
        });
    });


    it('isVersionNewer: identify a newer or older version', function() {
        expect(backendHelper.isVersionNewer("1.3.0", "2.4.0")).toBeTruthy();
        expect(backendHelper.isVersionNewer("1.3.0", "1.3.1")).toBeTruthy();
        expect(backendHelper.isVersionNewer("1.3.0", "1.4.0")).toBeTruthy();
        expect(backendHelper.isVersionNewer("1.3.0", "2.3.0")).toBeTruthy();

        expect(backendHelper.isVersionNewer("2.4.1", "2.4.0")).toBeFalsy();
        expect(backendHelper.isVersionNewer("2.5.0", "2.4.0")).toBeFalsy();
        expect(backendHelper.isVersionNewer("3.4.0", "2.4.0")).toBeFalsy();
    });
});