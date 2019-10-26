#!/bin/sh
export RUIP="http://ec2-13-236-153-77.ap-southeast-2.compute.amazonaws.com:3000"
export AWSBUCKETNAME=cloud-path-tracer-tiles
export REDISCACHEHOSTNAME=cloud-path-tracer.redis.cache.windows.net
export REDISCACHEKEY=AofcMYlgaeglj7V8yvhHgIqLurgxWNnEDA1NB7hO7X8=
export CACHEPORT=6380
npm start
