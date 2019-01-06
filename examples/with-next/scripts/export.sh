#!/bin/sh
trap "exit" INT TERM ERR
trap "kill 0" EXIT

NODE_ENV=production node server.js > /dev/null 2>&1 &
./node_modules/.bin/next export
