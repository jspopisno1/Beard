/*
    beard.js

    !!! REQUIRE jQuery 1.4.2 or above !!! (for the .delegate() function @ initEvent())

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
    * Liang:    111019 -    beard template compiler, remote _loading, ready function, object cache
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
    *                           1. bind() => beard-node='1' beard-name='Tr' beard-path='UserTable'
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
    *           111101 -    .p() for going up to the parent tpl
    *                       remove support to other engines
    *                       disable the anonymous template function to be pushed to the template tree when re-compiling
    *           111102 -    refining the operation queue
    *                       further refining debuging
    *                       create parseHtml() for parsing the html into jquery object with data bound
    *                       correct the order of operation queue
    *                       set bind as ('name', object)
    *                       wrap data (input,select,hidden,textarea,checkbox,radio, elems with beard-nodename & data.value)
    *                       use loadScript as Core function to compile the template TREE
    *                       t.p() -> getting the parent level tpl, p(1), p(2), p(), p('afftable')
    *                       error of unknown message reserved_word
    *                       refined the structure of templates, use template.fn instead of re-refering
    *           111103 -    remove tag features, re-add beards to body & Beard
    *           111104 -    easy data binding (field) & advanced data binding (node)
    *           111106 -    comment tags
    *                       global var as g
    *                       enable level for each tpl rendering
    *           111107 -    refined event binding
    *           111110 -    BeardSlot
    *                       BeardNodt.refresh(), BeardSlot.refresh()
    *           111111 -    BeardSlot -> thread refresh!
    *           111112 -    dividing into core & data
    *                       1. core
    *                           load, loadRemote... utils... => expose utils, extra
    *                           jquery extension -> field up, field down
    *                       2. data
    *                           BeardNode, BeardSlot, thread, jquery extenstion
    *           111115 -    really need Beard's own creating new fragments
    *                       quick fix to support <tr> ...
    *
    *
    *
    *
    * TODO:                 *** START
    *                       ***
    *                       *** examples for testing
    *                       *** requirements
    *                           data bound template can only have one input
    *                           the extra param is an shared object across nodes under a same slot
    *                       *** BeardSlot -> the container of BeardNodes
    *                           slot tag
    *                           BeardNode.slot('name').remove(BeardNode)
    *                           .insert(idx, beardNode) or .insert(idx, argument list)
    *                           .append
    *                           .prepend
    *                           .refresh()
    *                           .index( BeardNode or BeardNode.__objid_ )
    *                       *** BeardNode
    *                           .slotUp()
    *                           .refresh() -> '', 'slot name 1', 'slot name 2' ...
    *                           .onRefresh({'':func, 'slot name 1': func ... }
    *                               func($old, $new, BeardNode)
    *                       *** comment tag
    *                       *** t.$()
    *                       *** parseBeard() -> inject the $node to data
    *                       *** the Compiled Template func -> function(){ call t.fn() }
    *                           fn() is the current compiled func! @1103
    *                           so that simplify the refering
    *                       --- DO I REALLY NEED SOMETHING SO COMPLICATED ???
    *                           data binding !! -> bind all the args, unless there is explicit declaration
    *                           nodes, fields (use for wraping data)
    *                           static elem
    *                       --- refreshing logic
    *                           1. loop -> data._k, data._i
    *                           2. bind -> data._dirty(), data._remove(), data._type
    *                           3. $.fn.refresh
    *                           4. refreshing
    *                               *.  1. try filter('[beard-node]'), else try children('[beard-node]')
    *                               *.  if( _dirtied_self )
    *                                       $new = fn.$()
    *                                       process static elements
    *                                   else $new = $old
    *                               *.  call fn._pre($old, $new, d, e)
    *                               *.  if( _dirtied )
    *                               *.  $old.getSlots() -> [], $new.getSlots() -> []
    *                                       each slot:
    *                                           old slot contents -> $hidden
    *                                           if( d.slot is object )
    *                                               if( !d.slot._removed )
    *                                               $sub = d.slot.$.refresh()
    *                                               $sub.appendTo( slot.$ )
    *                               *.  call fn._post($old, $new, d, e)
    *
    *
    *
    *
    *
    * CANCEL:               --- START
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

    // ------ var definitions ------
    var $beard, VERSION = 'pre-beta',
    BEARD_NODE, BEARD_PATH, BEARD_REF,
    BEARD_ZONE = 'beards', BEARD_ARGS,
    ARRAY = 'array', OBJECT = 'object',


    // selected engine. If it is undefined, the Beard has not been inited
    _options = {}, defOpts = {
        // template config
        codeOpen : '[##',
        codeClose : '#]',
        equalOpen : '[``',
        escapeOpen : '[`/',
        commentOpen : '[//',
        htmlCommentOpen : '[///',
        commentClose : '/]',
        equalClose : '`]',

        // html config
        nodeDef: 'beard',
        nodePath: 'bpath',
        nodeArgs: 'bargs',
        nodeRef: 'bref',
        beardZone: 'beards',
        withinZone: false,

        // compile config
        debug: false,
        safeMode: true,
        dataMode: false,
        engine: 'beard'
    },

    isDebug = false, 
    safeMode = true, // if set to true (default), the assignment tags will be enclosed with try statement
    $debug,
    locIndex = 0, // for showing the location id in compiled templates

    // this is to make sure that it is safe to log to console
    canLog = typeof console != 'undefined' && typeof console.log == 'function',

    // the name of template. e.g., Tpl(some, arg, here)->OtherTpl
    rgxTplName = /^\s*([\w\.]+)\s*(?:\(([^\)]*)\))?(?:\->\s*([\w\.]+))?\s*$/,

    // in IE, \r should also be considered
    rgxNewLine = /\n|\r\n|\n\r|\r/,

    // containing the tags, this will be used in compilation phase
    tplTags,
    ec,
    cmpLength = function(a, b){
        if(a.length > b.length) return -1;
        else if(a.length == b.length) return 0;
        else return 1;
    },

    // special char that is heavily used to embed some special anchor in template string
    E = '\x1b', 

    // for the tpls
    Btpls = g.Btpls = {
        __tpls__: [],
        g: {}
    },

    emptyFunc = function(){
        return ''
    },

    firstRun = true, readyFuncs = [], operationQueue = [],
    withinZone,

    objSeq = 1, hasDataCached = false;

    // ------ end of var definitions ------

    ;
    (function(){
        function extendJQueryMethod(){
            $.fn.extend({
                beardData: function(val){
                    return this.data('beard-field-val', val);
                },
                wrapData: function(){
                    var data = {};
                    this.find('select,input,textarea').each(function(){
                        var $t = $(this);
                        var name = $t.attr('name')||$t.attr('id');
                        if(!name) return true;

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

                    return data;
                },
                lookUp: function(sel){
                    var ret, empty = $();

                    ret = this.filter(sel).eq(0);
                    if(ret.size()) return ret;

                    ret = this.prevAll(sel).eq(0);
                    if(ret.size()) return ret;

                    this.parents().each(function(){
                        var $t = $(this);
                        ret = $t.filter(sel).eq(0);
                        if(ret.size()) return false;
                        ret = $t.prevAll(sel).eq(0);
                        if(ret.size()) return false;
                        ret = empty;
                    })
                    return ret;
                },
                dataUp: function(sel){
                    var $n = this.lookUp(sel);
                    return {
                        $: $n,
                        val: $n.beardData()
                        }
                },
                union: function($o){
                    var a = this.toArray();
                    a.push.apply(a, $o.toArray());
                    return $(a);
                },
                initEvents: function(events){
                    Beard.initEvents(events, '', this);
                    return this;
                },
                bindData: function(){
                    Beard.bindData(this);
                    return this;
                }
            })
        }

        extendJQueryMethod();
    })()

    var Beard = {
        version: VERSION,
        _objCache: {},
        _getTplFunction: getTplFunction,
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
            withinZone = false;
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
            $beard.html($(content));
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
                        var m = rgxTplName.exec(path);
                        if(!m) throw new Error('The path is not a valid path string : ' + path);
                        cf.p = m[1];
                        cf.a = m[2];
                        cf.r = m[3];
                    } else {
                        cf = path;
                    }
                    if(!cf.r){
                        var f = compileTemplate(content, cf.p, cf.a, cf.b);
                    } else {
                        f = getTplFunction(cf.r);
                    }
                    var tmp = cf.p.split('.'), l = tmp.length;
                    while(l--){
                        tmp[l] = tmp[l].charAt(0).toUpperCase() + tmp[l].substr(1);
                    }
                    pushFunction(tmp.join('.'), tmp[tmp.length - 1], f, cf.r);
                }
            } else if(typeof content == 'object' && content != null){
                prepareTplsForCompilation(content, '');
                loadEachScript(content);
            }
            if(_run == 1) nextOp();
            return Beard;
        },
        $beard: function(){
            if(!$beard) Beard.init();
            return $beard
        },
        $debug: function(){
            if(!$debug) Beard.init();
            return $debug;
        },
        $hidden: function(){
            return $hidden;
        },
        isDebug: function(){
            return isDebug;
        },
        init: function(option){
            _options = $.extend({}, defOpts, _options, option);
            isDebug = _options.debug;


            if(!$beard || !$beard.size()){
                // first we need to get the beard template zone and hide it
                $beard = $('#' + BEARD_ZONE);
                if($beard.size() == 0){
                    $beard = $('<div id="' + BEARD_ZONE + '"></div>').appendTo('body');
                }
                $beard.css('display', 'none');

                $debug = $('#debug');
                if(!$debug.size()){
                    $debug = $('<div id="debug" style="text-align: left;padding:12px;"></div>').appendTo('body');
                }
            } else if (_options.beardZone != BEARD_ZONE){
                BEARD_ZONE = _options.beardZone;
                $beard.attr('id', BEARD_ZONE);
            }

            withinZone = _options.withinZone;

            BEARD_NODE = _options.nodeDef;
            BEARD_PATH = _options.nodePath;
            BEARD_ARGS = _options.nodeArgs;
            BEARD_REF = _options.nodeRef;

            ec = _options.equalClose;

            tplTags = {};
            tplTags[_options.codeOpen] = ec + 'o' + E;
            tplTags[_options.equalOpen] = ec + 'q' + E;
            tplTags[_options.escapeOpen] = ec + 's' + E;
            tplTags[_options.commentOpen] = ec + 'c' + E;
            tplTags[_options.htmlCommentOpen] = ec + 'h' + E;
            tplTags[_options.commentClose] = ec;
            tplTags[_options.codeClose] = ec;
            tplTags['_seq'] = [_options.htmlCommentOpen,_options.commentOpen,_options.codeOpen,
            _options.equalOpen, _options.escapeOpen,
            _options.codeClose, _options.commentClose];

            tplTags._seq.sort(cmpLength);

            safeMode = _options.safeMode;
            utils.__dataMode = _options.dataMode;

            return Beard;
        },
        extendUtils: function(newUtils){
            utils._edit++;
            $.extend(utils, newUtils);
            return Beard;
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
        _recompileTemplate: function(funcStr, path, args){
            var pts = funcStr.split('/*\x1b*/');
            var F = new Function(args, [pts[0], compileUtils(path, args), pts[2]].join(''));

            var tmp = path.split('.');
            if(path){
                pushFunction(path, tmp[tmp.length-1], F);
            }

            utils.__log(new Date().toLocaleTimeString() + ' Recompiling : ' + path);
            var fArgs = [];
            for(var i = 3, len = arguments.length; i < len; i ++){
                fArgs.push(arguments[i]);
            }
            return F.apply(this, fArgs);
        },
        reset: function(){
            operationQueue = [];
            running = false;
            firstRun = true;
            tplsByPath = {};
            Beard._objCache = {};
            _options = $.extend({}, defOpts);
            resetUtils();
            // for the tpls
            Btpls = g.Btpls = {
                __tpls__: [],
                g: {}
            }
            if($beard) $beard.html('');
            withinZone = _options.withinZone;
            return Beard;
        },
        initEvents: function(events, path, $context, action, type){
            if(!$context){
                $context = $(d);
            } else if( !$context.size()){
                utils.__log(new Date().toLocaleTimeString() + 'The context is empty. Stop binding events');
                return Beard;
            }
            if(typeof events == 'function' || type){
                if(type == 'bind'){
                    $context.find(path).bind(action?action:'click', events);
                } else if(type == 'unbind'){
                    $context.find(path).unbind(action?action:'click');
                } else if(type == 'undelegate'){
                    $context.undelegate(path, action?action:'click');
                } else if(type == 'live') {
                    $context.find(path).live(action?action:'click', events);
                } else if(type == 'die') {
                    $context.find(path).die(action?action:'click');
                } else {
                    $context.delegate(path, action?action:'click', events);
                }
                return Beard;
            }
            if(action || type){
                return Beard;
            }
            for(var key in events){
                if(events.hasOwnProperty(key)){
                    var val = events[key];
                    var pts = key.split(',');
                    for(var i = 0; i < pts.length; i++){
                        key = $.trim(pts[i]);
                        var ch = key.charAt(0);
                        if(ch == '+'){
                            key = key.substr(1);
                        }
                        else if (ch == ':') {
                            var $subContext = $context.find(key.substr(1));
                            this.initEvents(val, '', $subContext);
                            continue;
                        } else {
                            key = ' ' + key;
                        }
                        var keyParts = key.split('@');
                        if(keyParts.length > 1){
                            var config = keyParts[1].split(':');
                            this.initEvents(val, path + keyParts[0], $context, $.trim(config[0]), config[1]);
                        } else {
                            this.initEvents(val, path + key, $context);
                        }
                    }
                }
            }
            return Beard;
        // end of init events
        },
        bindData: function($scope){
            if(!($scope instanceof $)){
                $scope = $($scope);
            }
            var objCache = Beard._objCache;
            $scope.find('[data-beard-mark]')
            .union($scope.filter('[data-beard-mark]'))
            .each(function(){
                if(this.getAttribute("data-beard-data")){
                    $(this).beardData(objCache[this.getAttribute("data-beard-data")])
                }
                this.removeAttribute("data-beard-data");
                this.removeAttribute('data-beard-mark');
            })
            objCache = {};
            return Beard;
        }
    } // end of Beard object

    // This is to chain the operation into a queue
    // For ensure that the ready function will be called after all templates
    // are loaded
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

    // Go through the object and prepare it for the next step : compilation
    function prepareTplsForCompilation(j, p){ // sc : shortcuts
        for(var key in j){
            if(key && j.hasOwnProperty(key)){
                if(typeof j[key] == 'object'){
                    cf = j[key][''] = { 
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
                
                // cf :
                // t->template string
                // a arguments
                // p path
                // r reference
                // b databind
                // first, parse the key
                var m = rgxTplName.exec(key);
                if(!m) throw new Error('The path "' + key + '" is not a valid path string under "'+p+'"');
                cf.p = p + m[1];
                cf.a = m[2];
                cf.r = m[3];
                if(cf.d){
                    prepareTplsForCompilation(j[key], cf.p + '.');
                }
            }
        // end of each key
        }
    }

    // For each single template inside a nested template object, compile it
    // and push it to Btpls. This should be called after prepareTplsForCompilation
    function loadEachScript(j){
        for(var i in j){
            if(i && j.hasOwnProperty(i)){
                var cf = j[i][''];
                Beard.loadScript(cf.t, cf, 2);
                loadEachScript(j[i]);
            }
        }
    }

    // For loading templates from html into a nested template object
    // This template object will be passed to loadScript()
    function _load(){
        var beards = firstRun && !withinZone? $('div[' + BEARD_NODE + ']') : $beard.find('div['+ BEARD_NODE + ']');

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

        Beard.loadScript(script, '', 2);

        // empty the beard zone
        $beard.html('');
    }

    function pushFunction(path, name, f, refto){
        var parent = getTplFunction(path, true);
        name = name.charAt(0).toUpperCase() + name.slice(1);
        if(!refto){
            if(name in parent){
                tpl = parent[name];
                if(tpl.__path == path){
                    // tpl replacing tpl
                    tpl.fn = f;
                    utils.__log(new Date().toLocaleTimeString() + ' --------------- TPL OVERWRITTEN ------------- ' + path);
                } else {
                    // tpl replacing tpl ref
                    delete parent[name].__refbys[path]; // removing refbys
                    delete parent[name];
                    delete tplsByPath[path];
                    tpl=getTplFunction(path);
                    tpl.fn = f;
                    utils.__log(new Date().toLocaleTimeString() + ' --------------- TPL REF OVERWRITTEN ------------- ' + path);
                }
            } else {
                // tpl replacing nothing
                var tpl = getTplFunction(path);
                tpl.fn = f;
                utils.__log(new Date().toLocaleTimeString() + ' --------------- NEW TPL CREATED ------------- ' + path);
            }
        } else {
            if(name in parent){
                var otpl = parent[name];
                if(otpl.__path == path){
                    // tpl ref replacing tpl
                    for(var ref in otpl.__refbys){
                        if(otpl.__refbys.hasOwnProperty(ref)){
                            var reftpl = getTplFunction(ref, true);
                            var refname = /[^\.]+$/.exec(ref)[0];
                            reftpl[refname] = f;
                            utils.__log(new Date().toLocaleTimeString() + ' --------------- RENEWING REF ------------- ' + ref + ' --to--> ' + refto);
                        }
                    }
                    clearSubTpls(otpl);
                }
            }
            tpl = f;
            // setting refbys
            f.__refbys[path] = 1;
            utils.__log(new Date().toLocaleTimeString() + ' --------------- CREATE REFERENCE ------------- ' + path + ' --to--> ' + refto);
        }
        parent[name] = tpl;
        parent.__tpls__[name] = 1;

    }

    function clearSubTpls(tpl){
        for(var sub in tpl.__tpls__){
            var subtpl = tpl[sub];
            var path = tpl.__path? tpl.__path + '.' + sub : sub;
            if(subtpl.__path == path){
                var tmp = path;
                utils.__log(new Date().toLocaleTimeString() + ' --------------- CLEARING SUB TPL ------------- ' + path);
                // it is not a template reference
                subtpl.__parent = null;
                subtpl.fn = function(){
                    throw new Error(tmp + ' : Not implemented yet');
                }
                clearSubTpls(subtpl);
                tpl[sub] = null;
            }
        // if it is a template reference, skip
        }
        tpl.__parent = null;
        tpl.__tpls__ = {};
    }


    var
    //    reftos = {}, refbys = {},
    tplsByPath = {};
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
            var tpl = target[level] = function(){
                var f = arguments.callee;
                return f.fn.apply(f, arguments);
            }
            var f = tpl.fn = function(){
                throw new Error(path + ' : Not implemented yet');
            }
            target.__tpls__[level] = 1;
            if(target.__path){
                var _path = target.__path + '.' + level;
            } else {
                _path = level;
            }
            initTplFunc(tpl, {}, {}, target, _path, level);
            tplsByPath[f.__path] = tpl;
            return getTplFunction(path, 0, tpl, levels, idx + 1, len);
        }
    }

    function initTplFunc(tpl, subtplconfig, tags, parent, path, name){
        tpl.__tpls__ = subtplconfig;
        tpl.tags = tags;
        tpl.__parent = parent;
        tpl.__name = name;
        tpl.__path = path;
        tpl.__refbys = {};
        tpl.p = extra.getParentTpl;
        tpl.$ = extra.getJqueryObj;
        if(extra.initTplFunc){
            extra.initTplFunc(tpl);
        }
    }

    var rgxVarName = /^[a-zA-Z]\w+$/;
    function compileUtils(path, args){
        var code = ['/*\x1b*/\nif(u._edit>', utils._edit, '){return Beard._recompileTemplate(u.__tplsStr["', path ,'"], "',
        path, '", "', args, '", ', args, ')}'];

        utils.loop(utils, function(val, name){
            if(rgxVarName.test(name)){
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
            args += ',_e_';
        } else {
            args = 'd,_e_';
        }

        utils.loop(tplTags, function(val, key){
            pts = pts.split(key).join(val);
        })

        pts = pts.split(ec);

        var PLAIN_HTML_1 = "o[o.length]='";
        var ESC_1 = "o[o.length]=esc(";
        var EXPRE_1 = "o[o.length]=";
        var THROW_1 = "u.__log(e.message + ' @ ";

        var code = [];
        for(var i = 0, len = pts.length; i < len; i ++){
            var pt = pts[i];
            if(pt.charAt(1) !== E){
                // it is a plain html text
                code.push(PLAIN_HTML_1,
                    pt.replace(/^\s\s*/, ' ').replace(/\s\s*$/, ' ')
                    .replace(/(\\|')/g, '\\$1').split(rgxNewLine).join('\\n'),
                    "';\n");
            } else {
                var ch = pt.charAt(0);
                pt = pt.substr(2);
                if(ch == 'o'){
                    // it is plain javascript code
                    code.push(pt, '\n');
                } else {
                    if(safeMode) {
                        code.push('try{');
                    }
                    switch(ch){
                        case 'q': // eQual
                            // the expression to be exported to output
                            code.push(EXPRE_1,
                                pt,
                                isDebug? ';\n__tmp__=' + pt + ';\nlog(new Date().toLocaleTimeString() + "  ----->   "+   (' + (locIndex++) + ")   +'" +
                                pt.replace(/(\\|')/g, '\\$1').split(rgxNewLine).join('\\n') + " {non-escaped} => ' + __tmp__);\n": ";\n"
                                );
                            break;
                        case 's': //eScape
                            // the content needs escaped
                            code.push('__tmp__=' + pt + ';\no[o.length]=esc(__tmp__);',
                                isDebug? 'log(new Date().toLocaleTimeString() + "  ----->   "+   (' + (locIndex++) + ")   +'" +
                                pt.replace(/(\\|')/g, '\\$1').split(rgxNewLine).join('\\n') + " {escaped} => ' + __tmp__);\n": "\n"
                                );
                            break;
                        case 'h': // Html comment
                            code.push("o[o.length]='<!-- ", pt.replace(/^\s\s*/, ' ').replace(/\s\s*$/, ' ')
                                .replace(/(\\|')/g, '\\$1').split(rgxNewLine).join('\\n'), " -->';");
                            break;
                        case 'c': // Comment
                            // well ... do nothing here, just skip this fragment
                            break;
                    }
                    if(safeMode){
                        code.push('}catch(e){',
                            isDebug? THROW_1 +
                            pt.replace(/(\\|')/g, '\\$1').split(rgxNewLine).join('\\n') +
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

        code = ['var e=typeof _e_=="undefined"?{}:_e_,u=Beard.utils,o=[],t=this,g=Btpls.g;if(typeof e=="object")e.def=u.__defVal;function out(){o.push.apply(o, arguments);}',
        '_d_=arguments[0];function slot(name, tpl){return u.__slot(name, tpl, _d_)}',
        compileUtils(path, args),
        'try{',
        isDebug?'u.log(new Date().toLocaleTimeString() + " Level @" + (u.__level++) + "  ------ START : <<   ' + path + '   >> ------");':'',
        code,
        isDebug?';u.log(new Date().toLocaleTimeString() + " Level @" + (--u.__level) + "  ###### END : <<   ' + path + '   >> ######");':'',
        'return o.join("");',
        '}catch(e){u.log(arguments.callee.toString());log(e);throw e;}'
        ].join('');

        try{
            var F = new Function(args, code);
            F._args = args.replace(/\s/, '').split(',');
            utils.__log(new Date().toLocaleTimeString() + ' ---- SUCCESS: The compiled function for template <<' + path + '>> : ---- \n\n');
            utils.__log(code);
            utils.__tplsStr[path] = code;
            return F;
        } catch(e) {
            if(e.message.indexOf('reserved_word') != -1){
                e.messge += '\nMake sure you are not using some reserved_word in your template, such as class... e.g., var class = 1 will break some browser';
            }
            e.funcString = code;
            utils.log(new Date().toLocaleTimeString() + ' ---- FAILED: The compiled function for template <<' + path + '>> : ---- \n\n' + 
                'function(){' + code + '}'); // log the code anyway..
            throw e;
        }
    }

    var extra = {
        getJqueryObj:function(){
            var h = this.fn.apply(this, arguments);
            if(h.indexOf('<') != -1){
                h = $(h);
            } else {
                return $($('<div>' + h + '</div>').contents());
            }
            h.bindData();
            return h;
        },
        getParentTpl: function(key){
            if(!key) return this.__parent;
            var ret = this;
            if(typeof key == 'number'){
                for(var i = key; i > 0; i--){
                    ret = ret.__parent;
                    utils.log(ret);
                    if(!ret) {
                        throw new Error(' No more parent template for t.p(' + key + ')');
                    }
                }
                return ret;
            } else {
                while(true){
                    ret = ret.__parent;
                    if(!ret) {
                        throw new Error(' The template name could not be found for t.p(' + key + ')');
                    }
                    if(ret.__name == key){
                        return ret
                    }
                }
            }
        }
    }
    Beard._extra = extra;


    var utils_bak = {
        __level: 0,
        __dataMode: false,
        esc: function(str){
            if(str !== null && typeof str != 'undefined'){
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
        __log: function(msg){
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
                    $debug = $('<div id="debug" style="text-align: left;padding:12px;"></div>');
                    $('body').append($debug);
                }
                if(msg){
                    $('<div></div>').appendTo($debug)[0].innerText = '\n' + msg.toString();
                }
            }
        },
        __tplsStr: {},
        loop: function(data, callback, mode, extra){
            var k = 0;
            if(typeof callback != 'function' || typeof data === 'undefined' || data == null || typeof data != 'object'){
                return false;
            }
            if(mode == ARRAY || data instanceof Array){
                for(len = data.length; k < len; k ++){
                    var ret = callback(data[k], k, data, extra);
                    if(typeof ret != 'undefined' && ret !== true) return {
                        ret: ret,
                        num: k
                    };
                }
            } else if(mode == OBJECT || data && typeof data == OBJECT){
                if(data._seq){
                    var seq = data._seq;
                    for(var j = 0, len = seq.length; j < len; j++){
                        var key = seq[j];
                        if(typeof data[key] != 'undefined'){
                            k ++;
                            ret = callback(data[key], key, data, extra);
                            if(typeof ret != 'undefined' && ret !== true) return {
                                ret: ret,
                                num: k,
                                key: key
                            };
                        }
                    }
                } else {
                    for(var l in data){
                        if(data.hasOwnProperty(l) && l.charAt(0) != '_'){
                            ret = callback(data[l], l, data, extra);
                            if(typeof ret != 'undefined' && ret !== true) return {
                                ret: ret,
                                num: k,
                                key: l
                            };
                            k++;
                        }
                    }
                }
            } 

            return k;
        },
        has: function(v){
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
        // data attribute
        __objId : function(obj, nocache){
            if(obj !== null && typeof obj != 'undefined'){
                if(typeof obj == 'object' || typeof obj == 'function'){
                    if(obj.__objid_){
                        var id = obj.__objid_;
                    } else {
                        id = obj.__objid_ = objSeq ++;
                    }
                } else {
                    id = objSeq ++;
                }
                objCache = Beard._objCache;
                if(!(id in objCache) && !nocache){
                    objCache[id] = obj;
                    hasDataCached = true;
                }
                return id;
            } else {
                return '';
            }
        },
        bind: function(obj){
            var id = utils.__objId(obj);
            // data-beard-mark is for marking all the elements that need to be parse later
            // For instance, slot, field will all be marked
            // and we only need to call .find('[data-beard-mark]') once instead of .find('[adta-beard-field]') & .find('[data-beard-slot]')
            var attr = [' data-beard-data="', id, '" data-beard-mark="1"'];
            return attr.join('');
        },

        // *** this method might be organised in beard-advanced
        __slot: function(name, tpl, obj){
            // bs = beard slot
            var attr = [' data-bs="', name, '" data-beard-mark="1"'];
            if(tpl){
                attr.push(' data-bs-tpl="', tpl.__path, '"');
            }
            if(obj){
                var id = utils.__objId(obj[name]);
                attr.push(' data-bs-raw="', id, '"');
            }
            attr.push(' ');
            return attr.join('');
        },
        clear: function(obj, keys, val){
            keys = keys.split(/,/);
            for(var i = 0, len = keys.length; i < len; i++){
                if(typeof defval == 'undefined') delete obj[keys[i]];
                else obj[keys[i]] = val;
            }
        },
        __defVal: function(key, val){
            if(typeof key == "object"){
                for(var i in key){
                    if(key.hasOwnProperty(i)){
                        if(!(i in this) || typeof this[i] == 'undefined'){
                            this[i] = key[i];
                        }
                    }
                }
            } else if(!(key in this) || typeof this[i] == 'undefined'){
                this[key] = val;
            }
        },
        sort: function(data, func){
            if(!func || typeof func == 'string'){
                func = utils.__getSortFunc(func);
            }
            if(data instanceof Array){
                data.sort(func);
            } else {
                var tmp = [];
                utils.loop(data, function(d, k){
                    tmp.push(d);
                    if(d._key){
                        d.__tmp_key__ = d.key
                    }
                    d._key = k;
                })
                tmp.sort(func);

                var seq = data._seq = [];
                utils.loop(tmp, function(d){
                    seq.push(d._key);
                    if(d.__tmp_key__){
                        d._key = d.__tmp_key__
                    }
                })
            }
            return data;
        },
        __getSortFunc:function(funcStr){
            if(!funcStr) funcStr = 'asc';
            if(funcStr in utils.__sortFuncs){
                return utils.__sortFuncs[funcStr];
            }
            var cols = funcStr.split(',');
            for(var i = 0, len = cols.length; i < len; i++){
                cols[i] = $.trim(cols[i]).split(/\s+/);
            }
            var body = utils.__generateSortFunc(cols, 0, cols.length - 1);
            try{
                return utils.__sortFuncs[funcStr] = new Function('a,b', body);
            } catch(e){
                utils.log(body);
                return utils.__sortFuncs[funcStr] = emptyFunc;
            }
        },
        __generateSortFunc: function(cols, index, len){
            var o = [];
            var col = cols[index];
            if(col[1] == 'desc'){
                var cmp1 = '>', cmp2 = '<'
            } else {
                cmp1 = '<', cmp2 = '>';
            }
            var colStr = col[0];
            o.push('try{if(a.', colStr, cmp1, 'b.', colStr, ')return -1;else if(a.', colStr, cmp2, 'b.', colStr, ')return 1;',
                'else{', index == len? 'return 0' : utils.__generateSortFunc(cols, index + 1, len), '}}catch(e){return 0}');
            return o.join('');
        },
        __sortFuncs: {
            asc: function(a, b){
                if(a > b) return 1;
                else if (a == b) return 0;
                else return -1;
            },
            desc: function(a, b){
                if(a < b) return 1;
                else if (a == b) return 0;
                else return -1;
            }
        }
    }

    var utils = Beard.utils = {
        _edit: 0
    };
    function resetUtils(){
        for(var i in utils){
            if(utils.hasOwnProperty(i) && !(i in utils_bak) && i != '_edit'){
                delete utils[i];
            }
        }
        for(i in utils_bak){
            if(utils_bak.hasOwnProperty(i)){
                utils[i] = utils_bak[i];
            }
        }
    }
    resetUtils();

    g.Beard = Beard;
    var log = utils.log;

})(window, document)
