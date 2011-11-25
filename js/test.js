var data =  {
    name: 'jquery',
    refresh: function(tmpl, name, $elems){
        var $list = this;
        $elems.submit.click(function(){
            name = $elems.text.val();
            data.load(tmpl, name, $list);
        })
        .trigger('click');

        $elems.text
        .mouseup(function(){$(this).select()})
        .keyup(function(e){
            if(e.keyCode == 13){
                $(this).select();
                $elems.submit.trigger('click');
            }
        });

        $list.initEvents({
            '.user a': function(){
                var data = $(this).beardData();
                alert('This twitter was created at ' + data.created_at);
            }
        })
    },
    load: function(tmpl, name, $list){
        $list.html('<div class="msg"> Loading ... </div>');
        var timer = setTimeout(function(){
            $list.html(tmpl.Error());
        }, 3000);
        $.ajax({
            url: 'http://twitter.com/status/user_timeline/' + name + '.json?count=10',
            dataType: 'jsonp',
            success: function(rsp){
                clearTimeout(timer);

                $list.html(tmpl(rsp))
                .bindData();
            }
        });
    }
}

result = Btpls.Twitter(data);