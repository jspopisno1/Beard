# Beard.js -- Javascript Template Engine Management

> Currently beard can work with Mustache, Yajet, jQote, doT

Well, beard.js can help saving your time managing templates.

## Background

I was tired of managing template as ugly javascript strings, so I included them as comments into html and use jQuery to parse them for template strings for mustache. I happened to learn that [ICanHaz.js] has the same motivation, but I don't think it meets my needs, e.g., I want the template functions to be nestable.

Therefore, I finally decided to re-pick my previous attempt, clean the code and publish it as a tiny js lib.

NOTE: Beard.js relies on jQuery. The rest of this document will use the syntax of mustache for demonstration. Keep in mind that not only Mustache but any js template engine can work with Beard, once Beard knows how to call it.

## Get started

Include jQuery, Beard.js (and BeardUtils.js if you would like to generate a dummy definition for Netbeans IDE. We will talk about it later)

Add 


	<div id='beardTemplates'>
		<div data-beard='myTemplate'>
			Hello, {{name}}
			<div data-beard='subTemplate'>
				<h1>heading</h1>
			</div>
		</div>
	</div>
	
to the html body.

In your page's javascript, include:

	$(document).ready(function(){
		// load the templates
		Beard.load();

		
		// ok, you are ready to use the compiled functions
		
		Btpls.myTemplate({name: 'Liangliang'});
		// output: Hello, Liangliang
		
		Btpls.myTemplate.subTemplate();
		// output: <h1>heading</h1>
		
	});

## API

### Beard.load()

If you include all the templates in the specific zone with id 'beardTemplates', the load() method will load them into the Btpls object, and remove them after compilation.

### Beard.loadHtml(content [, path] )

If you have some dynamic templates (in a format of HTML) to be loaded, call this method.

	Beard.loadHtml('<div data-beard="newTpl">hi again, {{name}}</div>');
	// ==> Btpls.newTpl(data)
	
	Beard.loadHtml('<div data-beard="newTpl">hi again, {{name}}</div>', 'myNamespace');
	// ==> Btpls.myNamespace.newTpl(data)
	
	Beard.loadHtml('<div data-beard="newTpl" data-beard-path="test">hi again, {{name}}</div>', 'myNamespace');
	// ==> Btpls.myNamespace.test.newTpls(data)

### Beard.loadScript(content, path)

You don't have to always include templates as html segments. You can use loadScript() to directly compile a template string.

	Beard.loadScript('hi again, {{name}}', 'newTpl');
	// ==> Btpls.newTpl(data)

### Beard.loadRemote(url [, options] [, callback] )

	options: { 
		isScript:  //default: false, decides if loadHtml() or loadScript() gets called later
		path:  //default: undefined, but path is a must for loadScript()
		data:  //default: undefined, will be used by $.get()
		}

### Beard.to_html(template [, data] )

The original function from mustache.js

### Beard.loadMustache()

If you want to use mustache, this method bring Mustache from closure to the global context.


## HTML syntax for Beard

### The beard area

	<div id='beardTemplates'></div>

If no beard area is defined, one will be generated and append to html body.
This area will be hidden when Beard gets loaded.

### Templates block

Any instance with an attribute `data-beard` will be treated as a template block.
The original structure of blocks will be kept, unless there is another attribute `data-beard-path` specified.

> NOTE: the actual output will not include another template block. If you want to include the output of the sub template, you need to have a dive into `Partials` or call it explicitly.

	<div id='beardTemplates'>
		<div data-beard='tpl1'>
			<h1>Hi, {{name}}</h1>
			<div data-beard='subTpl1'>sub tpl1</div>
			<div data-beard='notASubTpl' data-beard-path=''>not a sub tpl</div>
			<div data-beard='tpl2' data-beard-path='newSpace'>not a sub tpl</div>
		</div>
		<div data-beard='subTpl2' data-beard-path='tpl1'>
			sub tpl2
			<div data-beard='subSubTpl1'>sub sub tpl1</div>
		</div>
	</div>
	
	Beard.load()
	// => 
	
	var Btpls;
	
    Btpls = {
        "tpl1" : {},
        "notASubTpl" : {},
        "newSpace" : {},
    }
	
    Btpls.tpl1 = {
        "subTpl1" : {},
        "subTpl2" : {}
    }
	
    Btpls.tpl1.subTpl2 = {
        "subSubTpl1" : {}
    }
	
    Btpls.newSpace = {
        "tpl2" : {}
    }

### <!--@ `template body` @-->

`<!--@` and `@-->` will be removed when compiling the template, however, `<!--` `-->` will remain.

	<div id='beardTemplates'>
		<div data-beard='tpl1'>
			<!--@ <h1>Hi, {{name}}</h1> @-->
		</div>
	</div>
	
### beardUtils.js

After loading beardUtils.js, a new method getIDEDefs() will be populated to Beard.
If you call Beard.getIDEDefs(), it will return you the current templates structure as lines of javascript assignments. I create this util method because I am a little bit lazy...

Well, the advantage is... if you are using some IDE (say, NetBeans), if you copy this def part to your project.
The instant help will know the structure of the templates. For instance, the example above. If you run getIDEDefs() and copy 

	;(function(){
		var Btpls;
		Btpls = {
			tpl1: {}
		}
	});
	
into your project. When you hit `Btpls` and a dot `.`, `tpl1` will display in the instant help list.




		
