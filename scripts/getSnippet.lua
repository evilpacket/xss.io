local id = unpack(ARGV);

user = cjson.decode(user);

local snippets = redis.call('SMEMBERS', 'USER:'..user.id..':SNIPPETS');

local reply = {};
if (#snippets > 0) then
    reply = redis.call('MGET', unpack(snippets));
end
return {false, reply, 200};
