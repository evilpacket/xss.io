local user, referer, url = unpack(ARGV);

local sha = redis.sha1hex(referer);
user = cjson.decode(user);

local reply = cjson.encode({referer=referer, url=url});

if (redis.call('SISMEMBER', 'USER:'..user.id..':REDIRECTS', reply)) then
    redis.call('SREM', 'USER:'..user.id..':REDIRECTS', reply);
    redis.call('DEL', 'XSSIO:REDIRECTS:'..sha);
    return {false, "", 204};
end

return {"Good luck", false, 403};
