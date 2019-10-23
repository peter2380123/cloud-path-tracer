
#!/usr/bin/sh
curl localhost:3000 --header "Content-Type: application/json" --request POST --data '{"bucket":"cloud-path-tracer-jon","cache":"cloud-path-tracer.redis.cache.windows.net", "cacheKey": "A3swUq0pAP8zilQo1tcnFj7q3wWCtV+I0RzlYYGlymQ=", "uuid":"test", "cachePort": 6380, "render_options":{"height":600,"width":800,"fov":90,"bounces":10,"samples_per_pixel":10}}'

