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

    * Updates:
    *
    * Pop:      111019 -    support to doT
    *           111021 -    extends utils, init for your own app
    *
 */

(function(g){

    if(!g.Beard){
        var e = new Error('Beard.js must be loaded before this BeardUtils.js');
        throw e;
    }

    var tpls = Beard.__tpls;
    var utils = Beard.utils;

    Beard.extendEngines({
        // all render funcs
        'mustache': function(path, data, extra, $tpl){
            var html = Mustache.to_html(tpls[path], data);
            return html;
        }
        ,
        'doT' :function(path, data, extra, $tpl){
            if(data === null || data === undefined){
                data = {}
            }
            data.$u = Beard.utils;
            data.$t = $tpl;
            var html = tpls[path](data);
            delete data.$u;
            delete data.$t;
            return html;
        }
        ,
        'jQote2' :function(path, data, extra, $tpl){
            return $.jqote(tpls[path], [data]);
        }
        ,
        'Yajet' :function(path, data, extra, $tpl){
            return tpls[path](data);
        }
        ,
        'haml' :function(path, data, extra, $tpl){
            return tpls[path](data);
        }
    }, {
        // all compile funcs
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
        ,
        'haml': function(path, template){
            tpls[path] = Haml(template);
        }
    }, {
        // all detect funcs
        'mustache': function(){
            if(typeof Mustache != 'undefined' && typeof Mustache.to_html == 'function')
                return true;
        },
        'doT': function(){
            if(typeof g.doT != 'undefined' && typeof g.doT.template == 'function')
                return true;
        },
        'jQote2': function(){
            if(typeof $.jqotec == 'function')
                return true;
        },
        'Yajet': function(){
            if(typeof g.YAJET == 'function')
                return true;
        },
        'haml': function(){
            if(typeof g.Haml == 'function')
                return true;
        }
    })

    Beard.extendUtils({
        // utils to be extended

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
    });

    // use your own setting
    Beard.init({
        // template tag config
        // only valid for beard's own template engine
        codeOpen : '[##',
        codeClose : '#]',
        equaOpen : '[``',
        escapeOpen : '[`/',
        tagOpen : '[`:',
        equaClose : '`]',

        // html config
        nodeDef: 'data-beard',
        nodePath: 'data-beard-path',
        nodeUnwrap: 'data-beard-unwrap',
        nodeRemote: 'data-beard-remote',
        nodeData: 'data-beard-data',
        nodeShow: 'data-beard-show',
        beardZone: 'beardTemplates',
        withinZone: false,

        // compile config
        funcPre: '',
        varPre: '',
        debug: false,
        safemode: true,
        engine: 'beard'
    })

    function getDefs(node, js, path){
        var tpls = node.__tpls__;
        if(tpls.length > 0){
            var cjs = js[js.length] = [];

            cjs.push('    ' + path + ' = {');
            var body = [];
            for(var i = 0; i < tpls.length; i ++){
                body.push('        "' + tpls[i] + '" : {}');
                getDefs(node[tpls[i]], js, path + '.' + tpls[i]);
            }
            cjs.push(body.join(',\n'), '    }');
        }
    }

    g.Beard.getIDEDefs = function(toLog){
        var Btpls = g.Btpls;

        var js = [[';(function(){ \n    var Btpls;']];
        getDefs(Btpls, js, path = 'Btpls');
        js.push(['});']);
        var str = $.map(js, function(subjs){
            return subjs.join('\n');
        }).join('\n');

        if(toLog)console.log(str);
        else return str;
    }

})(window)
