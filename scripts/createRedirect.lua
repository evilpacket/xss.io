local user, referer, url = unpack(ARGV);

local sha = redis.sha1hex(referer);
user = cjson.decode(user);

--if (string.find(referer, '^(http|https)://xss.io.*') then
if (referer == '' or string.find(referer, '^http[s]?://xss.io')) then
    return {"no sir, can't do that", false, 418};
end

if (redis.call('SCARD', 'USER:'..user.id..':REDIRECTS') >= 10) then
    -- You can only have 10 redirects at any one given time
    return {"You can only have 10 redirects", false, 400};
end

if (redis.call('GET', 'XSSIO:REDIRECTS:' .. sha)) then
    -- referer already exists, return error
    return {"Redirect for that referer already exists", false, 403};
end

local reply = cjson.encode({referer=referer, url=url});
redis.call('SADD', 'USER:'..user.id..':REDIRECTS', reply);
redis.call('SET', 'XSSIO:REDIRECTS:'..sha, url);

return {false, "Referer Redirect Created", 200};

