#!/bin/sh
export RUIP="http://localhost:3001"
export AWSBUCKETNAME=cloud-path-tracer-tiles
export REDISCACHEHOSTNAME=cloud-path-tracer.redis.cache.windows.net
export REDISCACHEKEY=AofcMYlgaeglj7V8yvhHgIqLurgxWNnEDA1NB7hO7X8=
export CACHEPORT=6380
npm start
