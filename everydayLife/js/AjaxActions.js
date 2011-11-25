/**
 * written by Liangliang Zheng
 * @ 2011-10-06
 *
 * for all the ajax request
 * and redirection
 */

(function(window){
    window.AjaxActions = function (url, type, isModal){
        if(type) this.type = type;
        this.url = url;
        if(isModal) this.isModal = true;
        else this.isModal = false;
    }

    function data2query(data) {
        var str = [];
        for(var p in data){
            if(typeof data[p] == 'object'){
                str.push(p + "=" + encodeURIComponent(JSON.stringify(data[p])));
            } else {
                str.push(p+ "=" + encodeURIComponent(data[p]));
            }
        }
        return str.join("&");
    }

    function getUrl(url, query, hash){
        // get hash string
        var parts = url.split('#');
        if(hash == ''){
            var hashStr = parts[1] == undefined?'': '#' + parts[1];
        } else {
            hashStr = '#' + hash;
        }

        parts = parts[0].split('?');

        // get query string
        var queryStr = parts[1] == undefined?'': parts[1];
        if(query != '' && queryStr == ''){
            queryStr = '?' + query;
        } else if(query == '' && queryStr != ''){
            queryStr = '?' + queryStr;
        } else if(query != '' && queryStr != ''){
            queryStr = '?' + query + '&' + queryStr;
        }

        // get final url string
        return [parts[0], queryStr, hashStr].join('');

    }

    AjaxActions.prototype = {
        redirectCallback: function(catagory,callbacks, rsp, data, extra){
            if(typeof callbacks == 'object'){
                if(catagory == 'conn_error'){
                    if('conn_error' in callbacks){
                        callbacks['conn_error'](rsp, data, extra);
                    } else if('error' in callbacks){
                        callbacks['error'](rsp, data, extra);
                    } else if ('default' in callbacks){
                        callbacks['default'](rsp, data, extra);
                    }
                } else {
                    if(catagory in callbacks){
                        callbacks[catagory](rsp, data, extra);
                    } else if(catagory != 'finally' && 'default' in callbacks){
                        callbacks['default'](rsp, data, extra);
                    }
                }
            }
        },
        /**
         * <pre>
         * callbacks :
         * {
         *      category: function(rsp, data, extra){}
         * }
         *
         * pre-set category :
         * conn_error
         * error
         * default
         *
         */
        doPost: function(data, callbacks, type, extra, method){
            var url = this.url;
            var ajaxAction = this;

            if(data == undefined || data == null) data = {};

            if(typeof type == 'string') data._action = type;
            else if(typeof type == 'object') {
                extra = type;
                data._action = this.type;
            }
            else data._action = this.type;

            if(extra == undefined || extra == null) extra = {};
            if(!method) method = 'POST';

            if(extra.isModal || ajaxAction.isModal){
                $.fancybox.showActivity();
            }

            for(var i in data){
                if(typeof data[i] == 'object'){
                    data[i] = JSON.stringify(data[i]);
                }
            }

            $.ajax({
                url: url,
                data: data,
                success: function(rsp){
                    if(extra.isModal || ajaxAction.isModal)
                        $.fancybox.hideActivity();
                    var flag = true;
                    try{
                        var rspJSON = JSON.parse(rsp);
                    }catch (ex){
                        flag = false;
                    }
                    if(rspJSON == null) flag = false;
                    /**
                     * flag => whether the response is a valid json response
                     * rspJSON => the json returned
                     * data => the request data
                     * extra => extra data contained
                     * rsp => debug info
                     */
                    if(!flag){
                        ajaxAction.redirectCallback('error', callbacks, rsp, data, extra);
                    } else {
                        ajaxAction.redirectCallback(rspJSON.res, callbacks, rspJSON.data, data, extra);
                    }
                },
                error:function(x, e){
                    ajaxAction.redirectCallback('conn_error', callbacks, null, data, extra);
                },
                complete: function(x, e){
                    ajaxAction.redirectCallback('finally', callbacks, null, data, extra);
                },
                dataType: 'text',
                type: method
            })

        } // end of do post
        ,
        doGet: function(data, callbacks, type, extra){
            this.doPost(data, callbacks, type, extra, 'GET');
        }
    }

    AjaxActions.util ={
        postRedirect : function(url, data, mode, hash){
            if(url == undefined || url == 'self') url = document.URL;
            else {
                if(!url.match(/^[\w]+:\/\//)){
                    url = 'http://' + url;
                }
            }

            mode = mode == undefined? 'self':mode;
            url = getUrl(url, '', hash == undefined? '': hash);


            var $form = jQuery("<form/>").attr({
                action:url,
                method:'post',
                enctype:"multipart/form-data",
                target: mode=='self'?'_self':'_blank'
            });
            for(var k in data){
                $form.append(jQuery("<input/>")
                    .attr({
                        type:'hidden',
                        name:k,
                        value: typeof data[k] == 'object'?JSON.stringify(data[k]):data[k]
                    }))
            }
            $("body").append($form);
            $form.submit();
        },
        getRedirect : function(url, data, mode, hash){
            if(url == undefined || url == 'self') url = document.URL;
            else {
                if(!url.match(/^[\w]+:\/\//)){
                    url = 'http://' + url;
                }
            }

            mode = mode == undefined? 'self':mode;
            url = getUrl(url, data2query(data == undefined? {}:data), hash == undefined? '': hash);
            switch(mode){
                case 'replace':
                    window.location.replace(url);
                    break;
                case 'self':
                    window.location.href = url;
                    break;
                case 'new':
                    window.open(url);
                    break;
            }
        },
        wrapData: function($jqr){
            var data = {};
            $jqr.find('select,input:text,input:hidden,textarea,input:password').each(function(){
                var $t = $(this);
                var name = $t.attr('name')||$t.attr('id');
                data[name] = $t.val();
            });
            $jqr.find('input:checkbox').each(function(){
                var $t = $(this);
                var name = $t.attr('name')||$t.attr('id');
                if($t.is(':checked')){
                    data[name] = true;
                } else {
                    data[name] = false;
                }
            });
            $jqr.find('input:radio').each(function(){
                var $t = $(this);
                var name = $t.attr('name')||$t.attr('id');
                if($t.is(':checked')){
                    data[name] = $t.val();
                }
            });
            return data;
        },
        goBack: function(step){
            if(!step){
                window.history.go(-1);
            } else {
                window.history.go(step * -1);
            }
        }
    }

})(window);
