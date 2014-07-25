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
    
    
    it('generateKeypair: starts keypair generation correctly', function() {
        NodeRSA = jasmine.createSpy('NodeRSA');
        backendHelper.generateKeypair();
        expect(NodeRSA).toHaveBeenCalledWith({b: 2048});
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
    
    
    it('writeJsonFile: writes back a json file', function() {
        var file = 'c:/tmp/test.json';
        var content = { example: 'value1', example2: 'value2' };
        fs = jasmine.createSpyObj('fs', ['writeFile']);
        backendHelper.writeJsonFile(file, content);
        expect(fs.writeFile).toHaveBeenCalledWith(file, JSON.stringify(content, null, 4), 'utf8', jasmine.any(Function));
    });
    
    
    it('writeJsonFile: handels error correctly with default error handler (which throws an error)', function() {
        fs = jasmine.createSpyObj('fs', ['writeFile']);
        fs.writeFile.and.throwError("bla");
        expect(function() {
            backendHelper.writeJsonFile("", ""); 
        }).toThrowError("bla");
    });
    
    
    it('readJsonFile: reads json files and parses json correctly', function() {
        var file = 'c:/tmp/test.json';
        var content = "{ 'example': 'value1', 'example2': 'value2' }";
        fs = jasmine.createSpyObj('fs', ['readFile']);
        fs.readFile.and.callFake(function(file, format, callback) {
            var success = function(data) {
                expect(data).not.toBeUndefined();
                expect(typeof data.example != 'undefined').toBe(true);
            };
            callback(undefined, content);
        });
        
        backendHelper.readJsonFile(file, function(data) {});
        expect(fs.readFile).toHaveBeenCalledWith(file, 'utf8', jasmine.any(Function));
    });
    
    
    it('readFile: reads a file', function() {
        var file = 'c:/tmp/test.json';
        var testData = 'data123';
        fs = jasmine.createSpyObj('fs', ['readFile']);
        fs.readFile.and.callFake(function(file, callback) {
            var success = function(data) {
                expect(data).not.toBeUndefined();
                expect(data).toBe(testData);
            };
            callback(undefined, testData);
        });
        
        backendHelper.readFile(file, function(data) {});
        expect(fs.readFile).toHaveBeenCalledWith(file, jasmine.any(Function));
    });
    
    
    it('lock, unlock: starts get and release lockFile from lockfile lib', function() {
        lockFile = jasmine.createSpyObj('lockFile', ['lock', 'unlock']);
        backendHelper.lock();
        backendHelper.unlock();
        expect(lockFile.lock).toHaveBeenCalled();
        expect(lockFile.unlock).toHaveBeenCalled();
    });
    
    
    it('encrypt, decrypt: encrypt and decrypt will be delegated to node rsa', function() {
        var testData = 'test123';
        var key = {
            encrypt: function(data, format) {
                expect(data).toBe(testData);
            },
            decrypt: function(data, format) {
                expect(data).toBe(testData);
                return { toString: function() {} };
            }
        };
        backendHelper.encrypt(key, testData);
        backendHelper.decrypt(key, testData);
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
});