#!/usr/bin/env python

import json

from flask import Flask, request
from flask_restful import Resource, Api

from mockdb import MockDB

app = Flask(__name__)
api = Api(app)

db = MockDB('db.json')

class DataTimeSpans(Resource):
	def get(self):
		print("GET:", request.form)
		from_date = request.args['from']
		to_date = request.args['to']
		return db.get(from_date, to_date)

	def put(self):
		json_data = request.get_json(force=True)
		print("PUT:", json_data)
		db.update(json_data)
		return db.get()

api.add_resource(DataTimeSpans, '/api/calendar')

if __name__ == '__main__':
	app.run(host='0.0.0.0', port=9876, debug=True)
