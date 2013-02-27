local apikey, location, locationType, time = unpack(ARGV);

local floor,insert = math.floor, table.insert
local function basen(n,b)
    n = floor(n)
    if not b or b == 10 then return tostring(n) end
    local digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    local t = {}
    local sign = ""
    if n < 0 then
        sign = "-"
    n = -n
    end
    repeat
        local d = (n % b) + 1
        n = floor(n / b)
        insert(t, 1, digits:sub(d,d))
    until n == 0
    return sign .. table.concat(t,"")
end


-- Lookup APIKEY
local userKey = redis.call('GET', 'APIKEY:' .. apikey);
-- Verify we got a user
if not userKey then
    return {"nope", false, 403};
end

local user = cjson.decode(redis.call('GET', userKey));
local hash = redis.sha1hex(location .. ":" .. locationType .. ":" .. apikey);

local existingid = redis.call('GET', 'dd:id:' .. hash);

if (existingid) then
    -- ID has already been created, return it
    -- There are privacy issues but that's acceptable for now
    return {false, cjson.encode({location=location, id=existingid}), 200};
end

local id = redis.call('INCR', 'dd:id');
local deadDropID = basen(tonumber(id), 62);

redis.call('SADD', 'USER:' .. user.id .. ':DEADDROPS', deadDropID);
redis.call('ZINCRBY', 'USER:' .. user.id .. ':DEADDROP:locations', 0, deadDropID);

redis.call('SET', 'dd:id:' .. hash, deadDropID);

redis.call('HSET', 'dd:'..deadDropID, 'id', deadDropID);
redis.call('HSET', 'dd:'..deadDropID, 'type', locationType);
redis.call('HSET', 'dd:'..deadDropID, 'location', location);
redis.call('HSETNX', 'dd:'..deadDropID, 'created_on', time);
redis.call('HSET', 'dd:'..deadDropID, 'updated_on', time);
redis.call('HSET', 'dd:'..deadDropID, 'user', user.id);

--callback(null, {location: location, id: deadDropID});
return {false, cjson.encode({location=location, id=deadDropID}), 200};
