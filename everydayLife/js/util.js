function _extend_Utils(ns){

    var Utils = {
        arrayToHashOnProp: function(arrayObj, prop){
            var n = {};
            if(Utils.isArray(arrayObj)){
                for(var i = 0; i < arrayObj.length; i++){
                    var item = arrayObj[i];
                    if(prop in item){
                        n[item[prop]] = item;
                    }
                }
            }
            return n;
        },
        _copyArray: function(o){
            var n = [];
            for(var i = 0; i < o.length; i++){
                if(typeof o[i] == 'object'){
                    n[i] = this.copyObject(o[i]);
                } else if(typeof o[i] != 'function'){
                    n[i] = o[i];
                }
            }
            return n;
        },
        copyObject: function(o){
            if(this.isArray(o)){
                return this._copyArray(o);
            } else {
                var n = {};
                for(var i in o){
                    if(o.hasOwnProperty(i)){
                        if(o[i] == null){
                            n[i] = null;
                        }else if(typeof o[i] == 'object'){
                            n[i] = this.copyObject(o[i]);
                        } else if(typeof o[i] != 'function'){
                            n[i] = o[i];
                        }
                    }
                }
                return n;
            }
        },
        isArray: function(obj){
            return obj.constructor == Array;
        }
    }

    $.extend(ns, Utils);
}

function countTextWords(text){
    var r = 0;
    var z

    if (text!=undefined) {
        var a=text.replace(/\s/g,' ');
        a=a.split(' ');

        for (z=0; z<a.length; z++)
        {
            if (a[z].length > 0)
                r++;
        }

        return r;
    }

    return 0;
}

function autoRun(autos){
    for(var i in autos){
        if(typeof autos[i] == 'function'){
            autos[i]();
        } else if(typeof autos[i] == 'object'){
            autos[i]();
        }
    }
}

function removeTinyMCE(id){
    if(tinyMCE.get(id) != null){
        tinyMCE.execCommand('mceFocus', false, id);
        tinyMCE.execCommand('mceRemoveControl',false,id);
    }
}

function reInitTinyMCE(opts) {
    opts = $.extend({
        readonly: false,
        selector: 'mceDynamic'
    }, opts)

    tinyMCE.init({
        mode : "textareas",
        theme: 'advanced',
        readonly: opts.readonly,
        editor_selector : opts.selector,
        editor_deselector : "mceNoEditor",
        entity_encoding : "named",
        entities : "160,nbsp",
        invalid_elements : "script,font",
        width : "100%",
        height: "100%",
        plugins : "paste,autoresize,table",
        theme_advanced_buttons1 : "bold,italic,strikethrough,underline,separator,undo,redo,separator",
        theme_advanced_buttons1_add : "bullist,numlist,separator,justifyleft,justifycenter,justifyright,justifyfull,separator,delete_table",
        theme_advanced_buttons2 : "",
        theme_advanced_buttons3 : "",
        paste_auto_cleanup_on_paste : true,
        table_styles : "Header 1=header1;Header 2=header2;Header 3=header3",
        table_cell_styles : "Header 1=header1;Header 2=header2;Header 3=header3;Table Cell=tableCel1",
        table_row_styles : "Header 1=header1;Header 2=header2;Header 3=header3;Table Row=tableRow1",
        content_css: MAPPS_URL+"/includes/specificCSS/text_editor.css?"+ new Date().getTime(),
        setup : function (ed) {

            $('#' + ed.id).removeClass(opts.selector);

            ed.onKeyUp.add(
                function (ed, evt) {
                    tinyMCEOnChange(ed);
                }
                );

            ed.onMouseUp.add(
                function (ed, evt) {
                    tinyMCEOnChange(ed);
                }
                );

            ed.onChange.add(
                function (ed, evt) {
                    tinyMCEOnChange(ed);
                }
                );


            ed.onSubmit.add(
                function (ed, evt) {
                    tinyMCE.triggerSave();
                }
                );

            ed.onInit.add(
                function (ed, evt) {
                    //console.log(ed.id+" has been binded to blur");
                    tinyMCE.dom.Event.add(ed.getWin(),"blur",function(e) {
                        $("#"+ed.id).trigger("blur");
                    });

                    if (typeof recountWords=="function") {
                        recountWords(ed.id);
                    }

                });
        } // end of setup function
    }); // end of tiny init
    
}

