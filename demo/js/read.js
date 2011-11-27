$(function(){
    var $body = Addrbook.$body
    , $content = $body.find('#content .inner');

    var id = Addrbook.url.id,
    item = Addrbook.hash[id];

//    debugger;

    if(!item){
        Addrbook.goBack();
        return;
    }

    Beard.remote('read.html')
    .ready(function(){
        $content.html(Btpls.Content.Read(item))
        .initEvents({
            'go back to the list //.back': function(){
                Addrbook.goBack();
            },
            'edit the current item //.edit': function(){
                Addrbook.refreshPage('edit/' + item.id);
            },
            'remove the current item //.remove': function(){
                if(confirm('Are you sure of removing the current item?')){
                    Addrbook.remove(item);
                    Addrbook.goBack();
                }
            }
        })

        Addrbook.centerImg($content.find('img'));
    })
})