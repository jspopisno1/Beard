/*
    beard.js — mustache successor javascript lib

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

    -----------------------------------------------------------------------

    mustache.js — Logic-less templates in JavaScript

    The MIT License

    Copyright (c) 2009 Chris Wanstrath (Ruby)
    Copyright (c) 2010 Jan Lehnardt (JavaScript)

    See http://mustache.github.com/ for more info.
 */

;
(function(g, d){
    if(!g.$){
        var e = new Error('jQuery must be loaded before Beard.js');
        throw e;
    }
    
    // first we need to get the beard template zone and hide it
    var $beard;
    $(d).ready(function(){
        $beard = $('#beardTemplates');
        if($beard.size() == 0){
            $beard = $('<div id="beardTemplates></div>').appendTo('body');
        }
        $beard.css('display', 'none');
    })


    var Beard = function(){

        var BEARD_NODE = 'data-beard';
        var BEARD_PATH = 'data-beard-path';

        function pushFunction(path, f, target, levels, index){
            if(!levels){
                levels = path.split('.');
                index = 0;
                target = Btpls;
            }

            var currLevel = levels[index];

            if(index == levels.length){
                // reach the leaf level
                if(target !== null){
                    var tpls = f.__tpls__ = target.__tpls__;
                    for(var i = 0; i < tpls.length; i++){
                        f[tpls[i]] = target[tpls[i]];
                    }
                } else {
                    f.__tpls__ = [];
                }
                return f;
            } else if(target === null){
                target = {
                    __tpls__: []
                };
            }

            // during with the internal nodes
            if(currLevel in target){
                target[currLevel] = pushFunction(path, f, target[currLevel], levels, index+1);
            } else {
                target[currLevel] = pushFunction(path, f, null, levels, index+1);
                target.__tpls__.push(currLevel);
            }
            return target;
        }

        return {
            // If the mustache is needed, it can be loaded into the global scope
            loadMustache: function(){
                g.Mustache = Mustache;
            },
            // Load all the templates
            // a template shall locate in #beard_templates and with an attribute data-beard
            // data-beard = { the name of the template }
            // <!--@ @--> will be removed
            //
            // Finally the templates will be loaded into Beard.tpls in a neat hierarchical structure
            // The structure will be based on the structure of tempaltes
            // but data-beard-path can be also be used to set the parent template node explictly
            load: function(){
                var beards = $beard.find('['+ BEARD_NODE + ']');
                beards
                .each(function(){

                    // first try the defined path
                    var $t = $(this);
                    var path = $t.attr(BEARD_PATH);
                    if(path === undefined){
                        var $p = $t.parent().closest('['+ BEARD_NODE + ']');
                        var parent = $p.data('beard-path');
                        path = (parent? parent+ '.':'' ) + $t.attr(BEARD_NODE);
                    } else {
                        path = (path?path + '.':'') + $t.attr(BEARD_NODE);
                    }
                    $t.data('beard-path', path);
                })
                .each(function(){

                    // move all the templates to the top level
                    var $t = $(this);
                    $t.removeAttr(BEARD_NODE, false)
                    .removeAttr(BEARD_PATH, false);
                    $t.appendTo($beard);
                })
                .each(function(){

                    // remove the <!--@ @--> annotation
                    var $t = $(this);
                    var html = $t.html().split('<!--@').join('')
                    .split('@-->').join('');
                    $t.html(html);
                })
                .each(function(){

                    // compile all the templates into Btpls
                    var $t = $(this);
                    var path = $t.data('beard-path');
                    tplScr[path] = $t.html();
                    var f = function(data){
                        try{
                            return Mustache.to_html(tplScr[path], data);
                        } catch(e){
                            e.type = 'BeardTemplateError';
                            e.path = path;
                            e.func = arguments.callee;
                            throw e;
                        }
                    }

                    pushFunction(path, f);
                })

                $beard.html('');
            } // end of load ()
            ,
            loadRemote: function(url, options, callback){
                if(options){
                    var isScript = options.isScript;
                    var path = options.path;
                    var data = options.data;
                }
                if(isScript && !path){
                    var e = new Error('A name is required for a template string');
                    e.type = 'BeardTemplateError';
                    throw e;
                }

                $.get(url, data, function(rsp){
                    if(isScript){
                        Beard.loadScript(rsp, path);
                    } else {
                        Beard.loadHtml(rsp, path);
                    }
                    if(typeof callback == 'function'){
                        callback(rsp);
                    }
                }, 'text')
            },
            loadHtml: function(content, path){
                $beard.html(content);
                if(path){
                    $beard.find('[' + BEARD_PATH + ']').each(function(){
                        var $t = $(this);
                        $t.attr(BEARD_PATH, path + $t.attr(BEARD_PATH));
                    })
                    $beard.find('['+BEARD_NODE+']:not(['+BEARD_PATH+'])').each(function(){
                        $(this).attr(BEARD_PATH, path);
                    })
                }
                this.load();
            },
            loadScript: function(content, path){
                if(!path){
                    var e = new Error('A name is required for a template string');
                    e.type = 'BeardTemplateError';
                    throw e;
                }
                var levels = path.split('.');
                var leaf = levels.pop();
                path = levels.join('.');

                $beard.html('<div '+ BEARD_NODE + '="' + leaf + '" ' + BEARD_PATH+'="' + path + '"><!--@'+content + '@--></div>');
                this.load();
            },
            to_html: function(string, data){
                return Mustache.to_html(string, data);
            }
        }
    }();
    g.Beard = Beard;
    var Btpls = g.Btpls = {
        __tpls__: []
    };
    var tplScr = {};
    

    /*
     * mustache.js — Logic-less templates in JavaScript
     */

    var Mustache = function() {
        var regexCache = {};
        var Renderer = function() {};

        Renderer.prototype = {
            otag: "{{",
            ctag: "}}",
            pragmas: {},
            buffer: [],
            pragmas_implemented: {
                "IMPLICIT-ITERATOR": true
            },
            context: {},

            render: function(template, context, partials, in_recursion) {
                // reset buffer & set context
                if(!in_recursion) {
                    this.context = context;
                    this.buffer = []; // TODO: make this non-lazy
                }

                // fail fast
                if(!this.includes("", template)) {
                    if(in_recursion) {
                        return template;
                    } else {
                        this.send(template);
                        return;
                    }
                }

                // get the pragmas together
                template = this.render_pragmas(template);

                // render the template
                var html = this.render_section(template, context, partials);

                // render_section did not find any sections, we still need to render the tags
                if (html === false) {
                    html = this.render_tags(template, context, partials, in_recursion);
                }

                if (in_recursion) {
                    return html;
                } else {
                    this.sendLines(html);
                }
            },

            /*
      Sends parsed lines
             */
            send: function(line) {
                if(line !== "") {
                    this.buffer.push(line);
                }
            },

            sendLines: function(text) {
                if (text) {
                    var lines = text.split("\n");
                    for (var i = 0; i < lines.length; i++) {
                        this.send(lines[i]);
                    }
                }
            },

            /*
      Looks for %PRAGMAS
             */
            render_pragmas: function(template) {
                // no pragmas
                if(!this.includes("%", template)) {
                    return template;
                }

                var that = this;
                var regex = this.getCachedRegex("render_pragmas", function(otag, ctag) {
                    return new RegExp(otag + "%([\\w-]+) ?([\\w]+=[\\w]+)?" + ctag, "g");
                });

                return template.replace(regex, function(match, pragma, options) {
                    if(!that.pragmas_implemented[pragma]) {
                        throw({
                            message:
                            "This implementation of mustache doesn't understand the '" +
                            pragma + "' pragma"
                        });
                    }
                    that.pragmas[pragma] = {};
                    if(options) {
                        var opts = options.split("=");
                        that.pragmas[pragma][opts[0]] = opts[1];
                    }
                    return "";
                // ignore unknown pragmas silently
                });
            },

            /*
      Tries to find a partial in the curent scope and render it
             */
            render_partial: function(name, context, partials) {
                name = this.trim(name);
                if(!partials || partials[name] === undefined) {
                    throw({
                        message: "unknown_partial '" + name + "'"
                    });
                }
                if(typeof(context[name]) != "object") {
                    return this.render(partials[name], context, partials, true);
                }
                return this.render(partials[name], context[name], partials, true);
            },

            /*
      Renders inverted (^) and normal (#) sections
             */
            render_section: function(template, context, partials) {
                if(!this.includes("#", template) && !this.includes("^", template)) {
                    // did not render anything, there were no sections
                    return false;
                }

                var that = this;

                var regex = this.getCachedRegex("render_section", function(otag, ctag) {
                    // This regex matches _the first_ section ({{#foo}}{{/foo}}), and captures the remainder
                    return new RegExp(
                        "^([\\s\\S]*?)" +         // all the crap at the beginning that is not {{*}} ($1)

                        otag +                    // {{
                        "(\\^|\\#)\\s*(.+)\\s*" + //  #foo (# == $2, foo == $3)
                        ctag +                    // }}

                        "\n*([\\s\\S]*?)" +       // between the tag ($2). leading newlines are dropped

                        otag +                    // {{
                        "\\/\\s*\\3\\s*" +        //  /foo (backreference to the opening tag).
                        ctag +                    // }}

                        "\\s*([\\s\\S]*)$",       // everything else in the string ($4). leading whitespace is dropped.

                        "g");
                });


                // for each {{#foo}}{{/foo}} section do...
                return template.replace(regex, function(match, before, type, name, content, after) {
                    // before contains only tags, no sections
                    var renderedBefore = before ? that.render_tags(before, context, partials, true) : "",

                    // after may contain both sections and tags, so use full rendering function
                    renderedAfter = after ? that.render(after, context, partials, true) : "",

                    // will be computed below
                    renderedContent,

                    value = that.find(name, context);

                    if (type === "^") { // inverted section
                        if (!value || that.is_array(value) && value.length === 0) {
                            // false or empty list, render it
                            renderedContent = that.render(content, context, partials, true);
                        } else {
                            renderedContent = "";
                        }
                    } else if (type === "#") { // normal section
                        if (that.is_array(value)) { // Enumerable, Let's loop!
                            renderedContent = that.map(value, function(row) {
                                return that.render(content, that.create_context(row), partials, true);
                            }).join("");
                        } else if (that.is_object(value)) { // Object, Use it as subcontext!
                            renderedContent = that.render(content, that.create_context(value),
                                partials, true);
                        } else if (typeof value === "function") {
                            // higher order section
                            renderedContent = value.call(context, content, function(text) {
                                return that.render(text, context, partials, true);
                            });
                        } else if (value) { // boolean section
                            renderedContent = that.render(content, context, partials, true);
                        } else {
                            renderedContent = "";
                        }
                    }

                    return renderedBefore + renderedContent + renderedAfter;
                });
            },

            /*
      Replace {{foo}} and friends with values from our view
             */
            render_tags: function(template, context, partials, in_recursion) {
                // tit for tat
                var that = this;



                var new_regex = function() {
                    return that.getCachedRegex("render_tags", function(otag, ctag) {
                        return new RegExp(otag + "(=|!|>|\\{|%)?([^\\/#\\^]+?)\\1?" + ctag + "+", "g");
                    });
                };

                var regex = new_regex();
                var tag_replace_callback = function(match, operator, name) {
                    switch(operator) {
                        case "!": // ignore comments
                            return "";
                        case "=": // set new delimiters, rebuild the replace regexp
                            that.set_delimiters(name);
                            regex = new_regex();
                            return "";
                        case ">": // render partial
                            return that.render_partial(name, context, partials);
                        case "{": // the triple mustache is unescaped
                            return that.find(name, context);
                        default: // escape the value
                            return that.escape(that.find(name, context));
                    }
                };
                var lines = template.split("\n");
                for(var i = 0; i < lines.length; i++) {
                    lines[i] = lines[i].replace(regex, tag_replace_callback, this);
                    if(!in_recursion) {
                        this.send(lines[i]);
                    }
                }

                if(in_recursion) {
                    return lines.join("\n");
                }
            },

            set_delimiters: function(delimiters) {
                var dels = delimiters.split(" ");
                this.otag = this.escape_regex(dels[0]);
                this.ctag = this.escape_regex(dels[1]);
            },

            escape_regex: function(text) {
                // thank you Simon Willison
                if(!arguments.callee.sRE) {
                    var specials = [
                    '/', '.', '*', '+', '?', '|',
                    '(', ')', '[', ']', '{', '}', '\\'
                    ];
                    arguments.callee.sRE = new RegExp(
                        '(\\' + specials.join('|\\') + ')', 'g'
                        );
                }
                return text.replace(arguments.callee.sRE, '\\$1');
            },

            /*
      find `name` in current `context`. That is find me a value
      from the view object
             */
            find: function(name, context) {
                name = this.trim(name);

                // Checks whether a value is thruthy or false or 0
                function is_kinda_truthy(bool) {
                    return bool === false || bool === 0 || bool;
                }

                var value;
                if(is_kinda_truthy(context[name])) {
                    value = context[name];
                } else if(is_kinda_truthy(this.context[name])) {
                    value = this.context[name];
                }

                if(typeof value === "function") {
                    return value.apply(context);
                }
                if(value !== undefined) {
                    return value;
                }
                // silently ignore unkown variables
                return "";
            },

            // Utility methods

            /* includes tag */
            includes: function(needle, haystack) {
                return haystack.indexOf(this.otag + needle) != -1;
            },

            /*
      Does away with nasty characters
             */
            escape: function(s) {
                s = String(s === null ? "" : s);
                return s.replace(/&(?!\w+;)|["'<>\\]/g, function(s) {
                    switch(s) {
                        case "&":
                            return "&amp;";
                        case '"':
                            return '&quot;';
                        case "'":
                            return '&#39;';
                        case "<":
                            return "&lt;";
                        case ">":
                            return "&gt;";
                        default:
                            return s;
                    }
                });
            },

            // by @langalex, support for arrays of strings
            create_context: function(_context) {
                if(this.is_object(_context)) {
                    return _context;
                } else {
                    var iterator = ".";
                    if(this.pragmas["IMPLICIT-ITERATOR"]) {
                        iterator = this.pragmas["IMPLICIT-ITERATOR"].iterator;
                    }
                    var ctx = {};
                    ctx[iterator] = _context;
                    return ctx;
                }
            },

            is_object: function(a) {
                return a && typeof a == "object";
            },

            is_array: function(a) {
                return Object.prototype.toString.call(a) === '[object Array]';
            },

            /*
      Gets rid of leading and trailing whitespace
             */
            trim: function(s) {
                return s.replace(/^\s*|\s*$/g, "");
            },

            /*
      Why, why, why? Because IE. Cry, cry cry.
             */
            map: function(array, fn) {
                if (typeof array.map == "function") {
                    return array.map(fn);
                } else {
                    var r = [];
                    var l = array.length;
                    for(var i = 0; i < l; i++) {
                        r.push(fn(array[i]));
                    }
                    return r;
                }
            },

            getCachedRegex: function(name, generator) {
                var byOtag = regexCache[this.otag];
                if (!byOtag) {
                    byOtag = regexCache[this.otag] = {};
                }

                var byCtag = byOtag[this.ctag];
                if (!byCtag) {
                    byCtag = byOtag[this.ctag] = {};
                }

                var regex = byCtag[name];
                if (!regex) {
                    regex = byCtag[name] = generator(this.otag, this.ctag);
                }

                return regex;
            }
        };

        return({
            name: "mustache.js",
            version: "0.4.0-dev",

            /*
      Turns a template and view into HTML
             */
            to_html: function(template, view, partials, send_fun) {
                var renderer = new Renderer();
                if(send_fun) {
                    renderer.send = send_fun;
                }
                renderer.render(template, view || {}, partials);
                if(!send_fun) {
                    return renderer.buffer.join("\n");
                }
            }
        });
    }();

/***
     *
     * END of mustache.js
     *
     */

})(window, document)
