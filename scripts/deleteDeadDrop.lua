local user, id = unpack(ARGV);

user = cjson.decode(user);
local apikey = redis.call('GET', 'USER:'..user.id..':APIKEY');

-- Get the deaddrop
-- local dd = redis.call('HGETALL', 'dd:' .. id);
local ddId = redis.call('HGET', 'dd:' .. id, 'user');
local ddLocation = redis.call('HGET', 'dd:' .. id, 'location');
local ddLocationType = redis.call('HGET', 'dd:' .. id, 'type');

-- Verify that you own it
if (tonumber(ddId) ~= tonumber(user.id)) then
    return {"nope", false, 403};
end

-- Delete it
redis.call('DEL', 'dd:'..id);

-- find the dd:id:hash key and delete it
local hash = redis.sha1hex(ddLocation .. ":" .. ddLocationType .. ":" .. apikey);
redis.call('DEL', 'dd:id:' .. hash);

-- Remove the dead drop from the user 
redis.call('SREM', 'USER:' .. user.id .. ':DEADDROPS', id);
redis.call('ZREM', 'USER:' .. user.id .. ':DEADDROP:locations', id);

-- Remove events
local events = redis.call('ZRANGE','DEADDROP:'..id..':EVENTS',0,-1);
redis.call('DEL', unpack(events));
redis.call('DEL', 'DEADDROP:'..id..':EVENTS');

return {false, '', 200};
