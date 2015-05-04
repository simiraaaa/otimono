(function (window, document,undefined) {
    var Array = window.Array;
    var each = Array.prototype.forEach;
    var splice = Array.prototype.splice;
    
    //‚±‚êˆÈã‚ÅI—¹
    var MAX_OFFSET = 7580;
    var endFlag = false;

    var outputWindow = window.open('about:blank');
    var out = outputWindow.document;
    var writeln = function (s) {
        return out.writeln(s);
    };
    //init
    writeln('(LÍM)ƒOƒwƒwŒ€ê');
    out.body.style.display = 'none';

    var getNextUrl = (function () {
        var offset = 0;
        return function () {
            offset += 20;
            if (offset >= MAX_OFFSET) endFlag = true;
            return 'http://joysound.com/ex/utasuki/community/room/topics/_commId_4683__topicId_19826__offset_' + offset + '_topics.htm';
        };
    })();
    var inputWindow = document.createElement('iframe');
    inputWindow.width =  inputWindow.height = '100%';
    var inp;

    var next = function next() {
        inputWindow.src = getNextUrl();
    };

    var getContent = function getContent() {
        var comments = inp.getElementsByClassName('last');
        return splice.call(comments, 1, comments.length - 2);
    };
    var getComments = function getComments(content) {
        var children = content.childNodes;
        var textNodes = [];
        each.call(children, function (e) {
            var t=e.tagName;
            if (t === 'BR' || t === undefined) textNodes.push(e);
        });
        textNodes.splice(0, 3);
        return textNodes;
    };

    var writeComments = function writeComments(comments) {
        writeln(comments.pop().textContent.trim());
        var last = comments.shift();
        var comment;
        while ((comment = comments.pop())!==undefined) {
            writeln(comment.textContent);
        }
        (last!==undefined)&&writeln(last.textContent.trim());
    }

    inputWindow.onload = function () {
        inp = inputWindow.contentDocument;
        getContent().forEach(function (e) { writeComments(getComments(e)) });
        if (endFlag) return alert('(LÍM)ƒOƒwƒwŒ€ê‚ÌƒRƒƒ“ƒg‚ª‘S‚Äæ‚ê‚½‚æ');
        inputWindow.src = getNextUrl();
    };

    document.body.appendChild(inputWindow).src = window.location.href;

})(window, document);