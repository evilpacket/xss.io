local user = unpack(ARGV);

user = cjson.decode(user);

local reply = {};

local drops = redis.call('ZREVRANGEBYSCORE', 'USER:' .. user.id .. ':DEADDROP:locations', '+inf', 1, 'WITHSCORES');

local count = #drops / 2;
local total = redis.call('ZCOUNT', 'USER:' .. user.id .. ':DEADDROP:locations', '-inf', '+inf');

for i=1,#drops,2 do
    local rawdrop = redis.call('HGETALL', 'dd:' .. drops[i]);
    local drop = {};
    for i=1,#rawdrop,2 do
        drop[rawdrop[i]] = rawdrop[i+1];
    end
    table.insert(reply, {drop=drop,score=drops[i+1]});
end


return {false, cjson.encode({count=count, total=total, deaddrops=reply}), 200};

