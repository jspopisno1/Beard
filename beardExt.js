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
 * Pop:      111019 -       support to doT
 *           111021 -       extends utils, init for your own app
 *           111031 -       remove support to other engines
 *
 */

(function(g){

    if(!g.Beard){
        var e = new Error('Beard.js must be loaded before this BeardUtils.js');
        throw e;
    }

    var tpls = Beard.__tpls;
    var utils = Beard.utils;


    Beard.extendUtils({
        // utils to be extended
        
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
        //        nodeDef: 'data-beard',
        //        nodePath: 'data-beard-path',
        //        nodeUnwrap: 'data-beard-unwrap',
        //        nodeRemote: 'data-beard-remote',
        //        nodeData: 'data-beard-data',
        //        nodeShow: 'data-beard-show',
        //        beardZone: 'beardTemplates',
        //        withinZone: false,

        // compile config
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



