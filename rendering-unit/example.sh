
#!/usr/bin/sh
curl localhost:3000 --header "Content-Type: application/json" --request POST --data '{"bucket":"my-bucket-here","cache":"my-redis-cache.redis.cache.windows.net", "cacheKey": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "uuid":"scene-uuid-here", "cachePort": 6380, "render_options":{"height":600,"width":800,"fov":90,"bounces":10,"samples_per_pixel":10}}'

