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
    * Liang:    111113 -    This is the advanced features for beard.js
    */

;
(function(g, d, undefined){
    if(!g.Beard){
        var e = new Error('Beard\s core should be loaded before its extension. ');
        throw e;
    }

    var utils = g.Beard.utils;
    
    (function(){
        function extendJQueryMethod(){
            $.fn.extend({
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
                slotUp: function(name){
                    var n = this.nodeUp();
                    while(true){
                        var slot = n.parentSlot();
                        if(slot && (!name || slot.name == name)){
                            return slot;
                        }
                        if(!slot) return slot;
                        else n = slot.parentNode();
                    }
                }
            })
        }

        extendJQueryMethod();
    })()

    var BeardNode = function(data, extra){
        this._data = data;
        this.id();
        this.tpl = null;
        this.__name = null;
        this.__slot = null;
    }

    function _sel(name){
        return name?'[data-bn="' + name + '"]':'[data-bn]';
    }
    function _data(data){
        if(data instanceof BeardNode){
            return data.$;
        } else if(!(data instanceof $)){
            return $(data);
        }
        return data;
    }
    BeardNode.prototype = {
        tplName: function(){
            return this.__name;
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
        data: function(deep){
            var data = this._data;
            if(deep){
                var slots = this._slots;
                for(var name in slots){
                    if(slots.hasOwnProperty(name)){
                        if(typeof data != 'object' || data == null){
                            data = {
                                '': data
                            }
                        }
                        data[name] = slots[name].data(deep);
                    }
                }
            }
            // *** to modify this method
            return data;
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
            if(isTemp)this.$.appendTo(Beard.$hidden());
            else this.$.remove();
            var slots = this._slots;
            for(var i in slots){
                if(slots.hasOwnProperty(i)){
                    slots[i].destroy();
                }
            }
            if(this.__slot){
                delete this.__slot.hash[this.id()];
                this.__slot._length[this.__name] --;
                this.__slot._length[''] --;
                this.__slot = null;
            }
        },
        wrapData: function(){
            return this.$.wrapData();
        },
        id: function(){
            if(!this.__objid_){
                utils.__objId(this, true);
            }
            return this.__objid_;
        },
        refresh: function(deepRefresh, extra){
            var slots = this._slots;

            if(deepRefresh){
                for(var slotName in slots){
                    if(slots.hasOwnProperty(slotName)){
                        slots[slotName].refresh(true, extra);
                    }
                }
            } 

            var nbn = this.tpl._bn(this.data(), extra);
            this.$e.after(nbn.$)

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
            }
            if(this.tpl._onRefresh) this.tpl._onRefresh(nbn.$, this.data(), this.extra, this);

            this.$.remove();
            this.$s = nbn.$s;
            this.$e = nbn.$e;
            this.$n = nbn.$n.data('_bn', this);
            this.$ = nbn.$;
        // end of refresh
        },
        slot: function(name){
            return this._slots[name];
        },
        parentSlot: function(){
            return this.__slot;
        },
        appendTo: function(target){
            if(target instanceof $) this.$.appendTo(target);
            else this.$.appendTo($(target));
            return this;
        },
        prependTo: function(target){
            if(target instanceof $) this.$.prependTo(target);
            else this.$.prependTo($(target));
            return this;
        },
        insertAfter: function(target){
            if(target instanceof $) this.$.insertAfter(target);
            else this.$.insertAfter($(target));
            return this;
        },
        insertBefore: function(target){
            if(target instanceof $) this.$.insertBefore(target);
            else this.$.insertBefore($(target));
            return this;
        }
    }

    var BeardSlot = function(tplPath, objId, parentNode, $n, slotName){
        this._length = {
            '': 0
        };
        if(tplPath){
            this.tpl = Beard._getTplFunction(tplPath);
            this._tplName = this.tpl.__name;
            this._length[this._tplName] = 0;
            this.name = slotName;
        }
        this._parent = parentNode;
        this.$ = $n;
        this.hash = {};
        this._loading = 0;
        this._refreshIdx = -1;

        this._queues = {};
        this._queueSeq = 1;
        if(objId){
            this.init(Beard._objCache[objId]);
        }
    }
    BeardSlot.prototype = {
        parentNode: function(){
            return this._parent;
        },
        init: function(raw){
            this.$.html('');

            // repare the queue
            var t = this, queue = [];
            Beard.utils.loop(raw, function(data){
                queue.push(data);
            })

            this.append(queue);
        },
        refresh: function(deepRefresh, extra, skipReset){
            var t = this;

            // this if for over write the refresh mode
            // if the previous refresh mode is shallow
            // it must be replaced by a deep refresh
            if(deepRefresh)
                t.deepRefresh = true;

            t._extra = extra;
            // need to generate a list of keys from the hash
            if(!skipReset) t._nodes = this.nodes();
            
            if(t._refreshIdx != -1){
                t._refreshIdx = 0;
                return;
            } else {
                t._refreshIdx = 0;
                Beard.thread(function(run){
                    if(t._destroyed) return 1;
                    for(var i = 0; i < run; i++){
                        if(t._refreshIdx >= t._nodes.length){
                            t._refreshIdx = -1;

                            // set the refresh mode as shallow, if it is set as deep explicitly
                            t.deepRefresh = false;
                            t._nodes = [];
                            return i?i:1;
                        }
                        t._nodes[t._refreshIdx++].refresh(t.deepRefresh, t._extra);
                    }
                    return 0;
                }, true);
            }
        },
        nodes: function(name, index, length){ // *** need to change
            if(!index || index < 0) index = 0;
            // finding the index of a beard node,
            // -1 will be returned if beard node is not found in a slot
            var bns = this.$.children(name? '[data-bn="' + name + '"]': '[data-bn]'),
            nodes = [], l = bns.size();
            if(length) {
                length = index + length;
                if(length > l) length = l;
            } else {
                length = l;
            }

            for(var i = index; i < length; i++){
                nodes.push(bns.eq(i).data('_bn'));
            }
            return nodes;
        },
        index: function(bn, nodes){
            if(!nodes){
                nodes = this.nodes(bn._name);
            }
            if(typeof nodes == 'string'){
                nodes = this.nodes(nodes);
            }
            var l = nodes.length;
            while(l--){
                if(nodes[l] === bn){
                    return l;
                }
            }
            return -1;
        },
        size: function(name){
            if(typeof name == 'undefined') name = this._tplName;
            return this._length[name];
        },
        _resetParent: function(bn){
            // check the item's parent
            // if is not this, remove it from its parent
            // if is this, then set it as null in current position and set thisflag = true
            if(bn instanceof BeardNode && bn.__slot){
                if(bn.__slot !== this){
                    delete bn.__slot.hash[bn.id()];
                    bn.__slot = this;
                    if(bn.__name in this._length){
                        this._length[bn.__name] ++;
                    } else {
                        this._length[bn.__name] = 1;
                    }
                    this._length[''] ++;
                }
            } else {
                this._length[''] ++;
                this._length[this._tplName] ++;
            }
        },
        queues: function(){
            var q = [], qs = this._queues;
            for(var i in qs){
                if(qs.hasOwnProperty(i)){
                    q.push(qs[i]);
                }
            }
            return q;
        },
        isLoading: function(){
            return this._loading != 0;
        },
        _insert: function(anc, queue, e){
            // prepare the obj to be [ beard nodes ]
            if(queue instanceof Array){
                var l = queue.length;
                while(l--){
                    this._resetParent(queue[l]);
                }
            } else {
                this._resetParent(queue)
                queue = [queue];
            }

            queue._slot = this;
            queue.spliceQueue = extra.spliceQueue;

            var slot = this;
            this._loading ++;
            var idx = this._queueSeq++;
            this._queues[idx] = queue;

            // pushing the loading task to Beard' thread
            // the function should be :
            // func ( runNum ) -> return true if finish, otherwise false
            Beard.thread(function(run){
                if(slot._destroyed) return 1;
                for(var i = 0; i < run; i ++){
                    var bn = queue.shift();
                    if(typeof bn == 'undefined'){
                        slot._loading --;
                        anc.remove();
                        delete slot._queues[idx];
                        return i?i:1;
                    }
                    if(!(bn instanceof BeardNode)){
                        bn = slot.tpl.bn(bn, e);
                    }
                    if(!bn) continue;
                    slot.hash[bn.id()] = bn;
                    bn.__slot = slot;
                    anc.before(bn.$);
                }
                return 0;
            })
        },
        data: function(deep, name){
            if(typeof name == 'undefined') name = this._tplName;
            var data = {
                _seq: []
            }, nodes = this.nodes(name);
            for(var i = 0, len = nodes.length; i < len; i++){
                var n = nodes[i], id = n.id();
                data[id] = n.data(deep);
                data._seq.push(id);
            }
            return data;
        },
        insertAfter: function(pos, queue, extra){
            if(typeof queue == 'undefined' || queue == null) return;

            var anc = $(d.createComment(''));
            // change pos to number
            if(pos instanceof BeardNode){
                anc.insertAfter(pos.$e);
            } else if (pos != null && typeof pos != 'undefined'){
                anc.insertAfter(pos.eq(-1));
            } else {
                anc.prependTo(this.$);
            }
            this._insert(anc, queue, extra);
        },
        insertBefore: function(pos, queue, extra){
            // obj: beard node, raw data, a range of something
            // pos: jquery object, beard node

            if(typeof queue == 'undefined' || queue == null) return;

            var anc = $(d.createComment(''));
            // change pos to number
            if(pos instanceof BeardNode){
                anc.insertBefore(pos.$s);
            } else if (pos != null && typeof pos != 'undefined'){
                anc.insertBefore(pos.eq(0));
            } else {
                anc.appendTo(this.$);
            }
            this._insert(anc, queue, extra);
        },
        move: function(bn, dis, name){
            if(!dis) return;
            if(!name) name = bn._name;
            if(dis > 0){
                var pos = bn.nextAll(name).eq(dis);
            } else {
                pos = bn.prevAll(name).eq(dis * -1);
            }
            this.insert(pos, bn);
        },
        append: function(obj, extra){
            this.insertBefore(null, obj, extra);
        },
        prepend: function(obj, extra){
            this.insertAfter(null, obj, extra);
        },
        destroy: function(){
            this._destroyed = true;
            utils.loop(this.nodes, function(node){
                node.remove();
            })
        }
    }


    // ------ end of var definitions ------

    var Beard = {
        _threads: [],
        _run: 10,
        _interval: 1,
        _thread_idx: -1,
        _quick_run: 0,
        _thread_timer: false,
        thread: function(func, unshift){

            // !! func:
            // should accept a number to indicate how many runs are allowed in a single call
            // if the case has not finished, return 0
            // otherwise the number of runs

            // if the quick run cases are too many
            // we will still skip the rest of case and put them into thread
            if(this._quick_run < 50){
                // if the slot is short, run it straigt away
                var ret = func(Beard._run);
                if(ret){
                    Beard._quick_run += ret;
                } else {
                    Beard._quick_run += Beard._run;
                }

                if(ret)
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
        }
    } // end of Beard object


    var extra = {
        // extra function for the queue of a slot
        spliceQueue: function(index, length, data){
            // this method is for adding or removing queue data from a slot queue
            if(!(data instanceof Array)){
                if(typeof data != 'undefined') data = [data];
                else data = [];
            }
            var added = data.length;
            var slot = this._slot;
            slot._length[slot._name] += added - length;
            slot._length[''] += added - length;

            data.unshift(index, length);
            this.splice.apply(this, data);
        },

        // extra functions for init tpl func
        initTplFunc: function(tpl){
            tpl._bn = extra.getTopBeardNode;
            tpl.bn = extra.getBeardNode;
            tpl.onRefresh = extra.onRefresh;
        },
        _pending_beard_node: 0, // for avoiding the data cache to be emptied too soon
        _getBeardNode: function(data, e, isTop){
            var h = this.fn(data, e);
            var bn = new BeardNode(data, e);
            bn.$ = $($('<div>' + h + '</div>').contents());
            bn.$s = bn.$.eq(0);
            bn.$e = bn.$.eq(bn.$.length-1);
            bn.$n = bn.$.filter('*').eq(0);
            bn.$n.data('_bn', bn).attr('data-bn', this.__name);
            bn.__name = this.__name;
            bn._slots = {};
            bn.tpl = this;

            extra._pending_beard_node ++;

            bn.$.filter('[data-beard-mark]')
            .union(bn.$.find('[data-beard-mark]'))
            .each(function(){
                var slotName = this.getAttribute('data-bs');
                if(slotName){
                    if(!isTop){
                        var $t = $(this);
                        var path = this.getAttribute('data-bs-tpl'),
                        slotData = this.getAttribute('data-bs-raw'),
                        slot = bn._slots[slotName] = new BeardSlot(path, slotData, bn, $t, slotName);
                        this.removeAttribute('data-bs-tpl');
                        this.removeAttribute('data-bs-raw');
                        $t.data('_bs', slot);
                    }else {
                        bn._slots[slotName] = new BeardSlot(null, null, bn, $(this));
                    }
                } else {
                    $(this).beardVal(Beard._objCache[this.getAttribute("data-beard-data")]);
                    this.removeAttribute("data-beard-data");
                }
                this.removeAttribute('data-beard-mark');
            })

            extra._pending_beard_node --;
            if(!extra._pending_beard_node) Beard._objCache = {};
            
            return bn
        },
        getTopBeardNode: function(data, e){
            return extra._getBeardNode.call(this, data, e, true);
        },
        getBeardNode: function(data, e){
            return extra._getBeardNode.call(this, data, e);
        },
        onRefresh: function(func){
            // func( jQuery object, new data, new extra, beard node )
            if(typeof func == 'function'){
                this._onRefresh = func;
            }
        }
    }


    Beard = $.extend(g.Beard, Beard);
    $.extend(g.Beard._extra, extra);
    

    var log = utils.log;

})(window, document)
