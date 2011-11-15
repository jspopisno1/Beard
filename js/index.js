;
(function(g, d, undefined){

    var htmlEd, jsEd, dataEd, resEd, u = Beard.utils,
    jqr;

    $(document).ready(function(){
        initPage();
    })

    function initPage(){
        initVars();
        initElems();
        initEvents();

        loadCase();
        recompile()

    }

    var timer;
    function secTop($sec){
        $('body').scrollTop($sec.parent().position().top - 5) ;
//        var $p = $sec.parent();
//        $p.animate({
//            'height': 'toggle',
//            'opacity': 'toggle'
//        }, {
//            duration:300,
//            complete: function(){
//                $p.prependTo(jqr.edContainer)
//                .animate({
//                    'height': 'toggle',
//                    'opacity': 'toggle'
//                }, {
//                    duration: 500
//                })
//            }
//        })
    }
    
    function recompile(){
        clearTimeout(timer);
        resEd.setValue('----- Re-run the Case -----');
        timer = setTimeout(function(){
            Beard.reset().init({
                debug: false
            });
            try{
                Beard.$beard().html($(htmlEd.getValue()));
            } catch(e){
                
            }
            try{
                var $result = jqr.resHtml
                $result.undelegate();
                $result.html('');
                var result = '<<< You should assign the result to the variable : result >>>';
                eval(jsEd.getValue());
                eval(dataEd.getValue());
                if(typeof result == 'string'){
                    resEd.setValue(result);
                    jqr.resHtml.html(result);
                } else {
                    resEd.setValue('<<< the result variable is not a string >>>')
                }
                $q = $result;
            } catch(e){
                resEd.setValue("The html cannot be generated due to the error : " + e.message);
                jqr.resHtml.html('');
            }
            if(Beard.isDebug()){
                jqr.debugToggler.html('debug on');
            } else {
                jqr.debugToggler.html('debug off');
            }
        }, 800);
    }

    var initVars = function(){
        jqr = {
            edContainer : $('#editors .editor-container'),
            content: $('#content'),
            resHtml : $('.editor.result-html'),
            resEd : $('.editor.result'),
            htmlEd : $('.editor.html'),
            jsEd : $('.editor.js'),
            dataEd : $('.editor.data'),
            descr : $('#content .description'),
            debugToggler : $('#content .debug.link-text'),
            tabs: $('#content .tabs')
        }
    }

    function initElems(){
        // init menu
        Beard.init({
            dataMode: false,
            debug: false
        }).load();

        // init all the editors

        htmlEd = CodeMirror.fromTextArea(document.getElementById("htmlEd"), {
            mode: "application/xml",
            lineNumbers: true,
            onCursorActivity: function() {
                htmlEd.setLineClass(htmlEdLine, null);
                htmlEdLine = htmlEd.setLineClass(htmlEd.getCursor().line, "activeline");
            },
            onBlur: recompile
        });
        var htmlEdLine = htmlEd.setLineClass(0, "activeline");
        jsEd = CodeMirror.fromTextArea(document.getElementById("jsEd"), {
            mode: "javascript",
            lineNumbers: true,
            onCursorActivity: function() {
                jsEd.setLineClass(jsLine, null);
                jsLine = jsEd.setLineClass(jsEd.getCursor().line, "activeline");
            },
            onBlur: recompile
        });
        var jsLine = jsEd.setLineClass(0, "activeline");
        dataEd = CodeMirror(document.getElementById("dataEd"), {
            mode: "javascript",
            lineNumbers: true,
            onCursorActivity: function() {
                jsEd.setLineClass(dataLine, null);
                dataLine = jsEd.setLineClass(jsEd.getCursor().line, "activeline");
            },
            onBlur: recompile
        });
        var dataLine = jsEd.setLineClass(0, "activeline");
        resEd = CodeMirror(document.getElementById("resEd"), {
            mode: "application/xml",
            lineNumbers: false,
            readOnly: "nocursor"
        });
    }

    var initEvents = function(){
        var events = { }
        var c = events.main = {
            ':#navigate': {
                'li:has(li) a': function(){
                    var $t = $(this);
                    $t.next().slideToggle();
                },
                'li li a': function(){
                    loadCase();
                }
            },
            ':#content': {
                '.descr-hide.link-text@:bind': function(){
                    var $t = $(this);
                    var $p = $t.parent().prev();
                    if($t.html() == 'show description'){
                        $t.parent().prev().animate({
                            'height': $p.data('height')
                        }, {
                            complete: function(){
                                $p.css('height', '')
                            }
                        })
                        $t.html('hide description');
                    } else {

                        $p.data('height', $p.height());
                        $p.animate({
                            'height': 20
                        })
                        $t.html('show description');
                    }
                },
                '.debug.link-text@:bind': function(){
                    var $t = $(this);
                    if($t.html() == 'debug off'){
                        Beard.init({
                            debug: true
                        })
                        $t.html('debug on');
                    } else {
                        $t.html('debug off');
                        Beard.init({
                            debug: false
                        }).$debug().html(''); //***
                    }

                },
                '.editor-header@:bind': function(){
                    $(d).scrollTop(jqr.tabs.position().top - 10);
                },
                '.top .link-text@:bind': function(){
                    $(d).scrollTop(0);
                },
                ':.tabs' : {
                    'li@:bind': function(){
                        var id = this.id.replace(/^tab_/, ''), $t = $(this);
                        if(id == 'reset'){

                            var $e = jqr.edContainer;
                            var $c = jqr.content.css('height', $e.height() + 'px');
                            $e.slideUp(1000, function(){
                                jqr.htmlEd.parent().appendTo($e);
                                jqr.jsEd.parent().appendTo($e);
                                jqr.dataEd.parent().appendTo($e);
                                jqr.resEd.parent().appendTo($e);
                                jqr.resHtml.parent().appendTo($e);
                                $e.slideDown(1000, function(){
                                    $c.css('height', 'auto');
                                });
                            })
                        } else{
                            secTop(jqr[id]);
                        }
                    }
                }
            }
        }

        g.onhashchange = function(){
            loadCase();
        }
        Beard.initEvents(c);
    }

    var caseTimer;
    function loadCase(){
        // html | data | js | description
        clearTimeout(caseTimer);
        caseTimer = setTimeout(function(){
            var key = g.location.hash;
            if(!key || !(key = key.substr(6))) {
                key ='helloworld';
            }
            $.ajax({
                url: 'examples/' + key + '?' + caseVer,
                success: function(rsp){
                    var tmp = rsp.split('***');
                    jqr.descr.html(tmp[0]?$.trim(tmp[0]):'');
                    htmlEd.setValue(tmp[1]?$.trim(tmp[1]):'');
                    jsEd.setValue(tmp[2]?$.trim(tmp[2]):'');
                    dataEd.setValue(tmp[3]?$.trim(tmp[3]):'');
                    recompile();
                },
                dataType: 'text',
                error: function(){
                    htmlEd.setValue('This example is still under construction.');
                    jsEd.setValue('// This example is still under construction.');
                    dataEd.setValue('result = "This example is still under construction."');
                    jqr.descr.html('The case "' + key + '" cannot be found. <p> Please choose another case from the menu.');
                },
                complete: function(){
                    recompile();
                }
            })
        }, 300)
    }
    
})(window, document);