function resetTextEditor(editorId) {
    if (tinyMCE.get(editorId)!==undefined) {
        var content = tinyMCE.get(editorId).getContent();
        tinyMCE.get(editorId).setContent(content);
    }
}

function extend_UIs_niceButton(ns){
    var UIs = {
        niceButton: function(type, text, cls, id){
            var t = Tog('a.button').cls(type);
            if(id) t.id(id);
            if(cls) t.cls(cls);
            return t.Span().cont(text).html();
        }
    };

    $.extend(ns, UIs);
}

function extend_msg(target){
    var msg = {
        error : 'The operation cannot be executed at the moment. There might be an error occurred.\nPlease let us know by providing feedback, (See the link at the bottom of the page)\nand try again later.'
    }
    $.extend(target, msg);
}


;
(function(w){

    /**
     * the row[2] should always be the total number
     * @param $text the text box to become an autocomplete text box
     * @param extra the extra params to be passed
     * @param urlOrData the url to search
     * @param formatItemCallBack (row, i, total)
     * @param formatResultCallBack (row)
     * @param durtyTextCallBack ()
     * @param resultCallBack (data)
     * @param isRemote => delay, minChars to query
     */
    function fn($text, extra, urlOrData,
        formatItemCallBack, formatResultCallBack,
        durtyTextCallBack ,resultCallBack, isRemote){

        isRemote = setDefault(isRemote, true);
        if(isRemote){
            var delay = 200;
            var minChars = 2;
        } else {
            delay = 0;
            minChars = 0;
        }

        $text
        .autocomplete_sec(urlOrData, {
            isLongList: isRemote,
            minChars: minChars,
            cacheLength: 20,
            max: 30,
            delay: delay,
            width: $text.width() + 8,
            scrollHeight: 400,
            matchContains: true,
            autoFill: false,
            extraParams:extra,
            // the row[2] should always be the total number
            formatItem: function(row, i, max) {
                if(isRemote){
                    var total = row[2];
                } else{
                    total = urlOrData.length;
                }
                $text.attr('total', total);
                if(total >99) total = "99+";
                else {
                    if(max < 30) total = max;
                }
                return formatItemCallBack(row, i, total);
            },
            formatResult: formatResultCallBack //function(row) {
        })
        .keyup(function(e){
            if (e.keyCode != 9 && e.keyCode != 13 && e.keyCode != 16) {
                durtyTextCallBack();
            }
            if($(this).attr('total') > 30){
                $(this).flushCache();
            }
        })
        .result(function(event, data){
            resultCallBack(data)
        }); // resultCallBack (data)
    }

    autocompleteInits = {
        orgunit: function($text, $hidden, url, callback){
            fn($text, {
                action:'orgunit'
            }, url
            ,function(row, i, total){
                return i+'/'+total+': '+row[0];
            },
            function(row){
                return row[0];
            },
            function(){
                $hidden.val('');
                $hidden.trigger('change');
                if(callback) callback();
            },
            function(data){
                $hidden.val(data[1]);
                $hidden.trigger('change');
                if(callback) callback();
            });
        }
    }


})(window);

