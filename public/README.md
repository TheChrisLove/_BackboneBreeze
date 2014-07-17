MVC Boilerplate SPA Application Documentation
---

Welcome
---
Welcome to MVC Boilerplate Documentation.  If you are looking for code snippets and examples, see the following:
- [Application Initialization/Configuration](tutorials/main.html)
- [Controller Examples - Initializing Views from Controller](tutorials/example_controller.html)
- [Model Examples](tutorials/entity_model.html)
- [View Examples](tutorials/view_examples.html)

Compiling CSS
---
Do not make direct changes to main.css, main.css is a file compiled by less from main.less.  To compile main.less, install less (refer to less docs), navigate to the css folder, and issue the following command:
```
$ lessc main.less > main.css
```
If you would like to temporarily bypass the CLI compiler while developing, update the index.html file (commenting main.css and uncommenting main.less and less.js). The run-time compiler is not being used, as we want to pre-compile the main.css in production environment.

Updating the Documentation
---
This documentation uses the jaguarjs-jsdoc template for jsDoc, and the example links above use docco.  For reference:
- [docco](http://jashkenas.github.io/docco/)
- [jaguarjs-jsdoc](https://github.com/davidshimjs/jaguarjs-jsdoc)
- [jsdoc](http://usejsdoc.org/index.html)

jsDoc is installed in the root of the project, to update the documentation, document your code following jsDoc specs, and from the root of the project run the following command (assuming jsdoc and docco are installed globally):

```
$ jsdoc app -r -t Documentation/lib/jaguarjs-jsdoc-master -c Documentation/lib/ess.conf.json ESS.App/README.md -d ESS.App/about --verbose -l -p
```
Using docco and outputing documentation to Tutorials (snippet below assumes having navigated to /ESS.App)
```
docco -o about/tutorials app/controllers/examples/*
```

