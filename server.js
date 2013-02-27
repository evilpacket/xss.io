
/**
 * Module dependencies.
 */

var express = require('express'),
    cluster = require('cluster'),
    connect = require('connect'),
    fs = require('fs'),
    routes = require('./routes'),
    helmet = require('helmet'),
    passport = require('passport'),
    uuid = require('node-uuid'),
    TwitterStrategy = require('passport-twitter').Strategy,
    evilheaders = require('./evilheaders'),
    base62 = require('base62'),
    redis = require('redis'),
    config = require('./config.js'),
    client = redis.createClient(config.thoonk.port, config.thoonk.host),
    RedisStore = require('connect-redis')(express);


var numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
    // Fork workers.
    for (var i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('exit', function (worker, code, signal) {
        config.logger.error('worker ' + worker.process.pid + ' died');
        cluster.fork();
    });
    cluster.on('online', function (worker) {
        config.logger.info('worker ' + worker.process.pid + ' online');
    });
} else {
    var app, config, env = process.env.NODE_ENV;
    if (env == 'production') {
        app = module.exports = express.createServer({
            key: fs.readFileSync('sslkeys/xssio.key'),
            cert: fs.readFileSync('sslkeys/xssio.crt'),
            ca: [fs.readFileSync('sslkeys/sub.class1.server.ca.pem'), fs.readFileSync('sslkeys/ca.pem')]
        });
        app.listen(443);
    } else {
        app = module.exports = express.createServer();
        app.listen(3000);
    }


    var logFile = fs.createWriteStream('./xss.io.log', {flags: 'a'}); 

    // Authentication
    if (env == 'production') {
        passport.use(new TwitterStrategy({
                consumerKey: config.twitter.consumerKey,
                consumerSecret: config.twitter.consumerSecret,
                callbackURL: "https://xss.io/auth/twitter/callback"
            }, function (token, tokenSecret, profile, done) {
                routes.findOrCreateUserByTwitterData(profile, done);
            }));
    } else {
        passport.use(new TwitterStrategy({
                consumerKey: config.twitter.consumerKey,
                consumerSecret: config.twitter.consumerSecret,
                callbackURL: "http://localhost:3000/auth/twitter/callback"
            }, function (token, tokenSecret, profile, done) {
                routes.findOrCreateUserByTwitterData(profile, done);
            }));
    }

    passport.serializeUser(function (user, done) {
        done(null, user);
    });

    passport.deserializeUser(function (obj, done) {
        done(null, obj);
    });


    // CSP Bitches
    //helmet.csp.add('default-src', "'self'", 'xssio');

    // Configuration
    var sessStore = new RedisStore();

    app.configure(function () {
        app.set('views', __dirname + '/views');
        app.set('view engine', 'jade');
        app.use(express.logger({stream: logFile}));
        app.use(express.bodyParser());
        app.use(express.cookieParser());
        app.use(helmet.xframe('sameorigin'));
        app.use(helmet.cacheControl());
        app.use(helmet.contentTypeOptions());
        app.use(express.session({ secret: config.sessionSecret, store: sessStore, cookie: {httpOnly: true, secure: true}}));
        app.use(passport.initialize());
        app.use(passport.session());
        app.use(express.methodOverride());
        app.use(express.static(__dirname + '/public'));
        app.use(evilheaders.middleware());
    });

    app.options('*', function (req, res) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Credentials', true);
        res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type'); 
        //res.header("Access-Control-Allow-Headers", "X-Requested-With, x-csrf-token");
        res.header("Access-Control-Allow-Headers", req.headers['access-control-request-headers']);
        res.send();
    });

    app.configure('development', function () {
        app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
    });

    app.configure('production', function () {
        //app.use(express.errorHandler()); 
        app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
    });

    app.dynamicHelpers({
        session: function (req, res) {
            return req.session;
        },
        user: function (req, res) {
            return req.user;
        }
    });

    // Authentication middleware
    function loginRequired(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect('/');
    }

    // Routes
    //app.post('/profile', loginRequired, routes.updateUserProfile);
    app.get('/tools', function (req, res) {
        res.render('tools.jade', {
            locals: {
                title: "Tools"
            }
        });
    });

    // CSRF Route, so we can enforce CSP
    app.get('/js/csrf_token.js', loginRequired, express.csrf(), routes.csrfToken);

    // Auth Routes
    app.get('/auth/twitter', passport.authenticate('twitter'));

    app.get('/auth/twitter/callback',
      passport.authenticate('twitter', { failureRedirect: '/' }),
      function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
    });

    app.get('/dashboard', loginRequired, function (req, res) {
        res.render('dashboard.jade', {
            locals: {
                title: "Dashboard"
            }
        });
    });

    // Redirect Routes
    app.get('/redirects', loginRequired, routes.getUserRedirects);
    app.get('/redirects.json', loginRequired, routes.getUserRedirectsJSON);
    app.post('/redirects.json', loginRequired, express.csrf(), routes.createRedirect);
    app.del('/redirects.json', loginRequired, express.csrf(), routes.deleteRedirect);

    // Exploit Routes
    app.get(/^\/exploit\/(.*)\.json/, loginRequired, routes.getExploitJSON);
    app.get(/^\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/, routes.getExploit);
    app.post('/exploit/add', loginRequired, express.csrf(), routes.createExploit);

    app.get('/exploit/edit/:id', loginRequired, routes.addExploit);
    app.get('/exploit/add', loginRequired, routes.addExploit);
    app.get('/exploit/list', loginRequired, routes.listExploits);
    app.get('/exploits', loginRequired, routes.getExploitsJSON);
    app.del('/exploit/:id', loginRequired, routes.deleteExploit);

    // ************ SNIPPET ROUTES *************

    app.get('/snippets', loginRequired, routes.snippetManager);
    app.get('/snippets.json', loginRequired, routes.getSnippets);
    app.post('/snippets.json', loginRequired, express.csrf(), routes.postSnippets);
    app.del('/snippets.json', loginRequired, express.csrf(), routes.deleteSnippet);

    // ************ SNIPPET ROUTES *************

    // DeadDrop
    // Main management view
    app.get('/deaddrop', loginRequired, routes.getDeadDropLocations);

    app.get('/', routes.checkRefererMiddleware(), routes.index);
    app.get('/logout', routes.logout);

    // Get a DeadDrop ID
    app.get('/deaddrop/id', routes.createDeadDrop);
    app.get(/\/deaddrop\/(.*)/, loginRequired, routes.getDeadDropIntel);

    // Post an event to a dead drop
    app.post(/([0-9A-Za-z]+)/, routes.addDeadDropEvent);

    // Get a dead drop payload and send it back
    app.get(/([0-9A-Za-z]+)/, routes.getDeadDropClient);

    // HTTP to HTTPS redirector
    var http = express.createServer();
    http.get('*',function(req,res){  
        res.redirect('https://xss.io' + req.url)
    });
    http.listen(80);

    if (config.uid) process.setuid(config.uid);


}