;
(function(){

    var events = {};
    var ajax = {};
    var funcs = {
        'common.phoneNumber': function(value, $n){
            if(value.trim() == ''){
                $n.icontip('none');
            } else {
                var reg = new RegExp('^\\+?[\\d ]{4}[\\d ]+$');
                if($.trim(value).match(reg)){
                    $n.icontip('ok', 'ok');
                } else {
                    $n.icontip('error', "Phone number contains only + 0-9 and space<br/>",
                        "e.g., +6129387171 or 02 9349 9238<br/>", "9329 9283 is short for +61 2 9329 9283")
                }
            }
        },
        'common.org.parent':function(value, $n){
            if($.trim(value) == ''){
                $n.icontip('error', 'Please type in the text box and select one org unit from the list');
            } else {
                $n.icontip('ok', 'ok');
            }
        },
        'common.org.abbr':function(value, $n){
            if(value.trim() == ''){
                $n.icontip('error', 'The abbreviation should not be empty');
            } else {
                $n.icontip('ok','ok');
            }
        },
        'common.org.fullname':function(value, $n, $t, extra){
            if($.trim(value) == extra.oldname){
                $n.icontip('ok', 'Remain no changed');
                return;
            }
            if(ajax.checkOrgFullname == null){
                ajax.checkOrgFullname = new AjaxActions(extra.url, 'checkOrgFullname');
            }
            var a = ajax.checkOrgFullname;
            a.doPost({
                'fullname': value
            }, {
                'success': function(){
                    $n.icontip('ok', 'ok');
                },
                'taken': function(){
                    $n.icontip('error', 'This name has been taken, please check and enter another name.')
                },
                'empty':function(){
                    $n.icontip('error', 'The full name cannot be empty.');
                },
                'error': function(){
                    $n.icontip('error', 'Cannot validate the full name at the moment, <br/>please try again later or ',
                        'let us know the exception by providing feedback.')
                }
            })
        },
        'common.email': function(value, $n){
            if($.trim(value)== ''){
                $n.icontip('none');
            }else {
                var reg = new RegExp('^[\\w\\.]+@\\w+\\.[\\w\\.]+$');
                if($.trim(value).match(reg)){
                    $n.icontip('ok', 'ok');
                } else {
                    $n.icontip('error', "A valid email should be like 'someone.foo@bar.com'.")
                }
            }
        },
        'common.website':function(value, $n){
            if($.trim(value) == ''){
                $n.icontip('none');
            } else {
                var reg = new RegExp('^(http\\://|https\\://)?([\\w\\-~]+\\.)*[\\w~\\-]+(\\:\\d+)?(/[\\w~\\.\\-]+)*/?(\\?.+)?$');
                if($.trim(value).match(reg)){
                    $n.icontip('ok', 'ok');
                } else{
                    $n.icontip('error', "This field is not mandatory, <br/>",
                        "however, a possible website could be 'http://www.google.com'<br/>",
                        "You can only type in 'www.google.com' of course.");
                }
            }
        }
    };
    var noticeFuncs = {
        'next': function($target){
            return $target.next();
        }
    }


    function live(v, i){
        events[i] = v;
        if(typeof v.func != 'function'){
            v.func = funcs[v.func];
        }
        if(typeof v.notice == 'function'){
            $(i).live(v.trigger, function(){
                var $target = $(this);
                var value = $target.val();
                var prev = $target.data('icon_tip_prev_value');
                if(prev != value){
                    var $notice = v.notice($target);
                    $notice.icontip('loading', 'Validating value ...');

                    delayRun(i+'@'+v.trigger, function(){
                        v.func(value, $notice, $target, v.extra);
                        $target.data('icon_tip_prev_value', value);
                    })
                }
            })
        } else if(typeof v.notice == 'object'){
            $(i).live(v.trigger, function(){
                var $target = $(this);
                var value = $target.val();
                var prev = $target.data('icon_tip_prev_value');
                if(prev != value){
                    var $notice = v.notice;
                    $notice.icontip('loading', 'Validating value ...');

                    delayRun(i+'@'+v.trigger, function(){
                        v.func(value, $notice, $target, v.extra);
                        $target.data('icon_tip_prev_value', value);
                    })
                }
            })
        // end of notice not function
        } else {
            $(i).live(v.trigger, function(){
                var $target = $(this);
                var value = $target.val();
                var prev = $target.data('icon_tip_prev_value');
                if(prev != value){
                    var $notice = noticeFuncs[v.notice]($target);
                    $notice.icontip('loading', 'Validating value ...');

                    delayRun(i+'@'+v.trigger, function(){
                        v.func(value, $notice, $target, v.extra);
                        $target.data('icon_tip_prev_value', value);
                    })
                }
            })
        }
    }

    inputIconValids = {};

    /**
     * <pre>
     * to bind validation functions:
     * valids = {
     *      '{the selector for jquery}': {
     *          trigger: 'keyup',
     *          notice:
     *              'next' -> see noticeFuncs in inputIconValid in util.js
     *              $('someJqueryObj')
     *              function($target){return $target.next()} -> $target could be the target text box
     *          func:
     *              the function to process validation
     *                  a func could have
     *                  input params :
     *                  value, $notice, $target, extra
     *          extra:{
     *              'ok': 'some notice when it is ok',
     *              'error': 'some notice when it is error'
     *          }
     * }
     *
     *
     * }
     */
    inputIconValids.live = function(valids){
        for(var i in valids){
            if(valids.hasOwnProperty(i)){
                var valid = valids[i];
                live(valid, i);
                $(i).trigger(valid.trigger);
            }
        // end of for each valid
        }
        return inputIconValids;
    }


    inputIconValids.die = function(valids){
        for(var i in valids){
            if(valids.hasOwnProperty(i)){
                $(i).die(valids[i].trigger);
                delete events[i];
            }
        }
        return inputIconValids;
    }

    inputIconValids.setUrl = function(url){
        $.icontip.setUrl(url);
        return inputIconValids;
    }

    /**
     * <pre>
     * validateFuncs :
     * a func could have
     * input params :
     * value, $notice, $target, msg
     *
     * and should return a string reporting the error
     * or an empty string to indicate no error
     *
     */
    inputIconValids.load = function(validateFuncs){
        if(typeof validateFuncs == 'object'){
            for(var i in validateFuncs){
                if(validateFuncs.hasOwnProperty(i)){
                    funcs[i] = validateFuncs[i];
                }
            }
        }
        return inputIconValids;
    }
})()

