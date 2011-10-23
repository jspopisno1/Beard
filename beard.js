/*
    beard.js — mustache successor javascript lib

    !!! REQUIRE jQuery 1.5 or above !!!

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

    * VERSION 0.1 Beta
    *
    * Updates:
    *
    * Liang:    111019 -    beard template compiler, remote loading, ready function, object cache
    *                       configuration tag, prefix to compiled functions, configurable tag attributes
    *                       configurable template syntax
    *                  -    update the configurations, show : remove display: none, log the code anyway...
    *                       make it compatible with 1.4.4,
    *                       using NONE instead of $ as the default.. good for php coding,
    *                       use <@@ @> <@/ @> <@: @>  and  <## #> instead,
    *                       funcPre set as '' by default, capitalise the first char for the func name
    *           111020 -    change <@@ @> <@/ @> <@: @> to [`` `] [`: `] [`/ `], and <## #> to [## #] for readability
    *                       utils : tagFunc() => tag(), search() only for string now
    *                       bug: getting tag when there are some leading spaces
    *                       add .undef for d, if it is undefined
    *                       change !d as d === undefined
    *                       push defineTag() into queue! and clear the tag after re-aisgn
    *                       partial array for js
    *           111021 -    set with(u){}, set out function
    *                       support _seq in object for looping obj in Chrome!!!
    *                       set loop(data, callback, mode, extra)
    *                       print out path, function body in debug mode
    *                       extendUtils()
    *                       fixed potential bug that template tags might overwrite each other
    *                       .clearTagCache( [ keys ] )
    *                       another with(window) for the compiled function
    *                       tag(tag, data), tagFunc(tag) for compiled function
    *                       sort(data, str|func)
    *                       enable support to doT
    *                       log only if canLog || (!canLog && isDebug)
    *           111022 -    remove with for better performance! use another method call dynamic compilation
    *                       refine the lib for future minifying
    *
    *
    * TODO:
    *
    *
    *
 */

