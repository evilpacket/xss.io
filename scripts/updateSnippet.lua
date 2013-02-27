local user, snippet = unpack(ARGV);

user = cjson.decode(user);
snippet = cjson.decode(snippet);

if (redis.call('SISMEMBER', 'USER:'..user.id..':SNIPPETS', 'XSSIO:SNIPPET:'..snippet.id)) then
    -- Go ahead and update it...
    redis.call('SET', 'XSSIO:SNIPPET:'..snippet.id, cjson.encode(snippet));
    return {false, "Snippet updated", 200};
end

return {"nope, chuck testa", false, 404};

