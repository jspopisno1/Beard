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

 * VERSION Beta-1.0
 *
 *
 */

;
(function(g, d){
    if(!g.$){
        var e = new Error('jQuery must be loaded before Beard.js');
        throw e;
    }

    // ------ var definitions ------
    var $beard, VERSION = 'beta-0.1',
    BEARD_NODE, BEARD_PATH, BEARD_REF,
    BEARD_ZONE = 'beards', BEARD_ARGS,

    // important urls
    loc = g.location,
    root = loc.protocol + '//' + loc.host + '/',
    app = loc.pathname.split('/')[1] + '/',
    templateRoot = root,
    loadedUrls= {},

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

        // compile config
        debug: false,
        safeMode: true,
        dataMode: false
    },

    isDebug = false, __tmp_func__,
    safeMode = true, // if set to true (default), the assignment tags will be enclosed with try statement
    $debug,
    locIndex = 0, // for showing the location id in compiled templates

    // this is to make sure that it is safe to log to console
    canLog = typeof console != 'undefined' && typeof console.log == 'function',

    // the name of template. e.g., Tpl(some, arg, here)->OtherTpl
    rgxTplName = /^\s*([\w\.]+)\s*(?:\(([^\)]*)\))?\s*(?:(\->|\:\->|=|\:=)?\s*([\w\.]+)\s*(?:\(([^\)]*)\))?)?\s*$/,
    //    rgxTplName = /^\s*([\w\.]+)\s*(?:\(([^\)]*)\))?(?:\->\s*([\w\.]+))?\s*$/,

    // in IE, \r should also be considered
    rgxNewLine = /\n|\r\n|\n\r|\r/,

    rgxFullUrl = /^https?:/,
    rgxEmptyStr = /^\s*$/,

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

    emptyFunc = function(){
        return ''
    },

    firstRun = true, readyFuncs = [], loading = 0,

    objSeq = 1, parsingCallback = 0;

    // ------ end of var definitions ------


    var extra = {
        getJqueryObj:function(){
            var h = this.fn.apply(this, arguments);
            if(h.indexOf('<') != -1){
                var ret = $.buildFragment( [ h ], [ d ] );
                h = $((ret.cacheable ? $.clone(ret.fragment) : ret.fragment).childNodes);
            } else {
                return $(d.createTextNode(h));
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
        },
        extend: function(path, config){
            if(this.__path){
                var p = this.__path + '.';
                if(typeof path == 'string'){
                    path = p + path;
                } else {
                    for(var i in path){
                        if(path.hasOwnProperty(i)){
                            path[p + i] = path[i];
                            delete path[i];
                        }
                    }
                }
            }
            Beard.load(path, config);
            return this;
        },
        remote: function(config, force){
            if(this.__path)var p = this.__path;
            else p = '';
            if(typeof config == 'string'){
                var cfg = {};
                cfg[p] = arguments;
                var f = false;
            } else if(config === true){
                cfg = {};
                cfg[p] = arguments;
                f = true;
            } else if(config instanceof Array){
                cfg = {};
                cfg[p] = config;
                f = force;
            } else {
                cfg = {};
                for(var i in config){
                    if(config.hasOwnProperty(i)){
                        cfg[p+i] = config[i];
                    }
                }
                f = force;
            }
            Beard.remote(cfg, f);
            return this;
        },
        ready: function(func){
            Beard.ready(func);
            return this;
        }
    },

    // for the tpls
    Btpls = g.Btpls = {
        __tpls__: [],
        extend: extra.extend,
        ready: extra.ready,
        remote: extra.remote,
        g: {}
    };

    ;
    (function(){
        function extendJQueryMethod(){
            $.fn.extend({
                beardData: function(val){
                    return this.data('beard-field-val', val);
                },
                beardArray: function(){
                    var ret = [];
                    this.each(function(){
                        var d = $(this).data('beard-field-val');
                        if(typeof d != 'undefined'){
                            ret.push(d);
                        }
                    })
                    return ret;
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
        load: function(path, content){
            if(!$beard || !$beard.size()){
                Beard.init();
            }

            if(firstRun || !path) _load();
            firstRun = false;

            if(path || content) {
                return this._loadScript(path, content);
            }
            return Beard;
        } // end of load ()
        ,
        remote: function(config, force){
            if(firstRun){
                Beard.load();
            }
            if(typeof config == 'string'){
                var cfg = {
                    '': arguments
                }
                var f = false;
            } else if(config === true){
                var cfg = {
                    '': arguments
                }
                var f = true;
            } else if(config instanceof Array){
                cfg = {
                    '': config
                }
                f = force;
            } else {
                cfg = config;
                f = force;
            }
            for(var path in cfg){
                if(cfg.hasOwnProperty(path)){
                    var paths = cfg[path];
                    for(var i = 0, len = paths.length; i < len; i++){
                        if(typeof paths[i] == 'string') Beard.loadRemote(paths[i], path, f);
                    }
                }
            }
            return Beard;
        },
        url: function(url, version){
            if(!url){
                url = root;
            } else {
                if(rgxFullUrl.test(url)) {
                    //url = root + app + url + '/';
                }
            }
            if(version){
                Beard.REQUEST_VERSION = version;
            }
            // setting the root url of templates
            templateRoot = _options.root = url;
            return Beard;
        },
        REQUEST_VERSION: 1,
        loadRemote: function(url, path, force){
            url = templateRoot + '/' + url;
            var key = url + ':' + path;
            if(!force && key in loadedUrls){
                return;
            }
            loading ++;
            if(url.indexOf('?') != -1){
                var u = url + '&_req_ver_' + Beard.REQUEST_VERSION;
            } else {
                u = url + '?_req_ver_' + Beard.REQUEST_VERSION;
            }
            $.ajax({
                url: u,
                success: function(rsp){
                    if(path){
                        rsp = '<div beard="' + path + '" data-bskip="1">' + rsp + '</div>'
                    }
                    var $scope = $('<div>' + rsp + '</div>');
                    loading--;
                    _load($scope);
                    loading++;
                },
                error: function(){
                    readyFuncs = [];
                    throw new Error('Sorry, but the template ' + url + ' cannot be found.');
                },
                dataType: 'html',
                complete: function(){
                    loadedUrls[key] = 1;
                    loading--;
                }
            })
            return Beard;
        },
        loadHtml: function(content, path){
            $beard.html($(content));
            if(path){
                $beard.find('[' + BEARD_PATH + ']').each(function(){
                    var $t = $(this);
                    $t.attr(BEARD_PATH, path + '.' + $t.attr(BEARD_PATH));
                })
                $beard.find('['+BEARD_NODE+']:not(['+BEARD_PATH+'])').each(function(){
                    var $t = $(this);
                    if(!$t.parent('[' + BEARD_PATH + ']').size()){
                        $t.attr(BEARD_PATH, path);
                    }
                })
            }
            this.load();
            return Beard;
        },
        _loadScript: function(path, content, skipReady){
            if(!$beard || !$beard.size()){
                Beard.init();
            }

            if(!skipReady && typeof path == 'object' && path != null){
                prepareTplsForCompilation(path, '');
                loadEachScript(path);
            } else {
                if(!path){
                    return compileTemplate(content, '');
                } else {
                    if(typeof path == 'string'){
                        var cf = {};
                        var m = rgxTplName.exec(path);
                        if(!m) throw new Error('The path is not a valid path string : ' + path);
                        cf.p = m[1]; // the path
                        cf.a = m[2]; // the argument list
                        cf.m = m[3]; // method = , -> , :-> , :=
                        cf.r = m[4]; // target ref
                        cf.l = m[5]; // level
                    } else {
                        cf = path;
                    }
                    if(!cf.r){
                        if(typeof content == 'string'){
                            var f = compileTemplate(content, cf.p, cf.a, cf.b);
                        } else if(typeof content == 'function'){
                            f = content;
                        } else {
                            throw new Error(cf.p + " cannot be compiled as the content is not a string.");
                        }
                    } else {
                        f = getTplFunction(cf.r);
                    }
                    var tmp = cf.p.split('.'), l = tmp.length;
                    while(l--){
                        tmp[l] = tmp[l].charAt(0).toUpperCase() + tmp[l].substr(1);
                    }
                    pushFunction(tmp.join('.'), tmp[tmp.length - 1], f, cf.r, cf.m, cf.l);
                }
            }
            if(!skipReady){
                if(!loading){
                    var func = readyFuncs.shift();
                    if(func) func();
                }
            }
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
        hostUrl: function(){
            return root;
        },
        appUrl: function(){
            return root + app;
        },
        appName: function(){
            return app;
        },
        init: function(option){
            _options = $.extend({}, defOpts, _options, option);
            isDebug = _options.debug;


            if(!$beard || !$beard.size()){
                // first we need to get the beard template zone and hide it
                $beard = $('<div></div>');
            }

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

            Beard.url(_options.root);
            delete _options.root;

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
            if(!loading){
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
            firstRun = true;
            tplsByPath = {};
            Beard._objCache = {};
            _options = $.extend({}, defOpts);
            resetUtils();
            // for the tpls
            Btpls = g.Btpls = {
                __tpls__: [],
                extend: extra.extend,
                ready: extra.ready,
                remote: extra.remote,
                g: {}
            }
            if($beard) $beard.html('');
            loadedUrls = {};
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
                if(rgxEmptyStr.test(path)) {
                    type = type||'bind';
                    path = '';
                }
                //                    alert(path + ' ' + (action?action:'click') + ' ' + type);
                if(type == 'bind'){
                    if(path) $context = $context.find(path);
                    $context.bind(action?action:'click', events);
                } else if(type == 'unbind'){
                    if(path) $context = $context.find(path);
                    $context.unbind(action?action:'click');
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
            if(!path) path = '';
            for(var key in events){
                if(events.hasOwnProperty(key)){
                    var val = events[key];
                    pts = key.split('//');
                    if(1 in pts) key = pts[1];

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
            var objCache = Beard._objCache, callbacks = [], $elems = {}, name;
            $scope.find('[data-beard-mark]')
            .union($scope.filter('[data-beard-mark]'))
            .each(function(){
                var id, $t = $(this);
                if(id = this.getAttribute("data-beard-data")){
                    $t.beardData(objCache[id])
                    this.removeAttribute("data-beard-data");
                }
                if(id = this.getAttribute('data-beard-callback')){
                    if(name = this.getAttribute('data-beard-name'))
                        $elems[name] = $t;
                    callbacks.push({
                        $: $t,
                        d: objCache[id]
                    });
                    this.removeAttribute("data-beard-callback");
                    this.removeAttribute("data-beard-name");
                }
                this.removeAttribute('data-beard-mark');
            })

            for(var i = 0, l = callbacks.length; i < l; i ++){
                parsingCallback ++;
                try{
                    var cb = callbacks[i];
                    utils.__runCallback(cb.$, cb.d, $elems);
                } catch(e){
                    log(e);
                } finally{
                    parsingCallback --;
                }
            }

            if(!parsingCallback) Beard._objCache = {};
            return Beard;
        }
    } // end of Beard object

    // Go through the object and prepare it for the next step : compilation
    // ---
    // parsing the path string, as there are four different types of path string
    // tpl1->tpl2       referencing
    // tpl1:->tpl2      child referencing
    // tpl1=tpl2[ (level) ]          copying
    // tpl1:=tpl2[ ( level ) ]       child copying
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
                cf.p = p + m[1]; // the path
                cf.a = m[2]; // the argument list
                cf.m = m[3]; // method = , -> , :-> , :=
                cf.r = m[4]; // target ref
                cf.l = m[5]; // level
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
                if(typeof cf.t != 'undefined')
                    Beard._loadScript(cf, cf.t, true);
                loadEachScript(j[i]);
            }
        }
    }

    // For loading templates from html into a nested template object
    // This template object will be passed to _loadScript()
    function _load($scope){
        if(!$scope) $scope = $beard;
        var beards = firstRun
        ? $('div[' + BEARD_NODE + ']').union($scope.find('div['+ BEARD_NODE + ']'))
        : $scope.find('div['+ BEARD_NODE + ']');

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

            var t = parent[path + name + args + ref] = {};
            $t.data('beard-node', t);
        })
        .each(function(){
            // move all the templates to the top level
            $(this).appendTo($scope);
        })
        .each(function(){
            var $t = $(this);
            if(!this.getAttribute('data-bskip')){
                var curr = $t.data('beard-node');
                curr[''] = $t.html()
                // remove the <!--@ @--> annotation
                .replace(/<!--@\s*|@-->\s*/g, '')
                //                .split('<!--@').join('').split('@-->').join('')
                // replace special chars
                .split('&lt;').join('<')
                .split('&gt;').join('>')
                .split('&amp;').join('&');
            }

            $t.remove();
        })

        Beard._loadScript(script, '');

        // empty the beard zone
        $scope.html('');
    }

    function pushFunction(path, name, f, refto, method, subs, _rootPath, _rgxRootRefto){
        var parent = getTplFunction(path, true);

        name = name.charAt(0).toUpperCase() + name.slice(1);

        if(!method){
            delete tplsByPath[path];
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
                    var tpl = getTplFunction(path);
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

            if(!_rootPath) _rootPath = path;
            if(!_rgxRootRefto) _rgxRootRefto = new RegExp('^' + refto.replace('.', '\\.') + '(?!:\\b)', 'i');
            if(typeof subs == 'string'){
                subs = subs.split(/\s?\s*,\s*/);
                var tmp = {}, l = subs.length;
                while(l--){
                    var n = subs[l];
                    tmp[n.charAt(0).toUpperCase() + n.substr(1)] = 1;
                }
                subs = tmp;
            }

            if(method == '->'){
                delete tplsByPath[path];
                tpl = f;
                if(path == f.__path){
                    utils.__log(new Date().toLocaleTimeString() + ' --------------- SKIP SELF-REFERENCE ------------- ' + path);
                }
                // creating template reference
                if(name in parent){
                    var otpl = parent[name];
                    // renewing the tpl, if other tpls refer to here
                    if(otpl.__path == path){
                        // tpl ref replacing tpl
                        for(var ref in otpl.__refbys){
                            if(otpl.__refbys.hasOwnProperty(ref)){
                                var reftpl = getTplFunction(ref, true);
                                var refname = /[^\.]+$/.exec(ref)[0];
                                delete tplsByPath[ref];
                                reftpl[refname] = tpl;
                                utils.__log(new Date().toLocaleTimeString() + ' --------------- RENEWING REF ------------- ' + ref + ' --to--> ' + refto);
                            }
                        }
                        clearSubTpls(otpl);
                    } else {
                        delete parent[name].__refbys[path];
                    }
                }
                // setting refbys
                f.__refbys[path] = 1;
                utils.__log(new Date().toLocaleTimeString() + ' --------------- CREATE REFERENCE ------------- ' + path + ' --to--> ' + refto);
            } else if(method == '=' || method.charAt(0) == ':'){
                if(method.charAt(0) == ':'){
                    if(name in parent){
                        if(parent[name].__path == f.__path){
                            utils.__log(new Date().toLocaleTimeString() + ' --------------- SAME TARGET, STOP EXTENDING ------------- ' + parent[name].__path);
                            return;
                        } else {
                            utils.__log(new Date().toLocaleTimeString() + ' --------------- EXTENDING ------------- ' + parent[name].__path + ' with ' + f.__path);
                        }
                    }
                    method = method.substr(1);
                } else {
                    tpl = parent[name];
                    if(name in parent && tpl.__path != path){
                        delete tplsByPath[path];
                        // we need to get rid of tempalte reference before copying
                        delete parent[name].__refbys[path];
                        delete parent[name];
                    }
                    if(!(name in parent)) tpl = getTplFunction(path);

                    utils.__log(new Date().toLocaleTimeString() + ' --------------- CLONING TPL ------------- ' + path + ' from ' + refto);
                    tpl.fn = f.fn;
                }
                var tpls;

                // parse the children
                for(var sub in tpls = f.__tpls__){
                    if(tpls.hasOwnProperty(sub) && (!subs || sub in subs)){
                        // in unlimited level copying, we cannot copy ref,
                        // otherwise it is really possible that we will end up with a infinite loop
                        var m = method == '=' && f[sub].__path == f.__path + '.' + sub?'=':'->';
                        if(m == '->' && method == '=' && _rgxRootRefto.test(f[sub].__path)){
                            var newPath = f[sub].__path.replace(_rgxRootRefto, _rootPath);
                            utils.__log(new Date().toLocaleTimeString() + ' --------------- HANDLING INNER TPL REF ------------- ' + f[sub].__path + ' to ' + newPath);
                            tpl = getTplFunction(newPath);
                        } else {
                            newPath = refto + '.' + sub
                            tpl = f[sub];
                        }
                        pushFunction(path + '.' + sub, sub, tpl, newPath, m, null, _rootPath, _rgxRootRefto);
                    }
                }
                return;
            }
        }
        parent[name] = tpl;
        parent.__tpls__[name] = 1;
        tplsByPath[path] = tpl;
    }

    function clearSubTpls(tpl){
        for(var sub in tpl.__tpls__){
            var subtpl = tpl[sub];
            var path = tpl.__path? tpl.__path + '.' + sub : sub;
            delete tplsByPath[path];
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
            } else {
                delete subtpl.__refbys[path];
                utils.__log(new Date().toLocaleTimeString() + ' --------------- CLEARING SUB REF TPL ------------- ' + path);
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
            tplsByPath[tpl.__path] = tpl;
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
        tpl.extend = extra.extend;
        tpl.remote = extra.remote;
        tpl.ready = extra.ready;
        if(extra.initTplFunc){
            extra.initTplFunc(tpl);
        }
    }

    var rgxVarName = /^[a-zA-Z]\w+$/;
    function compileUtils(path, args){
        var code = ['/*\x1b*/\nif(u._edit>', utils._edit, '){return Beard._recompileTemplate(u.__tplsStr["', path ,'"], "',
        path, '", "', args, '", ', args, ')}'];

        utils.loop(utils, function(val, name){
            if(rgxVarName.test(name) && name != 'loop'){
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
                            code.push("o[o.length]=__tmp__=",
                                pt,
                                isDebug? ';\n\nlog(new Date().toLocaleTimeString() + "  ----->   "+   (' + (locIndex++) + ")   +'" +
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

        code = ['var __tmp__,e=typeof _e_=="undefined"?{}:_e_,u=Beard.utils,o=[],__TPL__="__tpls__",t=this,g=Btpls.g;function out(){o.push.apply(o, arguments);}',
        '_d_=arguments[0];function slot(name, tpl){return u.__slot(name, tpl, _d_)}',
        'function loop(d,c,e){if(c&&__TPL__ in c){return u.loop(d,function(i,k){out(c(i,k,e,d))},e)}else return u.loop(d,c,e)}',
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
            utils.log(new Date().toLocaleTimeString() + ' ---- FAILED: The compiled function for template <<' + path + '>> : ---- \n\n' +
                'function(){' + code + '}'); // log the code anyway..
            
            throw e;
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
                }
                $('body').append($debug);
                if(msg){
                    $('<div style="text-align:left;"></div>').appendTo($debug)[0].innerText = '\n' + msg.toString();
                }
            }
        },
        __tplsStr: {},
        loop: function(data, callback, extra){
            var k = 0;
            if(typeof callback != 'function' || typeof data === 'undefined' || data == null || typeof data != 'object'){
                return false;
            }
            if(typeof extra == 'object'){
                if(extra.isArray === true) var mode = 'a'; // array
                else if(extra.isArray === false) mode = 'o'; // object
            }
            if(data instanceof Array && (!mode || mode == 'a')){
                for(len = data.length; k < len; k ++){
                    var ret = callback(data[k], k, data, extra);
                    if(typeof ret != 'undefined' && ret !== true) return {
                        ret: ret,
                        num: k + 1,
                        key: k
                    };
                }
            } else if(data && typeof data == 'object'){
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
                            k++;
                            if(typeof ret != 'undefined' && ret !== true) return {
                                ret: ret,
                                num: k,
                                key: l
                            };
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
                var objCache = Beard._objCache;
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
        remove: function(data, func){
            if(data instanceof Array){
                var l = data.length;
                while(l--){
                    if(func(data[l], l)){
                        data.splice(l, 1);
                    }
                }
            } else {
                for(var i in data){
                    if(data.hasOwnProperty(i)){
                        if(func(data[i], i)){
                            delete data[i];
                        }
                    }
                }
            }
        },
        callback: function(name){
            var callback = Array.prototype.slice.call(arguments);
            var id = utils.__objId(callback),
            attr = [' data-beard-mark="1" data-beard-callback="', id, '"'];
            if(typeof name == 'string') {
                attr.push(' data-beard-name="', name, '"');
                callback.shift();
            }
            return attr.join('');
        },
        __runCallback: function($t, args, $elems){
            var func = args.shift();
            args.push($t, $elems);
            if(typeof func == 'function') var ret = func.apply(this, args);
            else return;
            var t = typeof ret;
            if(ret instanceof jQuery || t == 'string' || t == 'number'){
                $t.html(ret).bindData();
            }
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
        }
    }

    var utils = Beard.utils = {
        _edit: 0
    };

    Beard._utils_bak = utils_bak;
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

    g.tmp = {
        t: tplsByPath
    }

})(window, document)
