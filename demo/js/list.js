$(function(){
    var $body = Addrbook.$body
    , $content = $body.find('#content .inner');
    //    debugger;

    Beard
    .remote('list.html')
    .ready(function(){
        var tmpl = Btpls.Content.List;

        tmpl.extend('Setup', function(item, $t){
            // to setup each list item
            // this is to demonstrate how callback works

            $t.initEvents({
                'When the mouse hovers on an item //@mouseenter:bind' : function(){
                    $t.addClass('hover');
                },
                'When the mouse leave an item //@mouseleave:bind' : function(){
                    $t.removeClass('hover');
                },
                'When click to read the item //@:bind': function(){
                    Beard.utils.log(item);
                    g.location.hash = '#read/' + item.id;
                    Addrbook.refreshPage();
                }
            })

            Addrbook.centerImg($t.find('img'));
        })

        $content
        .html(tmpl(Addrbook.data))
        .bindData()
        .initEvents({
            'creating a new entry //.create': function(){
                Addrbook.refreshPage('create');
            }
        });
    });

})