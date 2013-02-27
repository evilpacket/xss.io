local id, eventDetails, uuid, time = unpack(ARGV);

eventDetails = cjson.decode(eventDetails);

local eventid = 'DEADDROP:EVENT:'..uuid;

if (redis.call('EXISTS', 'dd:'..id) == 1) then
    -- Add to our sorted set of events
    redis.call('ZADD', 'DEADDROP:'..id..':EVENTS', time, 'DEADDROP:EVENT:'..uuid);

    -- Add our event details to a hash
    if eventDetails.sourceIP then
        redis.call('HSET', eventid, 'Source IP', eventDetails.sourceIP);
    end

    if eventDetails.headers then
        redis.call('HSET', eventid, 'Headers', cjson.encode(eventDetails.headers));
    end

    if eventDetails['document.title'] and eventDetails['document.title'] ~= '' then
        redis.call('HSET', eventid, 'Title', eventDetails['document.title']);
    end

    if eventDetails['window.location'] then
        redis.call('HSET', eventid, 'window.location', eventDetails['window.location']);
    end

    if eventDetails['cookies'] then
        redis.call('HSET', eventid, 'Cookies', eventDetails.cookies);
    end

    if eventDetails.localStorage then
        redis.call('HSET', eventid, 'localStorage', eventDetails.localStorage);
    end

    -- Update our event counter so we know we got some intel
    local user = redis.call('HGET', 'dd:'..id, 'user');
    redis.call('ZINCRBY', 'USER:'..user..':DEADDROP:locations', 1, id);

    return true;
else
    return false;
end
