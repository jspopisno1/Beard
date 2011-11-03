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
     *                       enabling loadScript() to just return the compiled function
     *                       moving sort() to beardExt.js
     *                       enable safe mode
     *                       partial -> hmmm it should be // to : from or <<numeric>>:from&to //
     *           111024 -    removing <!--@\s*, --!>\s*
     *                       ------ context for defined tags ??? re-think the value of context, user defined tag
     *           111025 -    !IMPORTANT the ability to debug
     *                       ------ bTie | bRefresh -> will use BeardNode instead
     *                       replace spaces into single blank space before open-tag & after close-tag
     *                       ------ undefined for loop -> no data
     *           111026 -    ------ Function.length ( will not use context
     *                       ------ var args = Array.prototype.slice.call(arguments);
     *                       enable extra object at the bottom
     *                       narrow down the bind data scope
     *                       ------ $.fn b - Html, Append, Prepend, After, Before, Replace
     *                       --- further test require for $.fns
     *                       str() for string concatenation
     *                       enable loop to return break info & how many time it runs
     *                       --- better design of data binding !! ~
     *                           1. bind() => beard-data='1' beard-name='Tr' beard-path='UserTable'
     *                           2. beardfunc.__pre
     *                           3. beardfunc.__post
     *                           4. wrap data into BeardNode and bind it to $node
     *                               BeardNode:
     *                               .refresh( d, e [or the user-defined arg list] ) .pre( [func] ) .post( [func] ) .beard( [path] )
     *                               .refresh -> this.pre()( this.$(), oldData, newData ), html = this.beard()( new d, e, ... ),
     *                                   var $new = $(html), this.$().after($new), this.rebind($new),
     *                                   this.post()( this.$(), oldData, newData ) -> finished
     *                               .$() .rebind() .data() .remove()
     *                           5. $.fn.remove -> check if has beardNode bound remove it or remove itself
     *                           6. $.fn.loopup( beard name, beard path )
     *                               <!--#UserTable.Tr(4)--> ==> the Beard Node
     *                               some thing
     *                               elem 2
     *                               elem 1
     *                               lalala
     *                               <!--/UserTable.Tr(4)--> ==> the Beard open comment
     *                           7. $.fn.prevComment(), $.fn.findAll()
     *                           ------ 8. $(<!-- -->) can contains data as well -> will not use <!-- to determin the node -->
     *                           9. div.innerHTML = html, $( div.childNodes )
     *                           10. BeardNode .children .parent .removeChild() .after() .before() .clone()
     *                       --- compiled beard func => f.pre = ext.pre, f.post = ext.post
     *                       --- * /UserTr/Img BeardNode .children()
     *                       ooo text node cannot bind event
     *           111030 -    is() & !is()
     *                       rewrite the compileTemplate() with another logic
     *                       should restrict to div[beard] instead of allowing any kind of element
     *                       ensure that ready() will only be called after the dom is ready
     *                       refine debug mode
     *                       user-defined args list for the compiled function
     *                       ref -> Btpls function, data, string '=content'; t.r.{ref name}
     *                           ../button | ./tr1/button | user/form/table/button
     *                           -> SomeFunc()
     *                       *** delegate -> 'delegate key' '>delegate'; t.d.{delegate name}()
     *                           -> _someFunc()
     *           111031 -    --- path -> from . to /
     *                       short cut for path
     *                       support json for loadScript()
     *                           { 'funcname(args)->c:NewFunc.Sub#b' : {
     *                              'yep.subFunc#a(args)' : {
     *                                  '': ' ---- CODE ---- ',
     *                                  'subSubFunc' : ' ---- CODE ---- ',
     *                                  }
     *                               },
     *
     *                             'refFunc->a:' : {
     *                             }
     *                           }
     *
     *                           ==> '': {t: p: a: r:}
     *                       compileUtils -> support obj & other types
     *                       fixed _recompileFunction to work with the new push function
     *          111101 -     .p() for going up to the parent tpl
     *                       remove support to other engines
     *                       disable the anonymous template function to be pushed to the template tree when re-compiling
     *          111102 -     refining the operation queue
     *                       further refining debuging
     *                       create parseHtml() for parsing the html into jquery object with data bound
     *                       correct the order of operation queue
     *                       set bind as ('name', object)
     *                       wrap data (input,select,hidden,textarea,checkbox,radio, elems with beard-nodename & data.value)
     *                       use loadScript as Core function to compile the template TREE
     *
     *
     * TODO:                 *** START
     *                       *** examples for testing
     *                       *** comment tag
     *
     *
     * CANCEL:               --- START
     *                       --- t.p() -> getting the parent level tpl, p(1), p(2), p(), p('afftable')
     *                       --- http://stackoverflow.com/questions/4578424/javascript-extend-a-function
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


        })

    ;
    (function(){
        function extendJQueryMethod(){
            $.fn.extend({
                beardData: function(){
                    return this.data('beard-data');
                },
                bVal: function(val){
                    return this.data('beard-value', val);
                },
                beardWrapData: function(){
                    var data = {};
                    this.find('select,input,textarea').each(function(){
                        var $t = $(this);
                        var name = $t.attr('name')||$t.attr('id');

                        if($t.is(':checkbox')){
                            if($t.is(':checked')){
                                data[name] = true;
                            } else {
                                data[name] = false;
                            }
                        } else if($t.is(':radio')){
                            if($t.is(':checked')){
                                data[name] = $t.val();
                            }
                        } else {
                            data[name] = $t.val();
                        }
                    });

                    this.find('[data-beard-name]').each(function(){
                        var $t = $(this);
                        var name = $t.attr('data-beard-name');
                        if(!name){
                            return true;
                        }
                        if(name in data && !(data[name] instanceof Array)){
                            data[name] = [data[name]];
                        }
                        if(name in data){
                            data[name].push($t.bVal());
                        } else {
                            data[name] = $t.bVal();
                        }
                    })
                    return data;
                },
                beardDataUp: function(name){
                    return this.lookUp(name).data('beard-data');
                },
                beardDataDown: function(name){
                    return this.lookDown(name).data('beard-data');
                },
                beardBind: function(){
                    Beard.bindData(this);
                    return this;
                },
                beardHtml: function(html){
                    return this.html(Beard.parseHtml(html));
                },
                beardReplace: function(html){
                    html = Beard.parseHtml(html);
                    this.after(html).remove();
                    return html;
                },
                beardBefore: function(html){
                    return this.before(Beard.parseHtml(html));
                },
                beardAfter: function(html){
                    return this.after(Beard.parseHtml(html));
                },
                beardNextUntil: function(name){
                    if(name){
                        var sel = '[data-beard-name="' + name + '"]';
                    } else {
                        sel = '[data-beard-name]';
                    }
                    return this.nextUntil(sel).add(this);
                },
                lookFor: function(name, up){
                    if(name){
                        var sel = '[data-beard-name="' + name + '"]';
                        var psel = '[data-beard-name="' + name + '"]:eq(0)';
                    } else {
                        sel = '[data-beard-name]';
                        psel = '[data-beard-name]:eq(0)';
                    }
                    var ret;

                    if(up)ret = this.prevAll(psel);
                    else ret = this.nextAll(psel);
                    if(ret.size()) return ret;

                    this.parents().each(function(){
                        var $t = $(this);
                        if(up && $t.filter(sel).size()){
                            ret = $t;
                            return false;
                        }
                        if(up)ret = $t.prevAll(psel);
                        else ret = $t.nextAll(psel);
                        if(ret.size()) return false;
                    })
                    return ret;
                },
                lookUp: function(name){
                    return this.lookFor(name, true);
                },
                lookDown: function(name){
                    return this.lookFor(name, false);
                },
                eventAll: function(){
                    return function(events){
                        eventAll(events, '', this);
                    }
                }()
            })
        }

        extendJQueryMethod();
    })()

    // ------ var definitions ------
    var BEARD_NODE, BEARD_PATH, BEARD_UNWRAP, BEARD_REMOTE, BEARD_SHOW,
    BEARD_ZONE = 'beards', BEARD_DATA, BEARD_ARGS,
    ARRAY = 'array', OBJECT = 'object',


    // selected engine. If it is undefined, the Beard has not been inited
    engineName,

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
        nodeArgs: 'bargs',
        nodeRef: 'bref',
        nodeDel: 'bdel',
        beardZone: 'beards',
        withinZone: false,

        // compile config
        debug: false,
        safemode: true,
        engine: 'beard'
    },

    isDebug = false, safeMode = true, $debug, locIndex = 0,
    canLog = typeof console != 'undefined' && typeof console.log == 'function',
    rgxKey = /^\s*(?:([^\:]+)\:)?([^#\(]*)(?:#([^\(]+))?(?:\(([^\)]*)\))?\s*/,

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
        __tpls__: []
    },

    emptyFunc = function(){
        return ''
    },
    STRING = 'string', FUNCTION = 'function',
    firstRun = true, readyFuncs = [], operationQueue = [],
    tpls = {}, definedTags = {}, withInZone,

    objCache = {}, objSeq = 1, tagFuncCache = {}, hasDataCached = false,

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
            if(!$beard || !$beard.size()){
                Beard.init();
            }

            if(callback) Beard.ready(callback);
            _load();

            firstRun = false;
            withInZone = false;
            return Beard;
        } // end of load ()
        ,
        loadRemote: function(url, options, _run){

            if(!_run){
                if(options && options.callback){
                    var callback = options.callback;
                    delete options.callback;
                }
                pushOp(function(){
                    Beard.loadRemote(url, options, 1);
                })
                // options : path, type[ json|html|text ], data, callback
                if(callback) Beard.ready(callback);
                return Beard;
            }

            if(options){
                var type = options.type;
                var path = options.path;
                var data = options.data;
            }

            switch(type){
                case 'json':
                    $.ajax({
                        url: url,
                        data: data,
                        success: function(rsp){
                            Beard.loadScript(rsp, path, 2);
                        },
                        dataType: 'json',
                        complete: function(){
                            nextOp();
                        }
                    })
                    break;
                default:
                    $.ajax({
                        url: url,
                        data: data,
                        success: function(rsp){
                            if(type == 'text'){
                                Beard.loadScript(rsp, path, 2);
                            } else {
                                Beard.loadHtml(rsp, path, 2);
                            }
                        },
                        dataType: 'text',
                        complete: function(r, s){
                            nextOp();
                        }
                    })
                    break;
            }
            return Beard;
        },
        loadHtml: function(content, path, _run){
            if(!_run){
                pushOp(function(){
                    Beard.loadHtml(content, path, 1);
                })
                return Beard;
            }
            $beard.html(content);
            if(path){
                $beard.find('[' + BEARD_PATH + ']').each(function(){
                    var $t = $(this);
                    $t.attr(BEARD_PATH, path + '.' + $t.attr(BEARD_PATH));
                })
                $beard.find('['+BEARD_NODE+']:not(['+BEARD_PATH+'])').each(function(){
                    $(this).attr(BEARD_PATH, path);
                })
            }
            this.load();
            if(_run == 1) nextOp();
            return Beard;
        },
        loadScript: function(content, path, _run){
            if(!_run){
                pushOp(function(){
                    Beard.loadScript(content, path, 1);
                })
                return Beard;
            }
            if(!$beard || !$beard.size()){
                Beard.init();
            }


            if(typeof content == 'string'){
                if(!path){
                    nextOp();
                    return compileTemplate(content, '');
                } else {
                    if(typeof path == 'string'){
                        var cf = {};
                        var tmp = path.split('->');
                        parseJsonPathStr(tmp[0], cf, 'p', sc, '');
                        if(1 in tmp){
                            parseJsonPathStr(tmp[0], cf, 'r', sc, '');
                        }
                    } else {
                        cf = path;
                    }
                    if(!cf.r){
                        var f = compileTemplate(content, cf.p, cf.a);
                    } else {
                        f = getTplFunction(cf.r);
                    }
                    tmp = cf.p.split('.');
                    pushFunction(cf.p, tmp[tmp.length - 1], f, cf.r);
                }
            } else if(typeof content == 'object' && content != null){
                var sc = {};
                var idx = 0;
                while(true){
                    var res = prepareJsonTpls(content, sc, idx, idx, '');
                    if(!res){
                        throw 'There is cross-ref keys in the tpls path shortcut.';
                    } else if(res == 2){
                        break;
                    }
                    idx ++
                }
                loadEachScript(content);
                utils.log(content);
            }
            if(_run == 1) nextOp();
            return Beard;
        },
        init: function(option){
            _options = $.extend({}, defOpts, _options, option);
            isDebug = _options.debug;

            engineName = _options.engine;

            if(!$beard || !$beard.size()){
                // first we need to get the beard template zone and hide it
                $beard = $('#' + BEARD_ZONE);
                if($beard.size() == 0){
                    $beard = $('<div id="' + BEARD_ZONE + '"></div>');
                }
                $beard.css('display', 'none');
            } else if (_options.beardZone != BEARD_ZONE){
                BEARD_ZONE = _options.beardZone;
                $beard.attr('id', BEARD_ZONE);
            }

            withInZone = _options.withinZone;

            BEARD_NODE = _options.nodeDef;
            BEARD_PATH = _options.nodePath;
            BEARD_UNWRAP = _options.nodeUnwrap;
            BEARD_REMOTE = _options.nodeRemote;
            BEARD_SHOW = _options.nodeShow;
            BEARD_DATA = _options.nodeData;
            BEARD_ARGS = _options.nodeArgs;
            BEARD_REF = _options.nodeRef;

            ec = _options.equaClose;

            tplTags = {};
            tplTags[_options.codeOpen] = ec + 'o' + E;
            tplTags[_options.equaOpen] = ec + 'q' + E;
            tplTags[_options.escapeOpen] = ec + 's' + E;
            tplTags[_options.tagOpen] = ec + 't' + E;
            tplTags[_options.codeClose] = ec;
            tplTags['_seq'] = [_options.codeOpen,_options.equaOpen,
            _options.escapeOpen,_options.tagOpen,
            _options.codeClose];

            tplTags._seq.sort(cmpLength);

            safeMode = _options.safemode;

            return Beard;
        },
        extendUtils: function(newUtils){
            utils._edit++;
            $.extend(utils, newUtils);
            return Beard;
        },
        defineTag: function(defs, _run){
            if(!_run){
                pushOp(function(){
                    Beard.defineTag(defs, 1);
                });
                return Beard;
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
            if(firstRun){
                this.load();
            }
            if(!running){
                ready(); // if no request queue there, simply run the function
            } else {
                readyFuncs.push(ready);
            }
            return Beard;
        },
        bindData: function($scope){
            Beard.bindDataOnly($scope).clearData();
            return Beard;
        },
        parseHtml: function(h){
            if(!(h instanceof jQuery)){
                h = $(h);
            }
            Beard.bindData(h);
            return h;
        },
        bindDataOnly: function($scope){
            if(hasDataCached){
                if(!$scope){
                    $scope = $('body');
                }
                var sel = '[' + BEARD_DATA + ']';
                $scope.find(sel).add($scope.filter(sel))
                .each(function(){
                    var $t = $(this);
                    $t.data('beard-data', objCache[$t.attr(BEARD_DATA)])
                    .removeAttr(BEARD_DATA);
                })
            }
            return Beard;
        },
        clearData: function(){
            objCache = {};
            hasDataCached = false;
            return Beard;
        },
        _recompileTemplate: function(funcStr, path, args){
            var pts = funcStr.split('/*\x1b*/');
            var F = new Function(args, [pts[0], compileUtils(path, args), pts[2]].join(''));

            var tmp = path.split('.');
            if(path){
                pushFunction(path, tmp[tmp.length-1], F);
            }

            utils._log(new Date().toLocaleTimeString() + ' Recompiling : ' + path);
            var fArgs = [];
            for(var i = 3, len = arguments.length; i < len; i ++){
                fArgs.push(arguments[i]);
            }
            return F.apply(this, fArgs);
        }
    } // end of Beard object

    function eventAll(events, path, $context, action, type){
        if(typeof events == 'function' ){
            if(type == 'bind'){
                $context.find(path).bind(action?action:'click', events);
            } else {
                $(path, $context).live(action?action:'click', events);
            }
            return;
        }
        if(action || type){
            return;
        }
        for(var key in events){
            if(events.hasOwnProperty(key)){
                var val = events[key];
                var ch = key.charAt(0);
                if(ch == '+'){
                    key = key.substr(1);
                } else if (ch == ':') {
                    var $subContext = $context.find(key.substr(1));
                    eventAll(val, '', $subContext);
                    continue;
                } else {
                    key = ' ' + key;
                }
                var configs = key.split('&');
                if(configs.length > 1){
                    var config = configs[1].split(':');
                    eventAll(val, path + configs[0], $context, $.trim(config[0]), config[1]);
                } else {
                    eventAll(val, path + key, $context);
                }

            }
        }
    }


    var running = false;
    function pushOp(fn){
        operationQueue.push(fn);
        if(firstRun){
            Beard.load();
        }
        if(!running){
            running = true;
            nextOp();
        }
    }

    function nextOp(){
        var op = operationQueue.shift();
        if(op){
            op();
        } else {
            while(true){
                var func = readyFuncs.shift();
                if(func){
                    func();
                } else {
                    break;
                }
            }
            running = false;
        }
    }

    function parseJsonPathStr(str, obj, t, sc, p){
        var m = rgxKey.exec(str), t1= t+'1', t2=t+'2';
        if(m){
            if(m[1] && (m[1] in sc)){
                obj[t] = sc[m[1]] + (m[2]? '.' + m[2]: '');
            } else {
                if(m[1]){
                    obj[t1] = m[1];
                    obj[t] = m[2];
                } else{
                    obj[t] = p + m[2];
                }
            }
            if(!obj[t1] && m[3]){
                sc[m[3]] = obj[t];
            } else {
                obj[t2] = m[3];
            }
            if(t == 'p'){
                obj.a = m[4];
            }
        } else {
            throw new Error('Cannot parse the json as a set of templates. failed @ ' + str);
        }
    }
    function prepareJsonTpls(j, sc, notFirst, idx, p){ // sc : shortcuts
        var fn = 2;
        for(var key in j){
            if(key && j.hasOwnProperty(key)){
                if(!notFirst){
                    if(typeof j[key] == 'object'){
                        cf = j[key][''] = { // cf : config
                            t: j[key][''],
                            d: true
                        }
                    } else {
                        j[key] = { // cf : config
                            '':{
                                t: j[key],
                                d: false
                            }
                        }
                        var cf = j[key][''];
                    }
                    // first, parse the key
                    var tmp = key.split('->');
                    parseJsonPathStr(tmp[0], cf, 'p', sc, p);
                    if(1 in tmp){
                        parseJsonPathStr(tmp[1], cf, 'r', sc, '');
                    }
                } else {
                    cf = j[key][''];
                    if(cf.p1 && (cf.p1 in sc)){
                        cf.p = sc[cf.p1] + '.' + cf.p;
                        cf.p1 = '';
                        if(cf.p2){
                            sc[cf.p2] = cf.p;
                        }
                    }
                    if(cf.r1 && (cf.r1 in sc)){
                        cf.r = sc[cf.r1] + (cf.r?'.' + cf.r:'');
                        cf.r1 = '';
                        if(cf.r2){
                            sc[cf.r2] = cf.r;
                        }
                    }
                }
                if(cf.p1 || cf.r1){
                    if(!cf.idx) cf.idx = idx;
                    if(cf.idx < idx - 2) return 0;
                    fn = 1;
                } else if(cf.d){
                    var res = prepareJsonTpls(j[key], sc, cf.nf, idx, cf.p + '.');
                    if(!res)
                        return 0;
                    if(res == 1){
                        fn = 1;
                    }
                    cf.nf = true;
                }
            }
        // end of each key
        }
        return fn;
    }

    function loadEachScript(j){
        for(var i in j){
            if(i && j.hasOwnProperty(i)){
                var cf = j[i][''];
                if(cf.t || cf.r){
                    Beard.loadScript(cf.t, cf, 2);
                }
                loadEachScript(j[i]);
            }
        }
    }

    function _load(){
        var beards = firstRun && !withInZone? $('div[' + BEARD_NODE + ']') : $beard.find('div['+ BEARD_NODE + ']');
        var finalBeards = [];

        var script = {}, parent;
        beards
        .each(function(){

            // first try the defined path
            var $t = $(this);
            var name = $t.attr(BEARD_NODE);

            var path = $t.attr(BEARD_PATH);
            if(!path) path = '';
            else path = path + '.';

            var ref = $t.attr(BEARD_REF);
            if(!ref) ref = '';
            else ref = '->' + ref;

            var args = $t.attr(BEARD_ARGS);
            if(!args) args = '';
            else args = '(' + args + ')';

            var $p = $t.parent().closest('['+ BEARD_NODE + ']');
            if($p.size()){
                parent = $p.data('beard-node');
            } else {
                parent = script
            }

            var t = parent[path + name + args + ref] = {
                '': $t
            };
            $t.data('beard-node', t);
        })
        .each(function(){
            // move all the templates to the top level
            $(this).appendTo($beard);
        })
        .each(function(){
            var $t = $(this);
            var curr = $t.data('beard-node');
            curr[''] = $t.html()
            // remove the <!--@ @--> annotation
            .replace(/<!--@\s*|@-->\s*/g, '')
            //                .split('<!--@').join('').split('@-->').join('')
            // replace special chars
            .split('&lt;').join('<')
            .split('&gt;').join('>')
            .split('&amp;').join('&');

            $t.remove();
        })

        Beard.loadScript(script, '', 1);

        // empty the beard zone
        $beard.html('');
    }

    function removeRefTo(path, name){
        var refto = false
        if(reftos[path]){
            var pRefs = reftos[path];
            if(pRefs[name]){
                refto = pRefs[name];
                delete pRefs[name];
                pRefs.len--;

                // delete the tpl, if it has no key refering to other tpl
                if(!pRefs.len){
                    delete(reftos[path]);
                }
            }
        }
        return refto;
    }

    function removeRefBy(path, name, refto){
        delete refbys[refto][path][name];
        refbys[refto][path].len --;

        // if the current path goes empty
        if(!refbys[refto][path].len){
            delete refbys[refto][path];
            refbys[refto].len --;

            // if the whole target is empty
            if(!refbys[refto].len){
                delete refbys[refto];
            }
        }
    }

    function removeRef(parent, name){
        var refto = false;
        // if the current tpl is a ref, remove the ref
        var path = parent.__path;
        if(reftos[path]){
            var pRefs = reftos[path];
            if(pRefs[name]){
                refto = removeRefTo(path, name);
                if(refto){
                    removeRefBy(path, name, refto);
                }
            }
        }
        return refto;
    }

    function renewRefbys(path, f){
        if(refbys[path]){
            var refby = refbys[path];

            // getting the tpl objs that refer to the current tpl
            for(var refbyPath in refby){
                if(refbyPath != 'len' && refby.hasOwnProperty(refbyPath)){
                    var refbyObj = refby[refbyPath];

                    // getting all names refering to the current tpl
                    for(var name in refbyObj){
                        var obj = getTplFunction(refbyPath);
                        if(name != 'len' && refbyObj.hasOwnProperty(name)){
                            if(isDebug){
                                utils.log(new Date().toLocaleTimeString() + ' Renew ref : ' + refbyPath + '.' + name + ' -> ' + path);
                            }
                            obj[name] = f;
                        }
                    }
                }
            }
        }
    }

    function removeAllRef(parent){
        for(var name in parent.__tpls__){
            var isRef = removeRef(parent, name);
            if(!isRef){
                removeAllRef(parent[name]);

                var path = parent[name].__path;
                var f = function(){
                    throw new Error(path + ' : Not implemented yet');
                }
                f.__path = path;
                delete tplsByPath[path];
                renewRefbys(path, f);
            }
        }
    }

    function addRef(parent, name, f){
        var path = parent.__path;
        var toPath = f.__path;
        if(!reftos[path]){
            reftos[path] = {
                len: 0
            };
        }
        var o = reftos[path];
        o[name] = toPath;
        o.len++;

        if(!refbys[toPath]){
            refbys[toPath] = {
                len: 0
            };
        }
        o = refbys[toPath];

        if(!o[path]){
            o.len ++;
            o[path] = {
                len: 0
            }
        }
        o = o[path];
        o[name] = 1;
        o.len ++;
    }

    function pushFunction(path, name, f, refto){
        var parent = getTplFunction(path, true);
        name = name.charAt(0).toUpperCase() + name.slice(1);

        if(parent[name]){
            var isRef = removeRef(parent, name);
            if(!isRef){
                if(refto){
                    // if it is a ref, we need to update its sub tpls
                    removeAllRef(parent[name]);
                }
                renewRefbys(parent[name].__path, f);
            // otherwise update refs of current tpl if there is any
            }
        }
        if(parent.__path){
            path = parent.__path + '.' + name;
        } else {
            path = name;
        }
        if(!refto){
            var target = parent[name];
            if(target && !isRef){
                var tpls = f.__tpls__ = target.__tpls__;
                for(var sub in tpls){
                    if(tpls.hasOwnProperty(sub)){
                        f[sub] = target[sub];
                        if(target[sub]._p === target){
                            target[sub]._p = f;
                        }
                    }
                }
                initTplFunc(f, target.__tpls__, target.tags, parent, path, name);
                utils._log(new Date().toLocaleTimeString() + ' --------------- TPL OVERWRITTEN ------------- ' + path);
            } else {
                initTplFunc(f, {}, {}, parent, path, name);
                utils._log(new Date().toLocaleTimeString() + ' --------------- NEW TPL CREATED ------------- ' + path);
            }
        } else {
            addRef(parent, name, f);
            // if this is a ref
            utils._log(new Date().toLocaleTimeString() + ' --------------- PARSING REF ------------- ' + path + ' --to--> ' + refto);
        }
        tplsByPath[path] = f;
        parent[name] = f;
        parent.__tpls__[name] = 1;
    }


    var reftos = {}, refbys = {}, tplsByPath = {};
    function getTplFunction(path, isParent, target, levels, idx, len){
        if(!levels){
            levels = path.split('.');
            if(isParent){
                levels.pop();
            }
            idx = 0;
            len = levels.length;
            target = Btpls;

            for(var i = 0, l = levels.length; i < l ; i ++){
                levels[i] = levels[i].charAt(0).toUpperCase() + levels[i].slice(1);
            }
            path = levels.join('.');
            if(tplsByPath[path]){
                return tplsByPath[path];
            }
        }

        // idx = len - 1 means it is the parent node of the exact path
        if(idx == len){
            return target;
        }

        var level = levels[idx];

        if(level in target){
            return getTplFunction(path, 0, target[level], levels, idx + 1, len);
        } else {
            // if no function defined, define an empty one, init it and go down
            var f = target[level] = function(){
                throw new Error(path + ' : Not implemented yet');
            }
            target.__tpls__[level] = 1;
            if(target.__path){
                var _path = target.__path + '.' + level;
            } else {
                _path = level;
            }
            initTplFunc(f, {}, {}, target, _path, level);
            tplsByPath[f.__path] = f;
            return getTplFunction(path, 0, f, levels, idx + 1, len);
        }
    }

    function initTplFunc(f, tpls, tags, parent, path, name){
        f.__tpls__ = tpls;
        f.tags = tags;
        f._parent = parent;
        f._name = name;
        f.__path = path;
        f.p = extra.getParentTpl;
    }

    var UNDERSCORE = '_';
    function compileUtils(path, args){
        var code = ['/*\x1b*/\nif(u._edit>', utils._edit, '){return Beard._recompileTemplate(u._tplsStr["', path ,'"], "',
        path, '", "', args, '", ', args, ')}'];

        utils.loop(utils, function(val, name){
            if(name.charAt(0) != UNDERSCORE){
                if(typeof val == 'function'){
                    code.push('\nfunction ', name, '(){return u.', name,'.apply(u, arguments)}')
                } else {
                    code.push('\nvar ', name, '= u.', name,';')
                }
            }
        })

        code.push('/*\x1b*/');
        return code.join('');
    }

    function compileTemplate(template, path, args){
        var pts = template;
        if(args){
            args += ', _e_';
        } else {
            args = 'd, _e_';
        }

        utils.loop(tplTags, function(val, key){
            pts = pts.split(key).join(val);
        })

        pts = pts.split(ec);

        var PLAIN_HTML_1 = "o[o.length]='";
        var TAG_1 = "o[o.length]=tagFunc('"; // **** root | self delegate -> tag( tagName, key ) -> local -> root
        var ESC_1 = "o[o.length]=esc(";
        var EXPRE_1 = "o[o.length]=";
        var THROW_1 = "u._log(e.message + ' @ ";

        var code = [];
        for(var i = 0, len = pts.length; i < len; i ++){
            var pt = pts[i];
            if(pt.charAt(1) !== E){
                // it is a plain html text
                code.push(PLAIN_HTML_1,
                    pt.replace(/^\s\s*/, ' ').replace(/\s\s*$/, ' ')
                    .replace(/(\\|')/g, '\\$1').split('\n').join('\\n'),
                    "';\n");
            } else {
                var ch = pt.charAt(0);
                pt = pt.substr(2);
                if(ch == 'o'){
                    // it is plain javascript code
                    code.push(pt.substr(1), '\n');
                } else {
                    if(safeMode) {
                        code.push('try{');
                    }
                    switch(ch){
                        case 't':
                            var match = rgxTagName.exec(pt);
                            if(match){
                                var tagName = match[0];
                                var tagArgs = pt.substr(tagName.length);
                                code.push(TAG_1,
                                    $.trim(tagName).replace(/(\\|')/g, '\\$1').split('\n').join('\\n'),
                                    "')",$.trim(tagArgs) == ''? '()': tagArgs,
                                    isDebug? ';log(new Date().toLocaleTimeString() + "  ----->  "+  ' + (locIndex++) + "  +'" +
                                    pt.replace(/(\\|')/g, '\\$1').split('\n').join('\\n') + "');\n": ";\n"
                                    );
                            }
                            break;
                        case 'q':
                            // the expression to be exported to output
                            code.push(EXPRE_1,
                                pt,
                                isDebug? ';log(new Date().toLocaleTimeString() + "  ----->   "+   (' + (locIndex++) + ")   +'" +
                                pt.replace(/(\\|')/g, '\\$1').split('\n').join('\\n') + " =>'," + pt +");\n": ";\n"
                                );
                            break;
                        case 's':
                            // the content needs escaped
                            code.push(ESC_1,
                                pt,
                                isDebug? ');log(new Date().toLocaleTimeString() + "  ----->   "+   (' + (locIndex++) + ")   +'" +
                                pt.replace(/(\\|')/g, '\\$1').split('\n').join('\\n') + "'," + pt +");\n": ");\n"
                                );
                            break;
                    }
                    if(safeMode){
                        code.push('}catch(e){',
                            isDebug? THROW_1 +
                            pt.replace(/(\\|')/g, '\\$1').split('\n').join('\\n') +
                            "')}\n":'}\n');
                    } else {
                        code.push('\n')
                    }
                // end of equals parts
                }
            // end of javascript parts
            }
        } // end of all parts of template code

        code = code.join('')
        .split(["o[o.length]='';\n"].join('')).join('')
        .replace(/try{}catch\(e\){.*?}\n/g, '');

        code = ['var e=_e_||{};var u=Beard.utils,o=[],t=arguments.callee;function out(){o.push.apply(',
        'o, arguments);}function tag(tag, data){out(u.tagFunc(tag)(data))}',
        compileUtils(path, args),
        'try{',
        isDebug?'u.log(new Date().toLocaleTimeString() + " ------- START TPL : <<   ' + path + '   >> -------");':'',
        code,
        isDebug?';u.log(new Date().toLocaleTimeString() + " ####### END TPL : <<   ' + path + '   >> #######")':'',
        ';return o.join("");',
        '}catch(e){u.log(arguments.callee.toString());log(e);throw e;}'
        ].join('');

        try{
            var F = new Function(args, code);
            utils._log(new Date().toLocaleTimeString() + ' ---- SUCCESS: The compiled function for template <<' + path + '>> : ---- \n\n');
            utils._log(code);
            utils._tplsStr[path] = code;
            return F;
        } catch(e) {
            e.msg = 'The template cannot be compiled.';
            e.funcString = code;
            utils.log(new Date().toLocaleTimeString() + ' ---- FAILED: The compiled function for template <<' + path + '>> : ---- \n\n',
                'function(){' + code + '}'); // log the code anyway..
            throw e;
        }
    }

    var extra = {
        // data attribute
        objId : function(obj, nocache){
            if(obj !== null && obj !== undefined){
                if(typeof obj == 'object' || typeof obj == 'function'){
                    if(obj.__objid_){
                        var id = obj.__objid_;
                    } else {
                        id = obj.__objid_ = objSeq ++;
                    }
                } else {
                    id = objSeq ++;
                }
                if(!(id in objCache) && !nocache){
                    objCache[id] = obj;
                    hasDataCached = true;
                }
                return id;
            } else {
                return '';
            }
        },
        getParentTpl: function(key){
            if(!key) return this._parent;
            var ret = this;
            if(typeof key == 'number'){
                for(var i = key; i > 0; i--){
                    ret = ret._parent;
                    utils.log(ret);
                    if(!ret) {
                        throw new Error(' No more parent template for t.p(' + key + ')');
                    }
                }
                return ret;
            } else {
                while(true){
                    ret = ret._parent;
                    if(!ret) {
                        throw new Error(' The template name could not be found for t.p(' + key + ')');
                    }
                    if(ret._name == key){
                        return ret
                    }
                }
            }
        }
    }

    var utils = Beard.utils = {
        _edit: 0,
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
                        var a = f.split('.');
                        a.unshift('Btpls');
                        return tagFuncCache[funcKey] = this._getGlobalTagFunc(a, 0, f, funcKey);
                    }
                } else if (typeof f == FUNCTION){
                    return f;
                } else {
                    utils.log(funcKey + ' is found in defined tags as "' + f + '", but it is not a valid callable object.');
                    return emptyFunc;
                }
            } else {
                utils.log(funcKey + ' is not a defined tag.');
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
        _tplsStr: {},
        loop: function(data, callback, mode, extra, undefined){
            k = 0;
            if(typeof callback != 'function' || data === null || data === undefined){
                return false;
            }
            if(mode == ARRAY || data instanceof Array){
                for(var k = 0, len = data.length; k < len; k ++){
                    var ret = callback(data[k], k, data, extra);
                    if(ret !== undefined && ret !== true) return {
                        ret: ret,
                        num: k
                    };
                }
            } else if(mode == OBJECT || data && typeof data == OBJECT){
                if(data._seq){
                    var seq = data._seq;
                    for(k = 0, len = seq.length; k < len; k++){
                        var key = seq[k];
                        ret = callback(data[key], key, data, extra);
                        if(ret !== undefined && ret !== true) return {
                            ret: ret,
                            num: k,
                            key: key
                        };
                    }
                } else {
                    for(var l in data){
                        if(data.hasOwnProperty(l)){
                            ret = callback(data[l], l, data, extra);
                            if(ret !== undefined && ret !== true) return {
                                ret: ret,
                                num: k,
                                key: l
                            };
                            k++;
                        }
                    }
                }
            } else {
                k = -1;
                callback(data, null, data, extra);
            }

            return k;
        },
        is: function(v){
            if(!v){
                // if v = null | undefined | false | 0 | ''
                return false;
            } else {
                if(v instanceof Array && v.length == 0){
                    // checking empty array
                    return false;
                } else if(typeof v == 'object'){
                    if(v._seq instanceof Array && v._seq.length == 0){
                        // checking advanced object with _seq
                        return false;
                    } else {
                        // checking a plain object
                        for(var i in v){
                            if(v.hasOwnProperty(i)){
                                return true;
                            }
                        }
                        return false;
                    }
                }
                return true;
            }
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
        partial: function(source, keys, target, removeOld){
            if(!target) target = {};
            utils.loop(keys, function(from, to){
                if(typeof to == 'number'){
                    target[from] = source[from];
                    if(removeOld){
                        delete source[from];
                    }
                } else {
                    target[to] = source[from];
                    if(removeOld){
                        delete source[from];
                    }
                }
            })
            return target;
        },
        strcat: function(){
            var o = [];
            for(var i = 0, len = arguments.length; i < len; i++){
                o.push(arguments[i]);
            }
            return o.join('');
        },
        bind: function(name, obj){
            var id = extra.objId(obj);
            var attr = [BEARD_DATA, '="', id, '"',' data-beard-name="', name, '"'];
            return attr.join('');
        },
        clear: function(obj, keys){
            keys = keys.split(/,/);
            for(var i = 0, len = keys.length; i < len; i++){
                delete obj[keys[i]];
            }
        }
    }

    g.Beard = Beard;

})(window, document)
