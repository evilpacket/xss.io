local user, profile = unpack(ARGV);

user = cjson.decode(user);
local newProfile = cjson.decode(profile);


-- Try and get profile
local oldProfile = redis.call('GET', 'USER:' .. user.id .. ':PROFILE');
local tmpProfile = {};

-- Whitelist profile values, the quick and dirty way
if (newProfile.email) then
    tmpProfile.email = newProfile.email;
end
if (newProfile.snippetHelpHidden) then
    tmpProfile.snippetHelpHidden = newProfile.snippetHelpHidden;
end
if (newProfile.exploitHelpHidden) then
    tmpProfile.exploitHelpHidden = newProfile.exploitHelpHidden;
end
if (newProfile.redirectHelpHidden) then
    tmpProfile.redirectHelpHidden = newProfile.redirectHelpHidden;
end
if (newProfile.deadDropHelpHidden) then
    tmpProfile.deadDropHelpHidden = newProfile.deadDropHelpHidden;
end


if (oldProfile) then
    oldProfile = cjson.decode(oldProfile);
    for k,v in pairs(newProfile) do
        oldProfile[k] = v;
    end    
else
    oldProfile = tmpProfile;
end

-- Save the profile
oldProfile = cjson.encode(oldProfile);
redis.call('SET', 'USER:' .. user.id .. ':PROFILE', cjson.encode(oldProfile));

return {false, oldProfile, 200};
