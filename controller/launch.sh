#!/bin/sh
export RUIP="http://localhost:3001"
export AWSBUCKETNAME=cloud-path-tracer-tiles
export REDISCACHEHOSTNAME=cloud-path-tracer.redis.cache.windows.net
export REDISCACHEKEY=1fbDJZ4x7g9fmx7dX0AfeS2hMwTDsFOBO7Y71NdhqHA=
export CACHEPORT=6380
npm start
