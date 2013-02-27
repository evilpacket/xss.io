local user, id, snippet = unpack(ARGV);

user = cjson.decode(user);
snippet = cjson.decode(snippet);
snippet.id = id;

redis.call('SET', 'XSSIO:SNIPPET:'..id, cjson.encode(snippet));
redis.call('SADD', 'USER:'..user.id..':SNIPPETS', 'XSSIO:SNIPPET:'..id); --Reference to snippet

return {false, "Snippet Created", 200};