function isAnyValueEmpty(val){
    for(var i = 0; i < arguments.length; i++){
        if(arguments[i] == undefined || arguments[i] == null || $.trim(arguments[i]) == ''){
            return true;
        }
    }
    return false;
}


;
(function(){
    jQuery.fn.saveFirstValues = function(){
        jQuery(this).find('input:text,input:hidden,select,textarea').each(function(){
            var $t = jQuery(this);
            $t.data('first_value', $t.val());
        })
        jQuery(this).find('input:checkbox,input:radio').each(function(){
            var $t = jQuery(this);
            $t.data('first_value', $t.is(':checked'));
        })
    }
    jQuery.fn.resetFirstValues = function(){
        jQuery(this).find('input:text,input:hidden,select,textarea').each(function(){
            var $t = jQuery(this);
            $t.val($t.data('first_value'))
        })
        jQuery(this).find('input:checkbox,input:radio').each(function(){
            var $t = jQuery(this);
            if($t.data('first_value')){
                $t.attr('checked', '');
            } else {
                $t.attr('checked', null);
            }
        })
    }
})()



var delayRun = (function(){

    var delayRuns = {};
    var allFuncs = {};

    var f = function (id, func, delay){
        if(delay == undefined) delay = 200;
        if(delayRuns[id] != null){
            clearTimeout(delayRuns[id]);
            delete delayRuns[id];
            delete allFuncs[id];
        }
        allFuncs[id] = func;
        delayRuns[id] = setTimeout(function(){
            func();
            delete allFuncs[id];
            delete delayRuns[id];
        }, delay);
    }

    f.flush = function(){
        for(var i in delayRuns){
            if(delayRuns.hasOwnProperty(i)){
                clearTimeout(delayRuns[i]);
                allFuncs[i]();
                delete delayRuns[i];
                delete allFuncs[i];
            }
        }
    };

    return f;
})();