;
(function(g, d, undefined){
    if(!g.$){
        var e = new Error('jQuery must be loaded before Beard.js');
        throw e;
    }
    var VERSION = '0.1';

    var $beard;
    $(d).ready(function(){
        // first we need to get the beard template zone and hide it
        $beard = $('#' + BEARD_ZONE);
        if($beard.size() == 0){
            $beard = $('<div id="' + BEARD_ZONE + '"></div>').appendTo('body');
        }
        $beard.css('display', 'none');

        $.fn.extend({
            beardData: function(){
                return this.data('beard-data');
            }
        })
    })

    // ------ var definitions ------
    var BEARD_NODE, BEARD_PATH, BEARD_UNWRAP, BEARD_REMOTE, BEARD_SHOW,
    BEARD_ZONE = 'beards', BEARD_DATA,
    ARRAY = 'array', OBJECT = 'object',


    // selected engine. If it is undefined, the Beard has not been inited
    engineName, funcPre, tmplPrepareFunc, tmplRenderFunc,

    _options = {}, defOpts = {
        // template config
        codeOpen : '[##',
        codeClose : '#]',
        equaOpen : '[``',
        escapeOpen : '[`/',
        tagOpen : '[`:',
        equaClose : '`]',

        // html config
        nodeDef: 'beard',
        nodePath: 'bpath',
        nodeUnwrap: 'bunwrap',
        nodeRemote: 'bremote',
        nodeData: 'bdata',
        nodeShow: 'bshow',
        beardZone: 'beards',
        withinZone: false,

        // compile config
        funcPre: '',
        debug: false,
        safemode: true,
        engine: 'beard'
    },

    isDebug = false, safeMode = true, $debug,
    canLog = typeof console != 'undefined' && typeof console.log == 'function',

    tplTags, ec,
    cmpLength = function(a, b){
        if(a.length > b.length) return -1;
        else if(a.length == b.length) return 0;
        else return 1;
    },
    E = '\x1b', EE = E+E, EEE = EE + E, EEEE = EEE + E,
    rgxTagName = /^[^\(]+/, //, rgxTagArgs = /\s*\(\s*\)\s*/;


    // for the tpls
    Btpls = g.Btpls = {
        __tpls__: [],
        defineTag: function(defs){
            Beard.defineTag(defs);
            return Btpls;
        }
    },

    emptyFunc = function(){
        return ''
    },
    STRING = 'string', FUNCTION = 'function',
    firstRun = true, readyFuncs = [], queueRequest = 0, operationQueue = [],
    tpls = {}, definedTags = {},

    objCache = {}, objSeq = 1, tagFuncCache = {},

    // all rendering funcs
    tmplRenderFuncs = {},

    // all compile funcs
    tmplCompileFuncs = {},

    // all detect funcs
    tmplDetectFuncs = {
        'beard': function(){
            return true;
        }
    },

    // temp vars
    __beard_temp_func__;

    // ------ end of var definitions ------

    var Beard = {
        version: VERSION,
        __tpls: tpls,
        // Load all the templates
        // a template shall locate in #beard_templates and with an attribute data-beard
        // data-beard = { the name of the template }
        // <!--@ @--> will be removed
        //
        // Finally the templates will be loaded into Beard.tpls in a neat hierarchical structure
        // The structure will be based on the structure of tempaltes
        // but data-beard-path can be also be used to set the parent template node explictly
        load: function(callback){

            if(queueRequest > 0){
                return Beard;
            }

            if(!engineName){
                Beard.init();
            }

            if(callback) Beard.ready(callback);
            var loadedRemotes = {};
            _load(firstRun, loadedRemotes);

            firstRun = true;
            return Beard;
        } // end of load ()
        ,
        loadRemote: function(url, options){
            // options : path, isScript, data, callback
            if(options && options.callback){
                Beard.ready(options.callback);
                delete options.callback;
            }
            if(queueRequest > 0){
                operationQueue.push(function(){
                    Beard.loadRemote(url, options);
                })
                return Beard;
            }

            if(options){
                var isScript = options.isScript;
                var path = options.path;
                var data = options.data;
            }
            if(isScript && !path){
                var e = new Error('A path is required for a template string');
                e.type = 'BeardTemplateError';
                throw e;
            }

            $.get(url, data, function(rsp){
                if(isScript){
                    Beard.loadScript(rsp, path);
                } else {
                    Beard.loadHtml(rsp, path);
                }
            }, 'text');
            return Beard;
        },
        loadHtml: function(content, path, callback){
            if(callback){
                Beard.ready(callback);
                delete callback;
            }
            if(queueRequest > 0){
                operationQueue.push(function(){
                    Beard.loadHtml(content, path, callback);
                })
                return Beard;
            }
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
            return Beard;
        },
        loadScript: function(content, path){
            if(queueRequest > 0){
                operationQueue.push(function(){
                    Beard.loadScript(content, path);
                })
                return Beard;
            }
            if(!engineName){
                Beard.init();
            }
            if(engineName == 'beard'){
                f = compileTemplate(content, path);
                if(!path){
                    return f;
                }
            } else {
                tmplPrepareFunc(path, content);

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
            }
            pushFunction(path, f);
            return Beard;
        },
        init: function(option){
            _options = $.extend({}, defOpts, _options, option);
            isDebug = _options.debug;

            engineName = _options.engine;
            if(_options.engine in tmplRenderFuncs){
                tmplPrepareFunc = tmplCompileFuncs[engineName];
                tmplRenderFunc = tmplRenderFuncs[engineName];
            }

            if(!detectTmpl()){
                throw new Error('The selected template engine : <<' + engineName + '>> is not loaded.');
            }

            if(_options.beardZone != BEARD_ZONE){
                BEARD_ZONE = _options.beardZone;
                if($beard){
                    $beard.attr('id', BEARD_ZONE);
                } else {
                    $beard = $('<div id="' + BEARD_ZONE + '"></div>').appendTo('body');
                    $beard.css('display', 'none');
                }
            }

            firstRun = !_options.withinZone;

            BEARD_NODE = _options.nodeDef;
            BEARD_PATH = _options.nodePath;
            BEARD_UNWRAP = _options.nodeUnwrap;
            BEARD_REMOTE = _options.nodeRemote;
            BEARD_SHOW = _options.nodeShow;
            BEARD_DATA = _options.nodeData;

            funcPre = _options.funcPre;

            ec = _options.equaClose;

            tplTags = {};
            tplTags[_options.codeOpen] = ec + E;
            tplTags[_options.equaOpen] = ec + EE;
            tplTags[_options.escapeOpen] = ec + EEE;
            tplTags[_options.tagOpen] = ec + EEEE;
            tplTags[_options.codeClose] = ec;
            tplTags['_seq'] = [_options.codeOpen,_options.equaOpen,
            _options.escapeOpen,_options.tagOpen,
            _options.codeClose];

            tplTags._seq.sort(cmpLength);

            return Beard;
        },
        extendEngines: function(engineRenders, engineCompiles, engineDetects){
            $.extend(tmplRenderFuncs, engineRenders);
            $.extend(tmplCompileFuncs, engineCompiles);
            $.extend(tmplDetectFuncs, engineDetects);
            return Beard;
        },
        extendUtils: function(newUtils){
            utils._edit++;
            $.extend(utils, newUtils);
            return Beard;
        },
        defineTag: function(defs){
            if(queueRequest > 0){
                operationQueue.push(function(){
                    Beard.defineTag(defs);
                });
            }

            $.extend(definedTags, defs);
            Beard.clearTagCache(defs);
            return Beard;
        },
        clearTagCache: function(defs){
            if(defs){
                if(defs instanceof Array){
                    utils.loop(defs, function(tag){
                        delete tagFuncCache[tag];
                    })
                } else {
                    utils.loop(defs, function(_, tag){
                        delete tagFuncCache[tag];
                    })
                }
            } else {
                tagFuncCache = {};
            }
        },
        ready: function(ready){
            if(queueRequest == 0){
                ready(); // if no request queue there, simply run the function
            } else {
                readyFuncs.push(ready);
            }
            return Beard;
        },
        bindData: function(){
            $('[' + BEARD_DATA + ']').each(function(){
                var $t = $(this);
                $t.data('beard-data', objCache[$t.attr(BEARD_DATA)])
                .removeAttr(BEARD_DATA);
            })
            Beard.clearData();
            return Beard;
        },
        bindDataOnly: function(){
            $('[' + BEARD_DATA + ']').each(function(){
                var $t = $(this);
                $t.data('beard-data', objCache[$t.attr(BEARD_DATA)])
                .removeAttr(BEARD_DATA);
            })
            return Beard;
        },
        clearData: function(){
            objCache = {};
            return Beard;
        },
        _recompileTemplate: function(templateFunc, path, data){
            var pts = templateFunc.toString().split('/*\x1b*/');
            var F = eval(['__beard_temp_func__=',pts[0], compileUtils(path), pts[2]].join(''));
            pushFunction(path, F);

            utils.log('recompiled');
            return F(data);
        }
    } // end of Beard object

    function _ready(){
        if(queueRequest > 0){
            return;
        }
        while(true){
            var func = readyFuncs.shift();
            if(func){
                func();
            } else {
                break;
            }
        }
    }

    function _load(firstRun, loadedRemotes){

        var remotes = firstRun? $('[' + BEARD_REMOTE + ']') : $beard.find('[' + BEARD_REMOTE + ']');
        remotes.each(function(){
            var $t = $(this);
            var url = $t.attr(BEARD_REMOTE);
            if(url in loadedRemotes){
                utils._log(url + ' has been loaded.');
                return true;
            }

            loadedRemotes[url] = 1;
            queueRequest++;
            $t.removeAttr(BEARD_REMOTE);
            $.ajax({
                url: url,
                dataType: 'text',
                complete: function(){
                    queueRequest--;
                    if(queueRequest == 0)
                        _load(firstRun, loadedRemotes);
                },
                success: function(remoteTemplate){
                    $t.html(remoteTemplate);
                }
            })
        })

        if(queueRequest == 0){
            var beards = firstRun? $('[' + BEARD_NODE + ']') : $beard.find('['+ BEARD_NODE + ']');
            var finalBeards = [];
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

                var show = $t.attr(BEARD_SHOW)
                if(show !== undefined && show !== false){
                    $t.css('display', '');
                    $t.removeAttr(BEARD_SHOW);
                }

                $t.removeAttr(BEARD_NODE)
                .removeAttr(BEARD_PATH)
                .removeAttr(BEARD_REMOTE);

                var unwrap = $t.attr(BEARD_UNWRAP);
                if(unwrap !== undefined && unwrap !== false){
                    $t.removeAttr(BEARD_UNWRAP)
                } else {
                    $t = $t.wrap('<div></div>').parent()
                    .data('beard-path', $t.data('beard-path'));
                }
                $t.appendTo($beard);
                finalBeards.push($t[0]);
            })

            $.each(finalBeards, function(){

                // compile all the templates into Btpls
                var $t = $(this);
                var path = $t.data('beard-path');

                var template = $t.html()
                // remove the <!--@ @--> annotation
                .split('<!--@').join('').split('@-->').join('')
                // replace special chars
                .split('&lt;').join('<').split('&gt;').join('>').split('&amp;').join('&');


                if(engineName == 'beard'){
                    f = compileTemplate(template, path);
                } else {
                    tmplPrepareFunc(path, template);

                    var f = function(data, extra){
                        try{
                            return tmplRenderFunc(path, data, extra, arguments.callee);
                        } catch(e){
                            e.type = 'BeardTemplateError';
                            e.path = path;
                            e.func = arguments.callee;
                            utils.log(tpls[path]);
                            throw e;
                        }
                    }
                }
                pushFunction(path, f);
            })

            // empty the beard zone
            $beard.html('');

            while(true){
                var nextOp = operationQueue.shift();
                if(nextOp){
                    nextOp();
                } else {
                    break;
                }
            }

            // and finally call all ready functions
            _ready();
        }
    }


    function pushFunction(path, f, target, levels, index){
        if(!levels){
            levels = path.split('.');
            index = 0;
            target = Btpls;
        }

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

        var tmp = levels[index];
        var currLevel = funcPre + tmp.charAt(0).toUpperCase() + tmp.slice(1);

        // during with the internal nodes
        if(currLevel in target){
            target[currLevel] = pushFunction(path, f, target[currLevel], levels, index+1);
        } else {
            target[currLevel] = pushFunction(path, f, null, levels, index+1);
            target.__tpls__.push(currLevel);
        }
        return target;
    }

    var UNDERSCORE = '_';
    function compileUtils(path){
        var code = ['/*\x1b*/\nif(u._edit>', utils._edit, '){return Beard._recompileTemplate(t, "', path, '", d)}'];

        utils.loop(utils, function(_, func){
            if(func.charAt(0) != UNDERSCORE){
                code.push('\nfunction ', func, '(){return u.', func,'.apply(u, arguments)}')
            }
        })

        code.push('/*\x1b*/');
        return code.join('');
    }

    function compileTemplate(template, path){
        var pts = template;
        utils.loop(tplTags, function(val, key){
            pts = pts.split(key).join(val);
        })

        pts = pts.split(ec);

        var PLAIN_HTML_1 = "o[o.length]='";
        var TAG_1 = "o[o.length]=tagFunc('";
        var ESC_1 = "o[o.length]=esc(";
        var EXPRE_1 = "o[o.length]=";
        var THROW_1 = "_log(e.message + ' @ ";

        var code = [];
        for(var i = 0, len = pts.length; i < len; i ++){
            var pt = pts[i];
            if(pt.charAt(0) !== E){
                // it is a plain html text
                code.push(PLAIN_HTML_1,
                    pt.replace(/(\\|')/g, '\\$1').split('\n').join('\\n'),
                    "';\n");
            } else {
                if(pt.charAt(1) === E){
                    var ptStr = pt.replace(/^\x1b+/, '');
                    if(safeMode) {
                        code.push('try{');
                    }
                    if(pt.charAt(2) === E){
                        if(pt.charAt(3) === E){
                            // a tag
                            var match = rgxTagName.exec(ptStr);
                            if(match){
                                var tagName = match[0];
                                var tagArgs = ptStr.substr(tagName.length);
                                code.push(TAG_1,
                                    $.trim(tagName).replace(/(\\|')/g, '\\$1').split('\n').join('\\n'),
                                    "')",$.trim(tagArgs) == ''? '()': tagArgs, ";\n");
                            }
                        } else {
                            // the content needs escaped
                            code.push(ESC_1,
                                ptStr,
                                ");\n");
                        }
                    } else {
                        // the expression to be exported to output
                        code.push(EXPRE_1,
                            ptStr,
                            ";\n");
                    } // end of equal test
                    if(safeMode){
                        code.push('}catch(e){',
                            isDebug? THROW_1 +
                            ptStr.replace(/(\\|')/g, '\\$1').split('\n').join('\\n') +
                            "')}\n":'}\n');
                    } else {
                        code.push('\n')
                    }
                } else if(pt){
                    // it is plain javascript code
                    code.push(pt.substr(1), '\n');
                }
            }
        } // end of all parts of template code

        code = code.join('')
        .split(["o[o.length]='';\n"].join('')).join('')
        .replace(/try{}catch\(e\){.*?}\n/g, '');

        code = ['if(d===undefined||d===null){d={};var undef=true;}var u=Beard.utils,o=[],t=arguments.callee;function out(){o.push.apply(',
        'o, arguments);}function tag(tag, data){out(u.tagFunc(tag)(data))}',
        compileUtils(path),
        'try{',
        code,
        ';return o.join("");}catch(e){e.type="BeardTemplateError";e.templFunc=arguments.callee;u.log(arguments.callee.toString());throw e;}'
        ].join('');

        try{
            var F = new Function('d', code);
            if(isDebug){
                utils.log('---- SUCCESS: The compiled function for template <<' + path + '>> : ---- \n\n');
                utils.log(F.toString());
            }
            return F;
        } catch(e) {
            e.type = 'BeardTemplateCompileError';
            e.msg = 'The template cannot be compiled.';
            e.funcString = code;
            utils.log('---- FAILED: The compiled function for template <<' + path + '>> : ---- \n\n',
                'function(){' + code + '}'); // log the code anyway..
            throw e;
        }
    }

    function detectTmpl(){
        if(engineName == 'beard'){
            return true;
        }
        if(engineName in tmplDetectFuncs){
            if(tmplDetectFuncs[engineName]())
                return true;
        }
        return false;
    }

    var utils = Beard.utils = {
        _edit: 0,
        // data attribute
        data: function(obj){
            if(obj !== null && obj !== undefined){
                if(typeof obj == 'object'){
                    if(obj._objid_){
                        var id = obj._objid_;
                    } else {
                        id = obj._objid_ = objSeq ++;
                        objCache[id] = obj;
                    }
                } else {
                    id = objSeq ++;
                    objCache[id] = obj;
                }
                return [BEARD_DATA, '="', id, '"'].join('');
            } else {
                return '';
            }
        },
        esc: function(str){
            if(str !== null && str !== undefined){
                return str.toString()
                .split('&').join('&amp;')
                .split('<').join('&lt;')
                .split('>').join('&gt;')
                .split('\'').join('&#39;')
                .split('"').join('&#34;')
            } else {
                return '';
            }
        },
        _log: function(msg){
            if(isDebug){
                utils.log.apply(this, arguments);
            }
        },
        log: function(msg){
            if(!isDebug && !canLog)return;
            if(canLog){
                console.log.apply(console, arguments);
            } else {
                if(!$debug){
                    $debug = $('<div id="debug"></div>');
                    $('body').append($debug);
                }
                if(msg){
                    $('<div></div>').appendTo($debug)[0].innerText = '\n' + msg.toString();
                }
            }
        },
        tagFunc: function(funcKey){
            if(funcKey in definedTags){
                var f = definedTags[funcKey];
                if(typeof f == STRING){
                    if(funcKey in tagFuncCache){
                        return tagFuncCache[funcKey];
                    } else {
                        return tagFuncCache[funcKey] = this._getGlobalTagFunc(f.split('.'), 0, f, funcKey);
                    }
                } else if (typeof f == FUNCTION){
                    return f;
                } else {
                    utils._log(funcKey + ' is found in defined tags as "' + f + '", but it is not a valid callable object.');
                    return emptyFunc;
                }
            } else {
                utils._log(funcKey + ' is not a defined tag.');
                return emptyFunc;
            }
        },
        _getGlobalTagFunc: function(keys, index, f, funcKey, target, len){
            if(!len){
                len = keys.length;
                target = g;
            }
            if(target == null){
                utils._log(funcKey + ' is found in defined tags as "' + f + '", but it is not found in the global context.');
            }
            if(index == len){
                if(target) return target;
                else{
                    utils._log(funcKey + ' is found in defined tags as "' + f + '", but it is not found in the global context.');
                    return emptyFunc;
                }
            }

            return this._getGlobalTagFunc(keys, index + 1, f, funcKey, target[keys[index]], len);
        },
        loop: function(data, callback, mode, extra){

            if(typeof callback != 'function' || data === null || data === undefined){
                return false;
            }
            if(mode == ARRAY || data instanceof Array){
                for(var k = 0, len = data.length; k < len; k ++){
                    var ret = callback(data[k], k, data, extra);
                    if(ret === false) return 'break';
                }
            } else if(mode == OBJECT || data && typeof data == OBJECT){
                if(data._seq){
                    var seq = data._seq;
                    for(k = 0, len = seq.length; k < len; k++){
                        var key = seq[k];
                        ret = callback(data[key], key, data, extra);
                        if(ret === false) return 'break';
                    }
                } else {
                    for(k in data){
                        if(data.hasOwnProperty(k)){
                            ret = callback(data[k], k, data, extra);
                            if(ret === false) return 'break';
                        }
                    }
                }
            } else {
                callback(data, null, data, extra);
            }

            return true;
        },
        search: function(target, needle){
            if(target === undefined || target === null || target === false) {
                return false;
            }
            // currently only support searching in string
            if(typeof target != 'string'){
                return false;
            }
            return target.indexOf(needle) + 1;
        },
        partial: function(source, target, keys, removeOld){
            utils.loop(keys, function(to, from){
                if(typeof from == 'number'){
                    target[to] = source[to];
                    if(removeOld){
                        delete source[to];
                    }
                }else {
                    target[to] = source[from];
                    if(removeOld){
                        delete source[from];
                    }
                }
            })
            return target;
        }
    }

    g.Beard = Beard;

})(window, document)
