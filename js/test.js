function(){var e=typeof _e_=="undefined"?{}:_e_,u=Beard.utils,o=[],t=this,g=Btpls.g;if(typeof e=="object")e.def=u._defVal;function out(){o.push.apply(o, arguments);}/**/
if(u._edit>0){return Beard._recompileTemplate(u._tplsStr["TodoApp.TodoItem.Edit"], "TodoApp.TodoItem.Edit", "d,_e_", d,_e_)}
function esc(){return u.esc.apply(u, arguments)}
function log(){return u.log.apply(u, arguments)}
function loop(){return u.loop.apply(u, arguments)}
function has(){return u.has.apply(u, arguments)}
function search(){return u.search.apply(u, arguments)}
function partial(){return u.partial.apply(u, arguments)}
function strcat(){return u.strcat.apply(u, arguments)}
function field(){return u.field.apply(u, arguments)}
function clear(){return u.clear.apply(u, arguments)}
function sort(){return u.sort.apply(u, arguments)}/**/try{u.log(new Date().toLocaleTimeString() + " Level @" + (u.__level++) + "  ------ START : <<   TodoApp.TodoItem.Edit   >> ------");o[o.length]=' <li class="editing">\n                        <input value=\'';
try{__tmp__= d.content ;
o[o.length]=esc(__tmp__);log(new Date().toLocaleTimeString() + "  ----->   "+   (1)   +' d.content  {escaped} => ' + __tmp__));
}catch(e){u._log(e.message + ' @  d.content ')}
o[o.length]='\' class="todo-input"/>\n                    </li> ';
;u.log(new Date().toLocaleTimeString() + " Level @" + (--u.__level) + "  ###### END : <<   TodoApp.TodoItem.Edit   >> ######");;return o.join("");}catch(e){u.log(arguments.callee.toString());log(e);throw e;}}