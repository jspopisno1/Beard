# Beard.js -- A Javascript Template Engine (current version requires jQuery)

> Currently beard has its own template engine
> NOTE that beard is not yet in beta. The API of it, especially the advanced part has not been finalised yet.

## Though the demo site is not yet complete, you can go to see the
<a href="http://jspopisno1.github.com/Beard" target="_blank">Examples & Documentation</a>

# Reason of developing it

I am quite a fan of javascript template engines.  In some real projects, I used jQuery template, Mustache, jQote2.
I like them as they really helped. However, as I kept trying different templates engines, none of them can finally
meets my own requirements.

I want something that can manage the templates more efficient. Months ago, I came up with an idea, but I only
implemented the first part of the idea and did not have time
to push it to the second phase which is the real interesting stuff. However, I did have another idea I think
is funny and not too hard to implement, so I spent around two weeks in order to share it to the community.

At first, Beard.js is developed for managing templates from any other template engine. It is kinda template management.
It did well, but I found that it could not reflect my whole idea yet. I therefore went on developing Beard's own
template engine, and it finally comes to two components : beard-core.js and beard-advanced.js.

# How Beard.js can help you

### Defining template is simple

In Beard, you can create and use a template quite easily.

Beard use html comments to store your templates. Here is a hello world example
http://jspopisno1.github.com/Beard/#exmp_helloworld

	// --- in html, template's body is enclosed with <!--@  @-->
	<div beard='FirstTpl'>
		<!--@ Hello world, my name is [`` d.name `]. @-->
	</div>

	// --- in js
	$(function(){
		Beard.load();

		// return - Hello world, my name is Beard.
		alert( Btpls.FirstTpl({name: 'Beard'}) );
	});

### Managing your templates in a neat way

Using Beard, you can manage the templates in a tree-like struture. Imagine in a case, there are two sections in a page.
Each section consists of header, content and footer, and you would like to divide the big chuck into small templates.

Instead of defining

	UserSection
	UserHeader
	UserContent
	UserFooter

	BookSection
	BookHeader
	BookContent
	BookFooter

You can nest them like

	UserSection
		Header
		Content
		Footer

	BookSection
		Header
		Content
		Footer

### Defining and calling nested sub-templates

Defining them is easy, because Beard.js can help you nest your templates with the help of nested divs:
http://jspopisno1.github.com/Beard/#exmp_start_demo_comps-simple

	<div beard='UserSection'>
		<!--@
		[`` t.Header(d) + t.Content(d) + t.Footer(d)
			// to call a sub template, use t.SomeSubTpl()
			// oh BTW, [`` `] is something like <%= %>, you can totally define your own syntax
		`]
		@-->
		<div beard='Header'> ... </div>
		<div beard='Content'> ... </div>
		<div beard='Footer'> ... </div>
	</div>

### Template reference

Beard also allows template references. For instance, you want to create helpers for some frequently-used templates,
say, some input templates. You can make use of the idea of template reference. Here is the code
http://jspopisno1.github.com/Beard/#exmp_syntax-reference


	<div beard='UserSection'>
		<!--@
		[`` t.Inputs.Button('some text')
			// using bref, you can create a template reference
		`]
		@-->
		<div beard='Header'>
			<!--@
			[`` t.p().Inputs.Text('First Name : ', 'firstname', '')
				// You can also call it here. p() is something like go up a level
			`]
			@-->
		</div>
		<div beard='Inputs' bref='Inputs' />
	</div>

	<div beard='Inputs'>
		<div beard='Button' bargs='text, href'>
			<!--@ <a class='fancybutton' href='[`` href?href:"javascript:void(0)" `]' >[`/ text `]</a> @-->
		</div>
		<div beard='Text' bargs='label, name, value'>
			<!--@ <label>[`/ label `]</label><input type='text' value='[`/ value `] name='[`/name`]'/> @-->
		</div>
	</div>

### Compile utility functions into your templates

Beard can help you call some frequently used functions easily by just its name without any namespace. For instance,
you can use Beard.extendsUtils to define some util function, say, Beard.extendUtils({ myFunc: function(){ ... } }).
You can then call it like :

	<div beard='Test'>
		<!--@
		[`` myFunc() `]
		@-->
	</div>

Don't worry, Beard does not use WITH statement to achieve this feature, so the performance won't be affected.
http://jspopisno1.github.com/Beard/#exmp_outside-utils

### Other features that I think is useful

1. You can define your own syntax. For example, <% %> to replace the current [## #], <%= %> to replace [\`\` \`]. http://jspopisno1.github.com/Beard/#exmp_syntax-configure
2. Bind data to html elements. http://jspopisno1.github.com/Beard/#exmp_start-demo-datamode
3. Define your own argument for a template. http://jspopisno1.github.com/Beard/#exmp_syntax-arguments
4. Load template from plain text or javascript object.
5. Load template from server using ajax call.
6. Debug mode, provide detailed information. e.g., compiled function, template calling log. http://jspopisno1.github.com/Beard/#exmp_start-demo-debugmode
7. Bind data and dom into BeardNode object, and BeardSlot can be used to contain and manage nodes. (Advanced Usage, not yet finalised). http://jspopisno1.github.com/Beard/#exmp_outside-slot

## Get Started!

Simply download beard-core.js, and include it and jQuery ( >1.4.4 ) in your page.

    <script type="text/javascript" src="../jquery-1.6.min.js"></script>
    <script type="text/javascript" src="../beard-core.js"></script>

Set up the templates and call Beard.load(). You are ready to go!

    <script>
        $(function(){
            Beard.load();
            alert(Btpls.HelloWorld({name: 'Beard'}))
        })
    </script>

See helloworld.html in examples.

## Performance of HTML rendering

If you want to know the performance of rendering pure html text, you can check out
<a href="http://jsperf.com/dom-vs-innerhtml-based-templating/257" target="_blank">jsPerf 257</a>

Or if you want to know the performance of rendering pure html text plus rendering the html to the page using innerHTML, get
<a href="http://jsperf.com/dom-vs-innerhtml-based-templating/259" target="_blank">jsPerf 259</a>

## Performance compared with jsViews (BorisMoore)

Using the example 'Todos', rendering 2000 records.

<a href="http://jspopisno1.github.com/Beard/compare/jsView-todos.html" target="_blank">jsView</a> If you cannot open it, you can try
<a href="http://jspopisno1.github.com/Beard/compare/jsView-todos_500.html" target="_blank">jsView (500 records)</a>

<a href="http://jspopisno1.github.com/Beard/compare/beard-todos_advanced_huge.html" target="_blank">Beard rendering into Beard Nodes</a>

<a href="http://jspopisno1.github.com/Beard/compare/beard-todos_core.html" target="_blank">Beard rendering as plain html</a>




