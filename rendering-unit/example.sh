
#!/usr/bin/sh
curl localhost:3001 --header "Content-Type: application/json" --request POST --data '{"bucket":"cab432","cache":"my-redis-cache.redis.cache.windows.net", "cacheKey": "JnmBrSnYJEC7e+6a+zXUtS4BaIAQT454Glza0BXlmOM=", "uuid":"302e3156-dd06-457c-a549-528677ccb296+1571985249553+pt-scene-info-template.json", "cachePort": 6380, "render_options":{"height":600,"width":800,"fov":90,"bounces":10,"samples_per_pixel":10}}'

