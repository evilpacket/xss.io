local user = unpack(ARGV);

user = cjson.decode(user);

return {false, redis.call('SMEMBERS', 'USER:' .. user.id .. ':REDIRECTS'), 200};

