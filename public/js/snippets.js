function Snippet(id, title, description, code, returns) {
    this.id = id;
    this.title = ko.observable(title);
    this.description = ko.observable(description);
    this.code = ko.observable(code);
    this.returns = ko.observable(returns);
};

function snippetViewModel() {
    var self = this;
    self.edit = false;
    self.snippets = ko.observableArray();
    self.selectedSnippet = ko.observable();

    // Refresh the list of snippets
    self.getSnippets = function () {
        $.getJSON('/snippets.json', function (data) {
            var mappedData = ko.utils.arrayMap(data, function(item) {
                var item = JSON.parse(item);
                return new Snippet(item.id,item.title, item.description, item.code, item.returns);
            });
            self.snippets(mappedData);

        });
    };

    self.selectSnippet = function (snippet) {
        self.edit = true;
        self.selectedSnippet(snippet);
    };

    self.deleteSnippet = function (snippet) {
        self.selectedSnippet(new Snippet('', '', '', '', '')); // Zero out form just in case
        $.ajax({
            url: '/snippets.json',
            type: 'DELETE',
            data: snippet, 
            headers: {
                'X-CSRF-Token': csrf_token
            },
            success: function () {
                self.snippets.remove(snippet);
            }
        });
    };

    self.clearSnippet = function () {
        self.selectedSnippet(new Snippet('', '', '', '', '')); // Zero out form just in case
    };

    self.saveSnippet = function () {
        if(!self.edit) {
            self.snippets.push(self.selectedSnippet());
        }
        $.ajax({
            url: '/snippets.json', 
            type: 'POST',
            data: self.selectedSnippet(),
            headers: {
                'X-CSRF-Token': csrf_token
            },
            success: function () {
                self.selectedSnippet(new Snippet('', '', '', '', '')); // Zero out the form
                if(!self.edit) {
                    self.getSnippets();
                }
                self.edit = false;
            },
            error: function (reply) {
                console.log(reply);
            }
        });
    }

    // onLoad do these things
    //self.selectedSnippet({id: "", title: "", description: "", code: ""}); 
    self.selectedSnippet(new Snippet('', '', '', '', ''));
    self.getSnippets();
};

$().ready(function () {
    a = new snippetViewModel();
    ko.applyBindings(a);
});
