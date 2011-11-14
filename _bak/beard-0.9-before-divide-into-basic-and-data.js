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
    var VERSION = '0.1';

    var $beard, $hidden = $('<div></div>');

    ;
    (function(){
        function extendJQueryMethod(){
            $.fn.extend({
                bVal: function(val){
                    return this.data('beard-value', val);
                },
                bindBeard: function(){
                    Beard.bindBeard(this);
                    return this;
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
                nodeUp: function(name){
                    name = name||'';
                    var sel = _sel(name);
                    return this.lookUp(sel).data('_bn');
                },
                nodeDown:function(name){
                    name = name||'';
                    var sel = _sel(name);
                    var t;
                    t = this.filter(sel).eq(0);
                    if(t.size()) return t.data('_bn');
                    else return this.find(sel).eq(0).data('_bn');
                },
                union: function($o){
                    var a = this.toArray();
                    a.push.apply(a, $o.toArray());
                    return $(a);
                },
                initEvents: function(events){
                    Beard.initEvents(events, '', this);
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
        this.id();
        this.__slot = null;
    }

    function _sel(name){
        return name?'[data-bn="' + name + '"]':'[data-bn]';
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
            this._slots = {};
        },
        _push: function(n){
            if(n.nodeType == ELEMENT_NODE){
                if(!this.$n ){
                    var q = this.$n = $(n)
                    .attr('data-bn', this.__name)
                    .data('_bn', this);
                }
            }
            this.$.push(n);
        },
        _end: function(n){
            this.$e = $(n);
            this.$ = $(this.$);
        },
        prev: function(name){
            name = name || '';
            return this.$s.prevAll(_sel(name)).eq(0).data('_bn');
        },
        prevAll: function(name){
            name = name || '';
            var sel = '_bn';
            return $.map(this.$s.prevAll(_sel(name)), function(i){
                return $(i).data(sel);
            })
        },
        next: function(name){
            name = name || '';
            return this.$e.nextAll(_sel(name)).eq(0).data('_bn');
        },
        nextAll: function(name){
            name = name || '';
            return $.map(this.$e.nextAll(_sel(name)),function(i){
                return $(i).data('_bn');
            })
        },
        siblings: function(name){
            name = name || '';
            return $.map(this.$n.siblings(_sel(name)), function(i){
                return $(i).data('_bn');
            })
        },
        parent: function(name){
            name = name || '';
            return this.$s.parent().lookUp(_sel(name)).eq(0).data('_bn');
        },
        parents: function(name){
            name = name || '';
            var res = [], n = this;
            while(true){
                n = n.$s.parent().lookUp(_sel(name)).eq(0).data('_bn');
                if(!n) return res;
                var n1 = n;
                res.push(n1);
            }
        },
        child: function(name){
            name = name || '';
            var d = this.$.filter(_sel(name)).not(this.$n).eq(0);
            if(d.size())return d.data('_bn');
            return this.$.find(_sel(name)).eq(0).data('_bn');
        },
        children: function(name){
            name = name || '';
            var sel = '_bn';
            return $.map(this.$.filter(_sel(name)).not(this.$n).union(this.$.find(_sel(name))), function(i){
                return $(i).data(sel);
            })
        },
        before:function(data){
            this.$s.before(_data(data));
            return this;
        },
        data: function(includeSlots){
            if(includeSlots){
            // *** to parse all slots and get the data
            }
            var args = this._args, data = {}, l = args.length;
            while(l--){
                data[args[l]]= this[args[l]];
            }
            return data;
        },
        after: function(data){
            this.$e.after(_data(data));
            return this;
        },
        replace: function(beardNode){
            this.after(beardNode).remove();
            return beardNode;
        },
        hide: function(){
            this.$.hide();
            this.$.each(function(){
                if(this.nodeType == d.TEXT_NODE){
                    if(!('_hiddenVal' in this)) this._hiddenVal = this.nodeValue;
                    this.nodeValue = '';
                }
            })
            return this;
        },
        show: function(){
            this.$.show();
            this.$.each(function(){
                if(this.hiddenVal){
                    this.nodeValue = this._hiddenVal;
                }
            })
            return this;
        },
        remove: function(isTemp){
            if(isTemp)this.$.appendTo($hidden);
            else this.$.remove();
            var slots = this._slots;
            for(var i in slots){
                if(slots.hasOwnProperty(i)){
                    slots[i].destroy();
                }
            }
            return this;
        },
        //        appendTo: function(target){
        //            this.$.appendTo($(target));
        //            return this;
        //        },
        //        prependTo: function(target){
        //            this.$.prependTo($(target));
        //            return this;
        //        },
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
        id: function(){
            if(!this.__objid_){
                utils._objId(this, true);
            }
            return this.__objid_;
        },
        _onRefresh: function(){},
        onRefresh: function(func){
            if(typeof func == 'function'){
                this._onRefresh = func;
            }
        },
        refresh: function(deepRefresh, extra){
            var slots = this._slots, self = false;

            if(deepRefresh){
                for(var slotName in slots){
                    if(slots.hasOwnProperty(slotName)){
                        slots[slotName].refresh(true, extra);
                    }
                }
            } 

            //            if(self){
            this._e_ = extra;
            var args = this._args, data = []; // **** for the obj for beard node
            for(var i = 0, len = args.length; i < len; i++){
                data.push(this[args[i]]);
            }

            var nbn = this.tpl._bn.apply(this.tpl, data);

            this.after(nbn.$)

            // moving slots back
            for(slotName in slots){

                // removing slots from top level
                var os = this.slot(slotName).$, idx;
                if((idx = this.$.index(os)) != -1){
                    this.$.splice(idx, 1);
                }
                if(slots.hasOwnProperty(slotName)){
                    var ns = nbn.slot(slotName).$;
                    // adding slots to top level of the new html
                    if((idx = nbn.$.index(ns)) != -1){
                        nbn.$.splice(idx, 1, this.slot(slotName).$[0]);
                    }
                    ns.before(this.slot(slotName).$)
                    .remove();
                }
                this._onRefresh(nbn.$, data);
            }

            this.$.remove();
            this.$s = nbn.$s;
            this.$e = nbn.$e;
            this.$n = nbn.$n.data('_bn', this);
            this.$ = nbn.$;
            //            }

            this._dirty = false;
        // end of refresh
        },
        slot: function(name){
            return this._slots[name];
        }
    }

    var BeardSlot = function(tplPath, objId, parentNode, $n){
        if(tplPath){
            this.tpl = getTplFunction(tplPath);
        }
        this.parent = parentNode;
        this.$ = $n;
        this.nodes = [];
        this.hash = {};
        this._loading = 0;
        this._refreshIdx = -1;
        if(objId){
            this.init(objCache[objId]);
        }
    }
    BeardSlot.prototype = {
        init: function(raw){
            this.$.html('');
            //            // this object has been loaded and should not be loaded again
            //            if('_slotdata' in raw) return;
            //            // clear the embeded slot data to prevent memory leaking
            //            if(this.raw)this.raw._slotdata = null;
            //            // re-embed slot data to the new raw object
            //            this.raw = raw;
            //            raw._slotdata = this.nodes;

            // repare the queue
            var t = this, queue = [];
            Beard.utils.loop(raw, function(data){
                queue.push(data);
            })

            this.append(queue);
        },
        refresh: function(deepRefresh, extra){
            var t = this;

            // this if for over write the refresh mode
            // if the previous refresh mode is shallow
            // it must be replaced by a deep refresh
            if(deepRefresh)
                t.deepRefresh = true;

            t._extra = extra;
            if(t._refreshIdx != -1){
                t._refreshIdx = 0;
                return;
            } else {
                t._refreshIdx = 0;
                Beard.thread(function(run){
                    if(t._destroyed) return true;
                    for(var i = 0; i < run; i++){
                        if(t._refreshIdx >= t.nodes.length){
                            t._refreshIdx = -1;

                            // set the refresh mode as shallow, if it is set as deep explicitly
                            t.deepRefresh = false;
                            return true;
                        }
                        t.nodes[t._refreshIdx++].refresh(t.deepRefresh, t._extra);
                    }
                    return false;
                }, true);
            }
        },
        index: function(bn){
            // finding the index of a beard node,
            // -1 will be returned if beard node is not found in a slot
            var seq = this.nodes,
            l = seq.length;
            while(l--){
                if(seq[l] === bn){
                    return l;
                }
            }
            return -1;
        },
        _remove: function(pos, len, keepDom){
            // pos can be a beard node
            if(pos instanceof BeardNode){
                pos = this.index(pos);
            }

            // set len = 1 if it is not set or 0
            if(!len) len = 1;

            // first we remove the nodes from the array
            var ret = this.nodes.splice(pos, len);

            var l = ret.length;
            while(l--){
                // remove the beard nodes from hash
                delete this.hash[ret[l].id()];

                // if dom is to be deleted
                if(!keepDom){
                    ret[l].remove();
                }
            }
        },
        _resetParent: function(bn){
            // check the item's parent
            // if is not this, remove it from its parent
            // if is this, then set it as null in current position and set thisflag = true
            if(bn.__slot){
                if(bn.__slot === this){
                    this.nodes[this.index(bn)] = null;
                    return true;
                } else {
                    bn.__slot._remove(bn, 1, true);
                    bn.__slot = this;
                }
            }
            return false;
        },
        insert: function(pos, obj, extra){
            // obj: beard node, raw data, a range of something
            // pos: beard node, number

            if(typeof obj == 'undefined' || obj == null) return;
            var nodes = this.nodes, hash = this.hash, thisflag = false;

            // change pos to number
            if(pos instanceof BeardNode){
                pos = this.index(pos);
            }
            
            // insertion logic:
            // toBeRemoved []
            // insert
            // reset parent

            // prepare the obj to be [ beard nodes ]
            if(obj instanceof Array){
                var l = obj.length, thisflag;
                while(l--){
                    if(obj[l] instanceof BeardNode){
                        if(!thisflag) thisflag = this._resetParent(obj[l]);
                        else this._resetParent(obj[l]);
                    }
                }
            } else {
                if(obj instanceof BeardNode)
                    thisflag = this._resetParent(obj);
                obj = [obj];
            }


            // get the anchor for dom manipulation
            for(var len = nodes.length; pos < len; pos++){
                var anc = nodes[pos];
                if(anc) break;
            }

            // remember to remove the anc later
            if(anc){
                anc = $(d.createComment('')).insertBefore(anc.$s);
            } else {
                anc = $(d.createComment('')).appendTo(this.$);
            }


            var slot = this, bn;
            this._loading ++;
            // pushing the loading task to Beard' thread
            // the function should be :
            // func ( runNum ) -> return true if finish, otherwise false
            Beard.thread(function(run){
                if(slot._destroyed) return true;
                for(var i = 0; i < run; i ++){
                    var bn = obj.shift();
                    if(typeof d == 'undefined'){
                        slot._loading --;
                        return true;
                    }
                    if(!(bn instanceof BeardNode)){
                        bn = slot.tpl.bn(bn);
                    }
                    if(!bn) continue;
                    slot.hash[bn.id()] = bn;
                    bn.__slot = slot;
                    anc.before(bn.$);
                }
                return false;
            })

            // to insert node into array
            obj.unshift(0);
            obj.unshift(pos);
            nodes.splice.apply(nodes, obj);

            // finally clear previous nodes in current slot, if thisflag = true
            if(thisflag){
                l = nodes.length;
                while(l--){
                    if(!nodes[l])
                        nodes.splice(l, 1);
                }
            }
        },
        remove: function(pos, len){
            // pos : number, array, beard node
            // range : number, default 1
            this._remove(pos, len);
        },
        //        extra: function(key, val){
        //            if(typeof val == 'undefined'){
        //                return this._extra[key];
        //            } else {
        //                this._extra[key] = val;
        //            }
        //        },
        move: function(bn, dis){
            if(!dis) return;
            var idx = this.index(bn), pos = idx + dis;
            this.insert(pos, bn);
        },
        append: function(obj){
            var pos = this.nodes.length;
            this.insert(pos, obj);
        },
        prepend: function(obj){
            this.insert(0, obj);
        },
        destroy: function(){
            this._destroyed = true;
            utils.loop(this.nodes, function(node){
                node.remove();
            })
        }
    }


    // ------ var definitions ------
    var BEARD_NODE, BEARD_PATH, BEARD_DATABIND, BEARD_REF,
    BEARD_ZONE = 'beards', BEARD_DATA, BEARD_ARGS,
    ARRAY = 'array', OBJECT = 'object',


    // selected engine. If it is undefined, the Beard has not been inited
    engineName,

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
        nodeData: 'bdata',
        nodeDatabind: 'bdatabind',
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

    isDebug = false, safeMode = true, $debug, locIndex = 0,
    canLog = typeof console != 'undefined' && typeof console.log == 'function',
    rgxTplName = /^\s*([\w\.]+)\s*(?:\(([^\)]*)\))?(?:\->\s*([\w\.]+))?\s*$/,
    rgxNewLine = /\n|\r\n|\n\r|\r/,

    tplTags, ec,
    cmpLength = function(a, b){
        if(a.length > b.length) return -1;
        else if(a.length == b.length) return 0;
        else return 1;
    },
    E = '\x1b', EE = E+E, EEE = EE + E, EEEE = EEE + E,

    // for the tpls
    Btpls = g.Btpls = {
        __tpls__: [],
        g: {}
    },

    emptyFunc = function(){
        return ''
    },
    STRING = 'string', FUNCTION = 'function',
    COMMENT_NODE = 8, ELEMENT_NODE = 1,
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
                        if(path.charAt(0) == '!'){
                            cf.b = true;
                            path = path.substr(1);
                        }
                        var m = rgxTplName.exec(path);
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
                    var tmp = cf.p.split('.');
                    pushFunction(cf.p, tmp[tmp.length - 1], f, cf.r);
                }
            } else if(typeof content == 'object' && content != null){
                prepareJsonTpls(content, '');
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
        isDebug: function(){
            return isDebug;
        },
        init: function(option){
            _options = $.extend({}, defOpts, _options, option);
            isDebug = _options.debug;

            engineName = _options.engine;

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
            BEARD_DATA = _options.nodeData;
            BEARD_DATABIND = _options.nodeDatabind;
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
        bindBeard: function($scope){
            return Beard.bindBeardOnly($scope).clearDataCache();
        },
        parseHtml: function(h){
            if(!(h instanceof jQuery)){
                h = $($('<div>' + h + '</div>').contents());
            }
            Beard.bindBeard(h);
            return h;
        },
        bindBeardOnly: function($scope){
            if(hasDataCached){
                if(!$scope){
                    $scope = $('body');
                }
                // get the bound data
                var sel = '[' + BEARD_DATA + ']';
                $scope.find(sel).union($scope.filter(sel))
                .each(function(){
                    var $t = $(this);
                    $t.bVal(objCache[$t.attr(BEARD_DATA)])
                    .removeAttr(BEARD_DATA);
                })

                bindBeardNodes($scope.map(function(){
                    return this;
                }));
            }
            return Beard;
        },
        clearDataCache: function(){
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
        reset: function(){
            operationQueue = [];
            running = false;
            firstRun = true;
            tplsByPath = {};
            objCache = {};
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
        _threads: [],
        _run: 10,
        _interval: 1,
        _thread_idx: -1,
        _quick_run: 0,
        _thread_timer: false,
        thread: function(func, unshift){
            // if the slot is short, run it straigt away
            if(this._quick_run < 10 && func(Beard._run)){
                // but if the quick run cases are too many,
                // we will still skip the rest of case and put them into thread
                this._quick_run ++
                return;
            }

            if(unshift){
                Beard._threads.unshift(func);
            } else {
                Beard._threads.push(func);
            }

            if(Beard._thread_timer == false){
                Beard._thread_timer = setTimeout(function(){
                    Beard.startThread();
                }, Beard._interval)
            }
        },
        startThread: function(){
            this._quick_run = 0;
            // iteratively run the first 4 threads
            var suiteNum = Beard._threads.length;
            suiteNum = suiteNum > 4?4:suiteNum;
            var thread_idx = (++Beard._thread_idx)%suiteNum;

            if(Beard._threads[thread_idx](Beard._run)){
                Beard._threads.splice(thread_idx, 1);
            }
            if(Beard._threads.length){
                Beard._thread_timer = setTimeout(function(){
                    Beard.startThread();
                }, Beard._interval)
            } else {
                Beard._thread_timer = false;
            }
        },
        initEvents: function(events, path, $context, action, type){
            if(!$context){
                $context = $(d);
            } else if( !$context.size()){
                utils._log(new Date().toLocaleTimeString() + 'The context is empty. Stop binding events');
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
        }
    } // end of Beard object

    var rgxNodeStart = /\#\#(\d+)\#\#/,rgxNodeEnd = /\/\/(\d+)\/\//;
    function bindBeardNodes(a){
        var m, bn, stk = [];
        for(var i = 0, len = a.length; i < len; i ++ ){
            var n = a[i];
            if(n.nodeType == COMMENT_NODE){
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
            if(n.nodeType == ELEMENT_NODE){
                bindBeardNodes(n.childNodes);
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

    
    function prepareJsonTpls(j, p){ // sc : shortcuts
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
                if(key.charAt(0) == '!'){
                    cf.b = true;
                    var tmpKey = key.substr(1);
                } else {
                    tmpKey = key
                }
                // first, parse the key
                var m = rgxTplName.exec(tmpKey);
                cf.p = p + m[1];
                cf.a = m[2];
                cf.r = m[3];
                if(cf.d){
                    prepareJsonTpls(j[key], cf.p + '.');
                }
            }
        // end of each key
        }
    }

    function loadEachScript(j){
        for(var i in j){
            if(i && j.hasOwnProperty(i)){
                var cf = j[i][''];
                Beard.loadScript(cf.t, cf, 2);
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

            var databind = $t.attr(BEARD_DATABIND);
            if(typeof databind == 'undefined') databind = '';
            else databind = '!';

            var args = $t.attr(BEARD_ARGS);
            if(!args) args = '';
            else args = '(' + args + ')';

            var $p = $t.parent().closest('['+ BEARD_NODE + ']');
            if($p.size()){
                parent = $p.data('beard-node');
            } else {
                parent = script
            }

            var t = parent[databind + path + name + args + ref] = {
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
                    utils._log(new Date().toLocaleTimeString() + ' --------------- TPL OVERWRITTEN ------------- ' + path);
                } else {
                    // tpl replacing tpl ref
                    delete parent[name].__refbys[path]; // removing refbys
                    delete parent[name];
                    delete tplsByPath[path];
                    tpl=getTplFunction(path);
                    tpl.fn = f;
                    utils._log(new Date().toLocaleTimeString() + ' --------------- TPL REF OVERWRITTEN ------------- ' + path);
                }
            } else {
                // tpl replacing nothing
                var tpl = getTplFunction(path);
                tpl.fn = f;
                utils._log(new Date().toLocaleTimeString() + ' --------------- NEW TPL CREATED ------------- ' + path);
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
                            utils._log(new Date().toLocaleTimeString() + ' --------------- RENEWING REF ------------- ' + ref + ' --to--> ' + refto);
                        }
                    }
                    clearSubTpls(otpl);
                }
            }
            tpl = f;
            // setting refbys
            f.__refbys[path] = 1;
            utils._log(new Date().toLocaleTimeString() + ' --------------- CREATE REFERENCE ------------- ' + path + ' --to--> ' + refto);
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
                utils._log(new Date().toLocaleTimeString() + ' --------------- CLEARING SUB TPL ------------- ' + path);
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
        tpl.bn = extra.getBeardNode;
        tpl._bn = extra.getTopBeardNode;
    }

    var UNDERSCORE = '_', rgxVarName = /^[a-zA-Z]\w+$/;
    function compileUtils(path, args){
        var code = ['/*\x1b*/\nif(u._edit>', utils._edit, '){return Beard._recompileTemplate(u._tplsStr["', path ,'"], "',
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

    function compileTemplate(template, path, args, databind){
        var pts = template;
        if(args){
            args += ',_e_';
        } else {
            args = 'd,_e_';
        }
        
        var argAry = args.replace(/\s/g, '').split(/,/);
        if(databind){
            var argObj = [];
            for(var i = 0, len = argAry.length; i < len; i++){
                argObj.push(i?',"':'_arg:"'+ argAry[i]+ '","'
                    , argAry[i], '":', argAry[i]);
            }
            argObj = argObj.join('');
        }

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

        code = ['var e=typeof _e_=="undefined"?{}:_e_,u=Beard.utils,o=[],t=this,g=Btpls.g',
        databind?',__aobj={'+argObj+',tpl:t,__name:t.__name,__path:t.__path};u._objId(__aobj);':';',
        'if(typeof e=="object")e.def=u._defVal;function out(){o.push.apply(',
        'o, arguments);}',
        compileUtils(path, args),
        'try{',
        databind?'if(u.__dataMode)o.push("<!--##",__aobj.__objid_,"##-->");':'',
        isDebug?'u.log(new Date().toLocaleTimeString() + " Level @" + (u.__level++) + "  ------ START : <<   ' + path + '   >> ------");':'',
        code,
        isDebug?';u.log(new Date().toLocaleTimeString() + " Level @" + (--u.__level) + "  ###### END : <<   ' + path + '   >> ######");':'',
        databind?';if(u.__dataMode)o.push("<!--//",__aobj.__objid_,"//-->");':';',
        'return o.join("");',
        '}catch(e){u.log(arguments.callee.toString());log(e);throw e;}'
        ].join('');

        try{
            var F = new Function(args, code);
            F._args = argAry;
            utils._log(new Date().toLocaleTimeString() + ' ---- SUCCESS: The compiled function for template <<' + path + '>> : ---- \n\n');
            utils._log(code);
            utils._tplsStr[path] = code;
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
            var prev = utils.__dataMode;
            utils.__dataMode = true;
            var h = this.fn.apply(this, arguments);
            utils.__dataMode = prev;
            return Beard.parseHtml(h, true);
        },
        _getBeardNode: function(){
            var h = this.fn.apply(this, arguments);
            var args, data = {
                _args: args = this.fn._args
            };
            var l = args.length;
            while(l--){
                data[args[l]] = arguments[l];
            }
            var bn = new BeardNode(data);
            if(utils.__dataMode){
                bn.$ = Beard.parseHtml(h);
            } else {
                bn.$ = $($('<div>' + h + '</div>').contents());
            }
            bn.$s = bn.$.eq(0);
            bn.$e = bn.$.eq(bn.$.length-1);
            bn.$n = bn.$.filter('*').eq(0);
            bn.$n.data('_bn', bn).attr('data-bn', this.__name);
            bn._slots = {};
            bn.tpl = this;
            
            return bn
        },
        getTopBeardNode: function(){
            var bn = extra._getBeardNode.apply(this, arguments);

            bn.$.filter('[data-bs]')
            .union(bn.$.find('[data-bs]'))
            .each(function(){
                var slotName = this.getAttribute('data-bs');
                bn._slots[slotName] = new BeardSlot(null, null, bn, $(this));
            })

            return bn;
        },
        getBeardNode: function(){
            var bn = extra._getBeardNode.apply(this, arguments);

            bn.$.filter('[data-bs]')
            .union(bn.$.find('[data-bs]'))
            .each(function(){
                var slotName = this.getAttribute('data-bs');
                var $t = $(this);
                var path = this.getAttribute('data-bs-tpl'),
                slotData = this.getAttribute('data-bs-raw'),
                slot = bn._slots[slotName] = new BeardSlot(path, slotData, bn, $t);
                this.removeAttribute('data-bs-tpl');
                this.removeAttribute('data-bs-raw');
                $t.data('_bs', slot);
            })

            return bn;
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
                    $debug = $('<div id="debug" style="text-align: left;padding:12px;"></div>');
                    $('body').append($debug);
                }
                if(msg){
                    $('<div></div>').appendTo($debug)[0].innerText = '\n' + msg.toString();
                }
            }
        },
        _tplsStr: {},
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
        _objId : function(obj, nocache){
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
        slot: function(name, tpl, obj){
            var attr = [' data-bs="', name, '"'];
            if(tpl){
                attr.push(' data-bs-tpl="', tpl.__path, '"');
            }
            if(obj){
                var id = utils._objId(obj);
                attr.push(' data-bs-raw="', id, '"');
            }
            attr.push(' ');
            return attr.join('');
        },
        clear: function(obj, keys){
            keys = keys.split(/,/);
            for(var i = 0, len = keys.length; i < len; i++){
                delete obj[keys[i]];
            }
        },
        //        clone: function(obj, vals){
        //            var ret = {};
        //            for(var i in obj){
        //                if(obj.hasOwnProperty(i) && !(i in vals)){
        //                    ret[i] = obj[i];
        //                }
        //            }
        //            for(i in vals){
        //                if(vals.hasOwnProperty(i)){
        //                    ret[i] = vals[i];
        //                }
        //            }
        //            return ret;
        //        },
        _defVal: function(key, val){
            if(typeof key == "object"){
                for(var i in key){
                    if(key.hasOwnProperty(i)){
                        if(!(i in this)){
                            this[i] = key[i];
                        }
                    }
                }
            }
            if(!(key in this)){
                this[key] = val;
            }
        },
        //        _clone: function(vals){
        //            var ret = {};
        //            for(var key in this){
        //                if(this.hasOwnProperty(key) && !(key in vals)){
        //                    ret[key] = this[key];
        //                }
        //            }
        //            for(key in vals){
        //                if(vals.hasOwnProperty(key)){
        //                    ret[key] = vals[key];
        //                }
        //            }
        //            return ret;
        //        },
        sort: function(data, func){
            if(!func || typeof func == 'string'){
                func = utils._getSortFunc(func);
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
        _getSortFunc:function(funcStr){
            if(!funcStr) funcStr = 'asc';
            if(funcStr in utils._sortFuncs){
                return utils._sortFuncs[funcStr];
            }
            var cols = funcStr.split(',');
            for(var i = 0, len = cols.length; i < len; i++){
                cols[i] = $.trim(cols[i]).split(/\s+/);
            }
            var body = utils._generateSortFunc(cols, 0, cols.length - 1);
            try{
                return utils._sortFuncs[funcStr] = new Function('a,b', body);
            } catch(e){
                utils.log(body);
                return utils._sortFuncs[funcStr] = emptyFunc;
            }
        },
        _generateSortFunc: function(cols, index, len){
            var o = [];
            var col = cols[index];
            if(col[1] == 'desc'){
                var cmp1 = '>', cmp2 = '<'
            } else {
                cmp1 = '<', cmp2 = '>';
            }
            var colStr = col[0];
            o.push('try{if(a.', colStr, cmp1, 'b.', colStr, ')return -1;else if(a.', colStr, cmp2, 'b.', colStr, ')return 1;',
                'else{', index == len? 'return 0' : utils._generateSortFunc(cols, index + 1, len), '}}catch(e){return 0}');
            return o.join('');
        },
        _sortFuncs: {
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
