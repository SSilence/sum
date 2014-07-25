describe('string escaper', function() {
    it('escapes all critical tags', function() {
        expect("string <with &all> 'critical' \"tags\"".escape()).toBe("string &lt;with &amp;all&gt; &#39;critical&#39; &quot;tags&quot;");
    });
});