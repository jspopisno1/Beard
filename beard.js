/*
    beard.js — mustache successor javascript lib

    The MIT License

    Copyright (c) 2011 Liangliang Zheng (jsPop)

    Permission is hereby granted, free of charge, to any person obtaining
    a copy of this software and associated documentation files (the
    "Software"), to deal in the Software without restriction, including
    without limitation the rights to use, copy, modify, merge, publish,
    distribute, sublicense, and/or sell copies of the Software, and to
    permit persons to whom the Software is furnished to do so, subject to
    the following conditions:

    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
    LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
    OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
    WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

;
(function(g, d){
    if(!g.$){
        var e = new Error('jQuery must be loaded before Beard.js');
        throw e;
    }
    
    // first we need to get the beard template zone and hide it
    var $beard;
    $(d).ready(function(){
        $beard = $('#beardTemplates');
        if($beard.size() == 0){
            $beard = $('<div id="beardTemplates></div>').appendTo('body');
        }
        $beard.css('display', 'none');
    })


    var Beard = function(){

        var BEARD_NODE = 'data-beard';
        var BEARD_PATH = 'data-beard-path';

        function pushFunction(path, f, target, levels, index){
            if(!levels){
                levels = path.split('.');
                index = 0;
                target = Btpls;
            }

            var currLevel = levels[index];

            if(index == levels.length){
                // reach the leaf level
                if(target !== null){
                    var tpls = f.__tpls__ = target.__tpls__;
                    for(var i = 0; i < tpls.length; i++){
                        f[tpls[i]] = target[tpls[i]];
                    }
                } else {
                    f.__tpls__ = [];
                }
                return f;
            } else if(target === null){
                target = {
                    __tpls__: []
                };
            }

            // during with the internal nodes
            if(currLevel in target){
                target[currLevel] = pushFunction(path, f, target[currLevel], levels, index+1);
            } else {
                target[currLevel] = pushFunction(path, f, null, levels, index+1);
                target.__tpls__.push(currLevel);
            }
            return target;
        }

        return {
            // Load all the templates
            // a template shall locate in #beard_templates and with an attribute data-beard
            // data-beard = { the name of the template }
            // <!--@ @--> will be removed
            //
            // Finally the templates will be loaded into Beard.tpls in a neat hierarchical structure
            // The structure will be based on the structure of tempaltes
            // but data-beard-path can be also be used to set the parent template node explictly
            load: function(){
                if(!detectTmpl()){
                    throw new Error('The selected template engine : <<' + selectedEngine + '>> is not loaded.');
                }

                var tmplPrepareFunc = tmplPrepareFuncs[selectedEngine];
                var tmplRenderFunc = tmplRenderFuncs[selectedEngine];

                var beards = $beard.find('['+ BEARD_NODE + ']');
                beards
                .each(function(){

                    // first try the defined path
                    var $t = $(this);
                    var path = $t.attr(BEARD_PATH);
                    if(path === undefined){
                        var $p = $t.parent().closest('['+ BEARD_NODE + ']');
                        var parent = $p.data('beard-path');
                        path = (parent? parent+ '.':'' ) + $t.attr(BEARD_NODE);
                    } else {
                        path = (path?path + '.':'') + $t.attr(BEARD_NODE);
                    }
                    $t.data('beard-path', path);
                })
                .each(function(){

                    // move all the templates to the top level
                    var $t = $(this);
                    $t.removeAttr(BEARD_NODE, false)
                    .removeAttr(BEARD_PATH, false);
                    $t.appendTo($beard);
                })
                .each(function(){

                    // compile all the templates into Btpls
                    var $t = $(this);
                    var path = $t.data('beard-path');

                    var template = $t.html()
                    // remove the <!--@ @--> annotation
                    .split('<!--@').join('').split('@-->').join('')
                    // replace special chars
                    .split('&lt;').join('<').split('&gt;').join('>').split('&amp;').join('&');

                    tmplPrepareFunc(path, template);

                    var f = function(data){
                        try{
                            return tmplRenderFunc(path, data);
                        } catch(e){
                            e.type = 'BeardTemplateError';
                            e.path = path;
                            e.func = arguments.callee;
                            throw e;
                        }
                    }

                    pushFunction(path, f);
                })

                $beard.html('');
            } // end of load ()
            ,
            loadRemote: function(url, options, callback){
                if(options){
                    var isScript = options.isScript;
                    var path = options.path;
                    var data = options.data;
                }
                if(isScript && !path){
                    var e = new Error('A name is required for a template string');
                    e.type = 'BeardTemplateError';
                    throw e;
                }

                $.get(url, data, function(rsp){
                    if(isScript){
                        Beard.loadScript(rsp, path);
                    } else {
                        Beard.loadHtml(rsp, path);
                    }
                    if(typeof callback == 'function'){
                        callback(rsp);
                    }
                }, 'text')
            },
            loadHtml: function(content, path){
                $beard.html(content);
                if(path){
                    $beard.find('[' + BEARD_PATH + ']').each(function(){
                        var $t = $(this);
                        $t.attr(BEARD_PATH, path + $t.attr(BEARD_PATH));
                    })
                    $beard.find('['+BEARD_NODE+']:not(['+BEARD_PATH+'])').each(function(){
                        $(this).attr(BEARD_PATH, path);
                    })
                }
                this.load();
            },
            loadScript: function(content, path){
                if(!path){
                    var e = new Error('A name is required for a template string');
                    e.type = 'BeardTemplateError';
                    throw e;
                }
                var levels = path.split('.');
                var leaf = levels.pop();
                path = levels.join('.');

                $beard.html($('<div '+ BEARD_NODE + '="' + leaf + '" ' + BEARD_PATH+'="' + path + '"><!--@'+content + '@--></div>'));
                this.load();
            },
            init: function(engineName){
                if(engineName in tmplRenderFuncs){
                    selectedEngine = engineName;
                }
                return Beard;
            }
        }
    }();

    // default selected engine
    var selectedEngine = 'mustache';

    // all rendering funcs
    var tmplRenderFuncs = {
        'mustache': function(path, data){
            return Mustache.to_html(tpls[path], data);
        }
        ,
        'doT' :function(path, data){
            return tpls[path](data);
        }
        ,
        'jQote2' :function(path, data){
            return $.jqote(tpls[path], [data]);
        }
        ,
        'Yajet' :function(path, data){
            return tpls[path](data);
        }
    }

    // all preparing funcs
    var tmplPrepareFuncs = {
        'mustache': function(path, template){
            tpls[path] = template;
        }
        ,
        'doT': function(path, template){
            tpls[path] = g.doT.template(template);
        }
        ,
        'jQote2': function(path, template){
            tpls[path] = $.jqotec(template);
        }
        ,
        'Yajet': function(path, template){
            var yajet = new YAJET({
                with_scope: false
            });
            tpls[path] = yajet.compile(template);
        }
    }

    function detectTmpl(){
        switch(selectedEngine){
            case 'mustache':
                if(typeof Mustache != 'undefined' && typeof Mustache.to_html == 'function')
                    return true;
                break;
            case 'doT':
                if(typeof g.doT != 'undefined' && typeof g.doT.template == 'function')
                    return true;
                break;
            case 'jQote2':
                if(typeof $.jqotec == 'function')
                    return true;
                break;
            case 'Yajet':
                if(typeof g.YAJET == 'function')
                    return true;
                break;
        }
        return false;
    }
    
    g.Beard = Beard;
    var Btpls = g.Btpls = {
        __tpls__: []
    };
    var tpls = {};
    Beard.__tpls = tpls;

})(window, document)
