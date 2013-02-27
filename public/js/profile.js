function setProfile(profile) {
    $.ajax({
        url: '/profile',
        type: 'POST',
        headers: {
            'X-CSRF-Token': csrf_token
        },
        data: profile,
        success: function (data) {
            // Who cares
        }
    });
};

function hideSnippetHelp() {
    setProfile({snippetHelpHidden: true});
};

function showSnippetHelp() {
    setProfile({snippetHelpHidden: false});
};

function toggleSnippetHelp() {
    $('#help').toggleClass('open');
    if ($('#help').hasClass('open')) {
        hideSnippetHelp();
    } else {
        showSnippetHelp();
    }
};
