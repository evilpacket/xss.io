local user, snippet = unpack(ARGV);

user = cjson.decode(user);
snippet = cjson.decode(snippet);

if (redis.call('SISMEMBER', 'USER:'..user.id..':SNIPPETS', 'XSSIO:SNIPPET:'..snippet.id)) then
    -- Go ahead and delete it
    redis.call('SREM', 'USER:'..user.id..':SNIPPETS', 'XSSIO:SNIPPET:'..snippet.id);
    redis.call('DEL', 'XSSIO:SNIPPET:'..snippet.id);
    return {false, "Snippet deleted", 200};
end

return {"nope, chuck testa", false, 404};

