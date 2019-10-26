
#!/usr/bin/sh
curl ec2-13-236-153-77.ap-southeast-2.compute.amazonaws.com:3000 --header "Content-Type: application/json" --request POST --data '{"bucket":"cloud-path-tracer-tiles","cache":"cloud-path-tracer.redis.cache.windows.net", "cacheKey": "AofcMYlgaeglj7V8yvhHgIqLurgxWNnEDA1NB7hO7X8=", "uuid":"jon-test", "cachePort": 6380, "render_options":{"height":600,"width":800,"fov":90,"bounces":10,"samples_per_pixel":10}}'

