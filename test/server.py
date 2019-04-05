#!/usr/bin/env python

import json

from flask import Flask, request, redirect
from flask_restful import Resource, Api

from mockdb import MockDB

app = Flask(__name__,
	static_url_path='',
	static_folder='../')
@app.route('/')
def index():
	return redirect('/index.html')

db = MockDB('db.json')
class DataTimeSpans(Resource):
	def get(self):
		print("GET:", request.args)
		from_date = request.args.get('from', None)
		to_date = request.args.get('to', None)
		return db.get(from_date, to_date)

	def put(self):
		json_data = request.get_json(force=True)
		print("PUT:", json_data)
		db.update(json_data)
		return db.get()

api = Api(app)
api.add_resource(DataTimeSpans, '/api/calendar')

if __name__ == '__main__':
	app.run(host='127.0.0.1', port=5000, debug=True)
