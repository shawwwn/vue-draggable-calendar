#!/bin/bash

python3 server.py & # kill server

echo "api test: GET"

answer=$(cat db.json)
output=$(curl -s http://127.0.0.1:9876/api/calendar \
-H "Content-Type: application/json; charset=UTF-8" \
-X GET)

kill $! # kill server

status=$(jq -n --argjson a "$output" --argjson b "$answer" '$a == $b')
if [ $status == 'true' ]; then
	echo "test passed!"
	exit 0
else
	echo "test failed!"
	exit 1
fi
