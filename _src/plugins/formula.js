///import core
///import commands/inserthtml.js
///commands 插入公式
///commandsName  insertFormula
///commandsTitle  插入公式
///commandsDialog  dialogs\formula\formula.html

UE.plugins['formula'] = function () {
    var me = this;

    me.addListener('ready', function () {
        domUtils.on(me.body, "mousedown", function () {
            var rng = me.selection.getRange();
            var start=domUtils.findParent(rng.startContainer, function (node) {
                return node.nodeType == 1 && node.tagName.toLowerCase() == 'span' && domUtils.hasClass(node, 'MathJax')
            }, true);

            if(start&&rng.startContainer.nodeValue==""){
                rng.startContainer=start;
                rng.endContainer=start;
                rng.setCursor(true);
            }
        });
    });

    me.commands['formula'] = {
        execCommand:function (cmdName, html, css) {
            var range = me.selection.getRange();
            range.adjustmentBoundary();
            var start = domUtils.findParent(range.startContainer, function (node) {
                    return node.nodeType == 1 && node.tagName.toLowerCase() == 'span' && domUtils.hasClass(node, 'MathJax')
                }, true),
                end = domUtils.findParent(range.endContainer, function (node) {
                    return node.nodeType == 1 && node.tagName.toLowerCase() == 'span' && domUtils.hasClass(node, 'MathJax')
                }, true);

            if (start && end && start === end) {
                if (start.nextSibling) {
                    range.setStart(start.nextSibling, 0)
                } else {
                    if (start.previousSibling) {
                        range.setStartAtLast(start.previousSibling)
                    } else {
                        var p = me.document.createElement('p');
                        domUtils.fillNode(me.document, p);
                        range.setStart(p, 0)
                    }
                }
                range.setCursor(false, true);
                domUtils.remove(start);
            }
            if (html && css) {
                me.execCommand('inserthtml', html);
                utils.cssRule('formula', css, me.document);
            }
        },
        queryCommandState:function () {
            return queryState.call(this);
        }
    };
    function queryState() {
        try {
            var range = this.selection.getRange(), start, end;
            range.adjustmentBoundary();
            start = domUtils.findParent(range.startContainer, function (node) {
                return node.nodeType == 1 && node.tagName.toLowerCase() == 'span' && domUtils.hasClass(node, 'MathJax')
            }, true);
            end = domUtils.findParent(range.endContainer, function (node) {
                return node.nodeType == 1 && node.tagName.toLowerCase() == 'span' && domUtils.hasClass(node, 'MathJax')
            }, true);
            return start && end && start == end ? 1 : 0;
        }
        catch (e) {
            return 0;
        }
    }

    //不需要判断highlight的command列表
    me.notNeedHighlightQuery = {
        help:1,
        undo:1,
        redo:1,
        source:1,
        print:1,
        searchreplace:1,
        fullscreen:1,
        autotypeset:1,
        pasteplain:1,
        preview:1,
        insertparagraph:1,
        elementpath:1,
        formula:1
    };
    //将queyCommamndState重置
    var orgQuery = me.queryCommandState;
    me.queryCommandState = function (cmd) {
        if (!me.notNeedHighlightQuery[cmd.toLowerCase()] && queryState.call(this) == 1) {
            return -1;
        }
        return orgQuery.apply(this, arguments)
    };

    function getEleByClsName(cxt, clsName) {
        if (!cxt.getElementsByClassName) {
            var clsArr = [];
            var reg = new RegExp("\\b" + clsName + "\\b");
            var eleArr = cxt.getElementsByTagName("*");
            for (var i = 0, eleobj; eleobj = eleArr[i++];) {
                if (reg.test(eleobj.className))
                    clsArr.push(eleobj);
            }
            return clsArr;
        }
        else {
            return cxt.getElementsByClassName(clsName);
        }
    }

    me.addListener("beforegetcontent beforegetscene", function () {
        me._MathJaxList = [];
        var list = getEleByClsName(this.document, 'MathJax');
        utils.each(list, function (di) {
            me._MathJaxList.push(di.cloneNode(true));
        });

        if (list.length) {
            utils.each(list, function (di) {
                var span = di.cloneNode(false);
                span.appendChild(me.document.createTextNode(decodeURIComponent(di.getAttribute('data'))));
                di.parentNode.replaceChild(span, di);
                span.removeAttribute('data');
            });
        }
    });


    me.addListener("aftergetcontent aftersetcontent aftergetscene", function () {
        var list = getEleByClsName(me.document, 'MathJax');
        if (list.length) {
            var i = 0;
            utils.each(list, function (di) {
                di.parentNode.replaceChild(me._MathJaxList[i++], di);
            });
        }
    });
};