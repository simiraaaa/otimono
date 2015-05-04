(function () {
    var s = document.styleSheets[0];
    var width = ~~(innerWidth / 2.35);
    width = width < 500 ? 500 : width;
    width = (innerWidth < width) ? innerWidth : width;
    width = width || 500;
    s.addRule('p', 'width:' + width + 'px');
    s.addRule('ul', 'width:' + width + 'px');
    s.addRule('ul', 'margin:0 auto');
    s.addRule('hr', 'width:' + width + 'px');
    s.addRule('hr', 'margin:10px auto');
})();