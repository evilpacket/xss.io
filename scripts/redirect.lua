local referer = unpack(ARGV);

local sha = redis.sha1hex(referer);

return redis.call('GET', 'XSSIO:REDIRECTS:'..sha);

