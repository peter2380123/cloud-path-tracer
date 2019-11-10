#!/bin/sh
export RUIP="http://localhost:3001"
export AWSBUCKETNAME=cloud-path-tracer-tiles
export REDISCACHEHOSTNAME=localhost
export REDISCACHEKEY=
export CACHEPORT=6379
npm start
