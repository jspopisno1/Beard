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
    *           111104 -    easy data binding & advanced data binding
    *
    *
    * TODO:                 *** START
    *                       *** examples for testing
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
    var VERSION = '0.1';

    var $beard, $hidden = $('<div></div>');

    ;
    (function(){
        function extendJQueryMethod(){
            $.fn.extend({
                bVal: function(val){
                    return this.data('beard-value', val);
                },
                wrapData: function(){
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

                    this.find('[data-beard-field]')
                    .union(this.filter('[data-beard-field]'))
                    .each(function(){
                        var $t = $(this);
                        var name = $t.attr('data-beard-field');
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
                lookUp: function(sel){
                    var ret;

                    ret = this.prevAll(sel).eq(0);
                    if(ret.size()) return ret;

                    this.parents().each(function(){
                        var $t = $(this);
                        ret = $t.filter(sel).eq(0);
                        if(ret.size()) return false;
                        ret = $t.prevAll(sel).eq(0);
                        if(ret.size()) return false;
                    })
                    return ret;
                },
                lookUpAll: function(sel){
                    var ret = this.prevAll(sel).toArray();

                    this.parents().each(function(){
                        var $t = $(this);
                        var r = $t.filter(sel);
                        if(r.size()) ret.push(r, r.toArray());
                        r = $t.prevAll(sel);
                        if(r.size()) ret.push(r, r.toArray());
                    })
                    return ret;
                },
                parentField: function(name){
                    var sel = _dsel(name);
                    var $t = this.lookUp(sel);
                    return {
                        $: $t,
                        d: $t.bVal()
                    }
                },
                parentNode: function(name){
                    name = name||'';
                    var sel = _sel(name);
                    return this.lookUp(sel).data('bn-'+name);
                },
                currNode:function(name){
                    name = name||'';
                    var sel = _sel(name);
                    var t;
                    t = this.filter(sel).eq(0);
                    if(t.size()) return t.data('bn-'+name);
                    else return this.find(sel).eq(0).data('bn-'+name);
                },
                eventAll: function(events){
                    return eventAll(events, '', this);
                },
                union: function($o){
                    var a = this.toArray();
                    a.push.apply(a, $o.toArray());
                    return $(a);
                }
            })
        }

        extendJQueryMethod();
    })()

    var BeardNode = function(obj){
        for(var i in obj){
            if(obj.hasOwnProperty(i)){
                this[i] = obj[i];
            }
        }
    }

    function _sel(name){
        return name?'[data-bn-' + name + ']':'[data-bn]';
    }
    function _dsel(name){
        return name?'[data-beard-field="' + name + '"]':'[data-beard-field]';
    }
    function _data(data){
        if(data instanceof BeardNode){
            return data.$;
        } else if(!(data instanceof jQuery)){
            return $(data);
        }
        return data;
    }
    BeardNode.prototype = {
        _start: function(n){
            this.$s = $(n);
            this.$ = [];
            this.$_ = [];
        },
        _push: function(n){
            if(n.nodeType == d.ELEMENT_NODE){
                if(!this.$n ){
                    var q = this.$n = $(n)
                    .attr('data-bn', '1')
                    .attr('data-bn-' + this._name, '1')
                    .data('bn-'+this._name, this);
                    if(!q.attr('bn-'))q.data('bn-', this);
                }
                this.$_.push(n);
            }
            this.$.push(n);
        },
        _end: function(n){
            this.$e = $(n);
            this.$_ = $(this.$_);
            this.$ = $(this.$);
        },
        prev: function(name){
            name = name || '';
            return this.$s.prevAll(_sel(name)).eq(0).data('bn-'+name);
        },
        prevAll: function(name){
            name = name || '';
            var sel = 'bn-' + name;
            return $.map(this.$s.prevAll(_sel(name)), function(i){
                return $(i).data(sel);
            })
        },
        next: function(name){
            name = name || '';
            return this.$e.nextAll(_sel(name)).eq(0).data('bn-'+name);
        },
        nextAll: function(name){
            name = name || '';
            var sel = 'bn-' + name;
            return $.map(this.$e.nextAll(_sel(name)),function(i){
                return $(i).data(sel);
            })
        },
        siblings: function(name){
            name = name || '';
            var sel = 'bn-' + name;
            return $.map(this.$n.siblings(_sel(name)), function(i){
                return $(i).data(sel);
            })
        },
        lookUp: function(name){
            name = name || '';
            return this.$n.lookUp(_sel(name)).eq(0).data('bn-'+name);
        },
        lookUpAll: function(name){
            name = name || '';
            var sel = 'bn-' + name;
            return $.map(this.$n.lookUpAll(_sel(name)), function(i){
                return $(i).data(sel);
            })
        },
        lookDown: function(name){
            name = name || '';
            var d = this.$_.filter(_sel(name)).not(this.$n).eq(0);
            if(d.size())return d.data('bn-'+name);
            return this.$_.find(_sel(name)).eq(0).data('bn-'+name);
        },
        lookDownAll: function(name){
            name = name || '';
            var sel = 'bn-' + name;
            return $.map(this.$_.filter(_sel(name)).not(this.$n).union(this.$_.find(_sel(name))), function(i){
                return $(i).data(sel);
            })
        },
        before:function(data){
            this.$s.before(_data(data));
            return this;
        },
        after: function(data){
            this.$e.after(_data(data));
            return this;
        },
        hide: function(){
            this.$.hide();
            this.$.each(function(){
                if(this.nodeType == d.TEXT_NODE){
                    if(!('hiddenVal' in this)) this.hiddenVal = this.nodeValue;
                    this.nodeValue = '';
                }
            })
            return this;
        },
        show: function(){
            this.$.show();
            this.$.each(function(){
                if(this.hiddenVal){
                    this.nodeValue = this.hiddenVal;
                }
            })
            return this;
        },
        remove: function(isTemp){
            if(isTemp)this.$.appendTo($hidden);
            else this.$.remove();
            return this;
        },
        appendTo: function(target){
            this.$.appendTo($(target));
            return this;
        },
        prependTo: function(target){
            this.$.prependTo($(target));
            return this;
        },
        insertAfter: function(target){
            if(target instanceof BeardNode){
                this.$.insertAfter(target.$e);
            } else {
                this.$.insertAfter($(target));
            }
            return this;
        },
        insertBefore: function(target){
            if(target instanceof BeardNode){
                this.$.insertBefore(target.$s);
            } else {
                this.$.insertBefore($(target));
            }
            return this;
        },
        wrapData: function(){
            return this.$.wrapData();
        },
        eventAll: function(){
            this.$.eventAll();
            return this;
        }
    }

    // ------ var definitions ------
    var BEARD_NODE, BEARD_PATH, BEARD_UNWRAP, BEARD_REMOTE, BEARD_SHOW, BEARD_REF,
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
        __tpls__: [],
        g: {}
    },

    emptyFunc = function(){
        return ''
    },
    STRING = 'string', FUNCTION = 'function',
    firstRun = true, readyFuncs = [], operationQueue = [],
    withinZone,

    objCache = {}, objSeq = 1, hasDataCached = false;

    // ------ end of var definitions ------

    var Beard = {
        version: VERSION,
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
                    Beard.$beard = $beard = $('<div id="' + BEARD_ZONE + '"></div>').appendTo('body');
                }
                $beard.css('display', 'none');
            } else if (_options.beardZone != BEARD_ZONE){
                BEARD_ZONE = _options.beardZone;
                $beard.attr('id', BEARD_ZONE);
            }

            withinZone = _options.withinZone;

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
            return Beard.bindDataOnly($scope).clearData();
        },
        parseHtml: function(h){
            if(!(h instanceof jQuery)){
                h = $($(d.createElement('div')).html(h).contents());
            }
            Beard.bindData(h);
            return h;
        },
        bindDataOnly: function($scope){
            if(hasDataCached){
                if(!$scope){
                    $scope = $('body');
                }
                var d, name;
                // get the bound data
                var sel = '[' + BEARD_DATA + ']';
                $scope.find(sel).union($scope.filter(sel))
                .each(function(){
                    var $t = $(this);
                    $t.bVal(d = objCache[$t.attr(BEARD_DATA)])
                    .removeAttr(BEARD_DATA);
                })

                bindBeardNodes($scope.map(function(){
                    return this;
                }));
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
        },
        clearAll: function(){
            operationQueue = [];
            running = false;
            firstRun = true;
            tplsByPath = {};
            objCache = {};
            // for the tpls
            Btpls = g.Btpls = {
                __tpls__: [],
                g: {}
            }
            $beard.html('');
            withinZone = _options.withinZone;
        }
    } // end of Beard object

    var rgxNodeStart = /\#\#(\d+)\#\#/,rgxNodeEnd = /\/\/(\d+)\/\//;
    function bindBeardNodes(a){
        var m, bn, stk = [];
        for(var i = 0, len = a.length; i < len; i ++ ){
            var n = a[i];
            if(n.nodeType == d.COMMENT_NODE){
                if(n.nodeValue){
                    if(m = rgxNodeStart.exec(n.nodeValue)){
                        if(bn){
                            stk.push(bn);
                        }
                        bn = new BeardNode(objCache[m[1]]);
                        n.nodeValue = '';
                        bn._start(n);
                    } else if(m = rgxNodeEnd.exec(n.nodeValue)){
                        n.nodeValue = '';
                        bn._end(n);
                        bn._push(n);
                        bn = stk.pop();
                    } 
                }
            } 
            if(bn){
                bn._push(n);
                for(var j = 0, jlen = stk.length; j < jlen; j++){
                    stk[j]._push(n);
                }
            }
            if(n.nodeType == d.ELEMENT_NODE){
                bindBeardNodes(n.childNodes);
            }
        }
    }

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
            var tpl = getTplFunction(path);
            tpl.fn = f;
            if(name in parent){
                utils._log(new Date().toLocaleTimeString() + ' --------------- TPL OVERWRITTEN ------------- ' + path);
            } else {
                utils._log(new Date().toLocaleTimeString() + ' --------------- NEW TPL CREATED ------------- ' + path);
            }
        } else {
            tpl = f;
            utils._log(new Date().toLocaleTimeString() + ' --------------- PARSING REF ------------- ' + path + ' --to--> ' + refto);
        }
        parent[name] = tpl;
        parent.__tpls__[name] = 1;

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
        tpl._parent = parent;
        tpl._name = name;
        tpl.__path = path;
        tpl.p = extra.getParentTpl;
        tpl.$ = extra.getBeardNode;
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
            args += ',_e_';
        } else {
            args = 'd,_e_';
        }

        var tmp = args.replace(/\s/g, '').split(',');
        var argObj = [];
        for(var i = 0, len = tmp.length; i < len; i++){
            argObj.push(i?',"':'"', tmp[i], '":', tmp[i]);
        }
        argObj = argObj.join('');

        utils.loop(tplTags, function(val, key){
            pts = pts.split(key).join(val);
        })

        pts = pts.split(ec);

        var PLAIN_HTML_1 = "o[o.length]='";
        var ESC_1 = "o[o.length]=esc(";
        var EXPRE_1 = "o[o.length]=";
        var THROW_1 = "u._log(e.message + ' @ ";

        var code = [];
        for(i = 0, len = pts.length; i < len; i ++){
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

        code = ['var e=_e_||{};var u=Beard.utils,o=[],t=this,g=Btpls.g, __aobj={',argObj,',tpl:t,_name:t._name,__path:t.__path};u._objId(__aobj);function out(){o.push.apply(',
        'o, arguments);}function node(name){if(!name)name=t._name;return u._node(name, __aobj)}',
        compileUtils(path, args),
        'try{o.push("<!--##",__aobj.__objid_,"##-->");',
        isDebug?'u.log(new Date().toLocaleTimeString() + " ------- START TPL : <<   ' + path + '   >> -------");':'',
        code,
        isDebug?';u.log(new Date().toLocaleTimeString() + " ####### END TPL : <<   ' + path + '   >> #######")':'',
        ';o.push("<!--//",__aobj.__objid_,"//-->");return o.join("");',
        '}catch(e){u.log(arguments.callee.toString());log(e);throw e;}'
        ].join('');

        try{
            var F = new Function(args, code);
            utils._log(new Date().toLocaleTimeString() + ' ---- SUCCESS: The compiled function for template <<' + path + '>> : ---- \n\n');
            utils._log(code);
            utils._tplsStr[path] = code;
            return F;
        } catch(e) {
            if(e.message.indexOf('reserved_word') != -1){
                e.messge += '\nMake sure you are not using some reserved_word in your template, such as class... e.g., var class = 1 will break some browser';
            }
            e.funcString = code;
            utils.log(new Date().toLocaleTimeString() + ' ---- FAILED: The compiled function for template <<' + path + '>> : ---- \n\n',
                'function(){' + code + '}'); // log the code anyway..
            throw e;
        }
    }

    var extra = {
        getBeardNode:function(){
            var h = this.fn.apply(this, arguments);
            return Beard.parseHtml(h, true);
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
        // data attribute
        _objId : function(obj, nocache){
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
        field: function(name, obj){
            var id = utils._objId(obj);
            var attr = [' ',BEARD_DATA, '="', id, '"',' data-beard-field="', name, '" '];
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
