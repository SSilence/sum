describe('backend filesystem', function() {
    var backendFilesystem = inject('sum-backend-filesystem');


    it('writeJsonFile: writes back a json file', function() {
        var file = 'c:/tmp/test.json';
        var content = { example: 'value1', example2: 'value2' };
        fs = jasmine.createSpyObj('fs', ['writeFile']);
        backendFilesystem.writeJsonFile(file, content);
        expect(fs.writeFile).toHaveBeenCalledWith(file, JSON.stringify(content, null, 4), 'utf8', jasmine.any(Function));
    });
    
    
    it('writeJsonFile: handels error correctly with default error handler (which throws an error)', function() {
        fs = jasmine.createSpyObj('fs', ['writeFile']);
        fs.writeFile.and.throwError("bla");
        expect(function() {
            backendFilesystem.writeJsonFile("", "");
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
        
        backendFilesystem.readJsonFile(file, function(data) {});
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
        
        backendFilesystem.readFile(file, function(data) {});
        expect(fs.readFile).toHaveBeenCalledWith(file, jasmine.any(Function));
    });
    
    
    it('lock, unlock: starts get and release lockFile from lockfile lib', function() {
        lockFile = jasmine.createSpyObj('lockFile', ['lock', 'unlock']);
        backendFilesystem.lock();
        backendFilesystem.unlock();
        expect(lockFile.lock).toHaveBeenCalled();
        expect(lockFile.unlock).toHaveBeenCalled();
    });

});