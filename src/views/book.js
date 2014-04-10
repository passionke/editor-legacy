define([
    "hr/hr",
    "hr/promise",
    "utils/dialogs",
    "views/grid",
    "views/summary",
    "views/editor",
    "views/preview"
], function(hr, Q, dialogs, Grid, Summary, Editor, Preview) {
    var Book = hr.View.extend({
        className: "book",
        defaults: {
            fs: null
        },

        initialize: function() {
            Book.__super__.initialize.apply(this, arguments);

            this.fs = this.options.fs;

            // Map article path -> content
            this.articles = {};

            this.grid = new Grid({
                columns: 3
            }, this);
            this.grid.appendTo(this);

            // Summary
            this.summary = new Summary({}, this);
            this.summary.update();
            this.grid.addView(this.summary, {width: 20});

            // Editor
            this.editor = new Editor({}, this);
            this.editor.update();
            this.grid.addView(this.editor);

            // Preview
            this.preview = new Preview({}, this);
            this.preview.update();
            this.grid.addView(this.preview);
        },

        /*
         * Show an article
         */
        openArticle: function(article) {
            var that = this;

            var doOpen = function() {
                that.trigger("open", article);

                return Q();
            };

            if (!article.get("path")) {
                return dialogs.prompt("Enter filename for this chapter:", "", article.get("title")+".md")
                .then(function(path) {
                    article.set("path", path);
                    return that.writeArticle(article, "#"+article.get("title")+"\n")
                })
                .then(function() {
                    return that.saveArticle(article);
                })
                .then(function() {
                    return doOpen();
                });
            }

            return doOpen();
        },

        // Read/Write article in this fs
        readArticle: function(article) {
            var that = this;
            var path = article.get("path");

            if (this.articles[path]) return Q(this.articles[path]);

            return this.fs.read(path)
            .then(function(content) {
                that.articles[path] = content;
                return content;
            });
        },
        writeArticle: function(article, content) {
            var path = article.get("path");

            this.articles[path] = content;
            return Q();
        },
        saveArticle: function(article, content) {
            var path = article.get("path");
            if (!this.articles[path]) return Q.reject(new Error("No content to save for this article"));
            return this.fs.write(article.get("path"), content);
        }
    });

    return Book;
});