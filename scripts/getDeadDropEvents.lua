local id, user = unpack(ARGV);

user = cjson.decode(user);

local reply = {};


if (redis.call('SISMEMBER', 'USER:'..user.id..':DEADDROPS', id) ~= 1) then
    -- This is not your drop, gtfo
    return {"This is not your drop, gtfo", false, 403};
end

local location = redis.call('HGET', "dd:" .. id, 'location');

local eventIDs = redis.call('ZRANGE', 'DEADDROP:'..id..':EVENTS', 0, -1, 'withscores');

for j=1,#eventIDs,2 do
    local eventid = eventIDs[j];
    local time = eventIDs[j+1];
    local rawevent = redis.call('HGETALL', eventid);

    -- transform to k,v table
    local event = {}; 
    for i=1,#rawevent,2 do
        event[rawevent[i]]=rawevent[i+1];
    end    
    event['time']=time;
    table.insert(reply, event);
end

return {false, cjson.encode({location=location,events=reply}), 200};
