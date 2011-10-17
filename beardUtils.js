(function(g){

    if(!g.Beard){
        var e = new Error('Beard.js must be loaded before this BeardUtils.js');
        throw e;
    }

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
