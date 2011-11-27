Addrbook.actions.edit = function(){
    $(function(){
        var $body = Addrbook.$body
        , $content = $body.find('#content .inner');


        var id = Addrbook.url.id,
        item = Addrbook.hash[id];

        //    debugger;
        if(id == '-1'){
            item = {
                id: -1,
                avatar: 'img/unknown.jpg',
                "main":[
                {
                    "key": "first name",
                    "value": ""
                },

                {
                    "key": "last name",
                    "value": ""
                },

                {
                    "key": "phone",
                    "value": ""
                },

                {
                    "key": "email",
                    "value": ""
                }
                ],
                "info":[ ]
            }
        } else if(!item){
            alert('The id is unknown. Go back to the list.')
            Addrbook.refreshPage('list');
            return;
        }

        Beard.remote('edit.html')
        .ready(function(){
            var tmpl = Btpls.Content.Edit,
            e = {},
            avatarTimer = -1;
        
            if (g.File && g.FileReader && g.FileList) {
                e.fileAPI = true;
            } else {
                e.fileAPI = false;
            }
        
            $content.html(tmpl(item, e))

            var $avatar = $body.find('.avatar')
            , $ca = $('#change-avatar')
            , optSeq = $content.find('.opt').size();

            $ca.css('opacity', 0)
            .css('left', $avatar.position().left + 'px')
            .css('top', $avatar.position().top + 'px')

            if(g.navigator.appName == "Microsoft Internet Explorer"){
                $ca.css({
                    width: '120px',
                    height: '120px'
                })
            }

            Addrbook.centerImg($content.find('.avatar img'));

            $content.initEvents({
                'go back to the last page //.cancel': function(){
                    Addrbook.goBack();
                },
                'save the item //.save': function(){
                    $content.find('.imgNewItem').trigger('click');
                    var data = $content.wrapData();
                
                    item.avatar = $avatar.find('img').attr('src');
                    var m, info = [];
                    //                debugger;
                    for(var i in data){
                        if(m = /^main(.*)_(.*)/.exec(i)){
                            item.main[m[1]] = {
                                key: m[2],
                                value: data[i]
                            }
                        } else if(m= /^optkey_(.*)/.exec(i)){
                            if(data[i])
                                info.push({
                                    key: data[i],
                                    value: data['optval_' + m[1]]
                                })
                        }
                    }
                    item.info = info;

                    Addrbook.save(item);
                    Addrbook.goBack();
                },
                'focus on input //input:text@focus': function(){
                    var $t = $(this);
                    setTimeout(function(){
                        $t.select();
                    }, 20)
                },
                'remove an item //.imgRemoveItem': function(){
                    $(this).parent().remove();
                },
                'add an item //.imgNewItem': function(){
                    var d = {
                        key:$content.find('[name=newkey]').val(),
                        value: $content.find('[name=newval]').val()
                    }
                    $(this).parent()
                    .before(tmpl.OptItem(d, optSeq ++))
                    .find('input').val('');

                },
                'hover over the avatar //[type=file]@mouseenter, .urlInput@mouseenter': function(){
                    clearTimeout(avatarTimer);
                    avatarTimer = setTimeout(function(){
                        var op = $ca.css('opacity'), dur = (0.6 - op) * 500 / 0.6;
                        $ca.fadeTo(dur, 0.6);
                    }, 10)
                },
                'leave the avatar //[type=file]@mouseleave, .urlInput@mouseleave': function(){
                    clearTimeout(avatarTimer);
                    avatarTimer = setTimeout(function(){
                        var op = $ca.css('opacity'), dur = op * 600;
                        $ca.fadeTo(dur, 0);
                    }, 10)
                },
                'changing the avatar for browsers without support to File Api //.urlInput .btnChangeAvatar': function(){
                    var val = $(this).prev().val();
                    if(val.match(/\s*(https?:\/\/|data:image)([\S]+)\s*/)){
                        var $img = $avatar.find('img').attr('src', $.trim(val));
                        //                    setTimeout(function(){
                        Addrbook.centerImg($img);
                    //                    }, 10)
                    } else {
                        alert('Please enter a valid image url, e.g., http://sample.com/sample.jpg');
                    }
                },
                'changing the avatar //[type=file]': {
                    '@change:bind': function(){
                        var file = this.files[0];
                        if(file.size > 50 * 1024){
                            alert('Sorry the image file is too big, please choose another one less than 50k.');
                        } else if(!file.type.match(/image\/.*/)) {
                            alert('Only images will be accepted.')
                        } else {
                            if(FileReader){
                                var reader = new FileReader();
                                reader.onload = function(e){
                                    var $img = $avatar.find('img').attr('src', e.target.result);
                                    //                                setTimeout(function(){
                                    Addrbook.centerImg($img);
                                //                                }, 10)
                                }
                                reader.readAsDataURL(file);
                            } else {
                                prompt('Sorry, your browser does not support the File API, please enter your url instead.', 'http://');
                            }
                        }
                    }
                }
            })
        
        })
    })
}