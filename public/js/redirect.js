function Redirect(referer, url) {
    this.referer = ko.observable(referer);
    this.url = ko.observable(url);
};

function redirectViewModel() {
    var self = this;
    self.redirects = ko.observableArray();
    self.selectedRedirect = ko.observable();

    // Refresh the list of redirects
    self.getRedirects = function () {
        $.getJSON('/redirects.json', function (data) {
            var mappedData = ko.utils.arrayMap(data, function(item) {
                item = JSON.parse(item);
                return new Redirect(item.referer, item.url);
            });
            self.redirects(mappedData);

        });
    };

    self.selectRedirect = function (redirect) {
        self.selectedRedirect(redirect);
    };

    self.deleteRedirect = function (redirect) {
        self.selectedRedirect(new Redirect('','')); // Zero out the form
        $.ajax({
            url: '/redirects.json',
            type: 'DELETE',
            data: redirect, 
            headers: {
                'X-CSRF-Token': csrf_token
            },
            success: function () {
                self.redirects.remove(redirect);
            }
        });
    };

    self.saveRedirect = function () {
        $.ajax({
            url: '/redirects.json', 
            type: 'POST',
            data: self.selectedRedirect(),
            headers: {
                'X-CSRF-Token': csrf_token
            },
            success: function () {
                self.redirects.push(self.selectedRedirect());
                self.selectedRedirect(new Redirect('','')); // Zero out the form
            },
            error: function (reply) {
                console.log(reply);
            }
        });
    }

    // onLoad do these things
    self.selectedRedirect(new Redirect('',''));
    self.getRedirects();
};

$().ready(function () {
    a = new redirectViewModel();
    ko.applyBindings(a);
});
