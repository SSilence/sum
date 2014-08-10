describe('backend crypto', function() {
    var backendCrypto = inject('sum-backend-crypto');


    it('generateKeypair: starts keypair generation correctly', function() {
        NodeRSA = jasmine.createSpy('NodeRSA');
        backendCrypto.generateKeypair();
        expect(NodeRSA).toHaveBeenCalledWith({b: 2048});
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
        backendCrypto.rsaencrypt(key, testData);
        backendCrypto.rsadecrypt(key, testData);
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
        backendCrypto.rsaencrypt(key, testData);
        backendCrypto.rsadecrypt(key, testData);
    });
});