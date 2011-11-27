var g = window;

$(function(){
    var 
    ts = new Date().getTime()
    ;
    
    Addrbook.$body = $('body')
    
    Beard
    .init({
        debug: false
    })
    if(Beard.hostUrl().indexOf('github') != -1){
        Beard.url('demo/tmpls', 7)
    } else {
        Beard.url('/demo/tmpls', 7)
    }

    if(!g.localStorage){
        Addrbook.refreshPage('empty');
        return;
    }

    g.localStorage.removeItem('addrbook');

    Addrbook.data = $.parseJSON(g.localStorage.getItem( "addrbook" ));
    if(Addrbook.data){
        Addrbook.idSeq = Number(g.localStorage.getItem('addrbook_idSeq'));
        var rsp = Addrbook.data, i = rsp.length, l = i - 1;
        while(i--){
            Addrbook.hash[rsp[i].id] = rsp[i]
        }
        Addrbook.refreshPage();
    }else {
        $.ajax({
            'url': 'data_2.json?' + ts,
            success: function(rsp){
                rsp = $.parseJSON(rsp);
                Addrbook.data = rsp;
                var i = rsp.length, l = i - 1;
                while(i--){
                    rsp[l-i].id = Addrbook.idSeq ++;
                    Addrbook.hash[rsp[l-i].id] = rsp[l-i]
                }
                Addrbook.refreshPage();
                Addrbook.save();
            },
            dataType: 'text'
        })
    }

    Addrbook.onRefreshPage();
})

if('onhashchange' in g){
    g.onhashchange = function(){
        Addrbook.onRefreshPage();
    }
}

var Addrbook = {
    actions: {},
    hasStorage: true,
    $body: null,
    url: {},
    parseUrl: function(){
        var hash = g.location.hash.substr(1), url = hash.split('/');
        url[0] = url[0] || 'list';
        return Addrbook.url = {
            act: url[0],
            id: url[1]
        }
    },
    data:  null,
    hash: {},
    save: function(item){
        if(item && item.id == -1){
            item.id = this.idSeq ++;
            this.data.push(item);
            this.hash[item.id] = item;
        }
        alert('before save');
        var t = JSON.stringify(this.data);
        alert(JSON.stringify(t));
        g.localStorage.setItem('addrbook_idSeq', this.idSeq);
        alert('after save id seq');
        g.localStorage.setItem('addrbook', JSON.stringify(this.data));
        alert('after save');
    },
    remove: function(item){
        var l = this.data.length;
        while(l--){
            if(this.data[l].id == item.id) this.data.splice(l, 1);
        }
        alert(item.id);
        delete this.hash[item.id];
        this.save();
    },
    history: [],
    goBack: function(){
        if('onhashchange' in g){
            g.history.go(-1);
        } else {
            this.history.pop()
            if(this.history.length > 0)
                g.location.hash = this.history[this.history.length - 1];
            else g.location.hash = '';
            this.refreshPage(false);
        }
    },
    refreshPage: function(url){
        if(url){
            g.location = '#' + url;
        }

        if(!('onhashchange' in g)){
            this.onRefreshPage();
            if(url !== false) this.history.push(g.location.hash);
        }

    },
    onRefreshPage: function(url){
        if(Addrbook.bStorage){
            var urlObj = Addrbook.parseUrl();
            var page = urlObj.act;

            if(page == 'create') {
                page = 'edit';
                urlObj.id='-1';
            }
        } else {
            page = 'empty';
        }

        Beard
        .remote('body.html')
        .ready(function(){
            //            debugger;
            Addrbook.$body.html(Btpls.Body(page));
            Addrbook.actions[page]();
        })
    },
    bStorage: true,
    idSeq: 0,
    centerImg: function($imgs){
        $imgs.each(function(){
            var $img = $(this).css({
                width: '',
                height: 120 + 'px',
                left: '',
                top: ''
            });
            $img.load(function(){
                var w = $img.width(), h = $img.height();
                if(h > w){
                    $img.css({
                        width: 120 + 'px',
                        height: ''
                    })
                    h = $img.height();
                    $img.css({
                        top: (120-h)/2 + 'px'
                    })
                } else {
                    $img.css({
                        left: (120-w)/2 + 'px'
                    })
                }
            })
        })
    }
}
