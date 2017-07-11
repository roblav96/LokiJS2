<a href="http://github.com/lokijs-forge/lokijs2/issues" target="_blank">![Github Issues](https://img.shields.io/github/issues/lokijs-forge/lokijs2.svg)</a>

<div style="float: right">
</div>
<a class="  github-button" href="https://github.com/lokijs-forge/lokijs2" data-style="mega" data-count-href="/lokijs-forge/lokijs2/stargazers" data-count-api="/repos/lokijs-forge/lokijs2#stargazers_count" data-count-aria-label="# stargazers on GitHub" aria-label="Star lokijs-forge/lokijs2 on GitHub">GitHub</a>

# Welcome to LokiJS2

## Commands

* `mkdocs new [dir-name]` - Create a new project.
* `mkdocs serve` - Start the live-reloading docs server.
* `mkdocs build` - Build the documentation site.
* `mkdocs help` - Print this help message.

## Project layout

    mkdocs.yml    # The configuration file.
    docs/
        index.md  # The documentation homepage.
        ...       # Other markdown pages, images and other files.


```javascript
// Runnable code
console.log("iii");
console.log("abc");
console.log(123);
console.log({a: 2});
console.log(undefined)
console.log(null)
console.log("??")
console.log($)
console.log([]);
console.log({a: [2, 3, 4, 5, 6, 2, 3, 4, 5, 6, 2, 3, 4, 5, 6, 2, 3, 4, 5, 6, 2, 3, 4, 5, 6, 2, 3, 4, 5, 6, 2, 3, 4, 5, 6, 2, 3, 4, 5, 6, 2, 3, 4, 5, 6,2, 3, 4, 5, 6, 2, 3, 4, 5, 6, 2, 3, 4, 5, 6, 2, 3, 4, 5, 6, 2, 3, 4, 5, 6, 2, 3, 4, 5, 6]});
console.error("123")
console.error("123")
console.error("123")
console.error("123")
console.error("123")

```

```javascript
/*
 * Demonstration of code folding
 */
window.onload = function() {
  var te = document.getElementById("code");
  var sc = document.getElementById("script");
  te.value = (sc.textContent || sc.innerText || sc.innerHTML).replace(/^\s*/, "");
  sc.innerHTML = "";
  var te_html = document.getElementById("code-html");
  te_html.value = document.documentElement.innerHTML;
  var te_python = document.getElementById("code-python");
  var te_markdown = document.getElementById("code-markdown");
  te_markdown.value = "# Foo\n## Bar\n\nblah blah\n\n## Baz\n\nblah blah\n\n# Quux\n\nblah blah\n"

  window.editor = CodeMirror.fromTextArea(te, {
    mode: "javascript",
    lineNumbers: true,
    lineWrapping: true,
    extraKeys: {"Ctrl-Q": function(cm){ cm.foldCode(cm.getCursor()); }},
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
  });
  editor.foldCode(CodeMirror.Pos(13, 0));
};


```
