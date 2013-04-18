function deleteDeadDrop(id) {
    var c = confirm("Are you sure?");
    if (c) {
        $.ajax({
            url: '/deaddrop/' + id,
            type: 'DELETE', 
            headers: {
                'X-CSRF-Token': csrf_token
            },
        }).done(function () {
            // redirect cause I'm too lazy to update the dom
            window.location = "/deaddrop";
        });
    }
}
