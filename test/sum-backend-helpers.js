describe('backend helper', function() {
    it('sorts correctly', function() {
        var backendHelper = inject('sum-backend-helpers')
        var sorted = backendHelper.sortUserlistByUsername([
            { username: 'Erich' },
            { username: 'Peter' },
            { username: 'Anton' },
            { username: 'Dieter' }
        ]);

        expect(sorted[0].username).toBe('Anton');
        expect(sorted[1].username).toBe('Dieter');
        expect(sorted[2].username).toBe('Erich');
        expect(sorted[3].username).toBe('Peter');
    });
});