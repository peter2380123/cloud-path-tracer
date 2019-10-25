
#!/usr/bin/sh
curl localhost:3001 --header "Content-Type: application/json" --request POST --data '{"bucket":"cab432","cache":"my-redis-cache.redis.cache.windows.net", "cacheKey": "JnmBrSnYJEC7e+6a+zXUtS4BaIAQT454Glza0BXlmOM=", "uuid":"351401de-56c7-4654-bd2f-efb564fb7126+1571978761478+pt-scene-info-template.json", "cachePort": 6380, "render_options":{"height":600,"width":800,"fov":90,"bounces":10,"samples_per_pixel":10}}'

