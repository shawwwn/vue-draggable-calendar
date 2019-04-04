#!/bin/bash

python3 server.py & # kill server

echo "api test: CLEAR"

answer='''{}'''
sample_json='''{"2019-03-31":null,"2019-04-01":null,"2019-04-02":null,"2019-04-03":null,"2019-04-04":null,"2019-04-05":null,"2019-04-06":null}'''
output=$(curl -s http://127.0.0.1:9876/api/calendar \
-H "Content-Type: application/json; charset=UTF-8" \
-X PUT \
--data "$sample_json")

kill $! # kill server

status=$(jq -n --argjson a "$output" --argjson b "$answer" '$a == $b')
if [ $status == 'true' ]; then
	echo "test passed!"
	exit 0
else
	echo "test failed!"
	exit 1
fi
