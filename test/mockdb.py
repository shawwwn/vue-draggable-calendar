#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""A Toy Key-value Database

Used JSON for storage.
Made for testing purpose.

Copyright 2019, Shawwwn <shawwwn1@gmail.com>
"""

import json
from datetime import datetime
from typing import Union

class MockDB:
	def __init__(self, file):
		self.file = file
		self.data = {}
		try:
			with open(file, 'r') as f:
				self.data = json.load(f)
		except:
			with open(file, 'w') as f:
				json.dump(self.data, f)

	def get(self, from_date=None, to_date=None):
		# all data
		if not from_date and not to_date:
			return self.data;

		from_date = datetime.strptime(from_date, '%Y-%m-%d').toordinal() if from_date else datetime.now().toordinal()
		to_date = datetime.strptime(to_date, '%Y-%m-%d').toordinal() if to_date else from_date+1
		delta = to_date - from_date
		if delta < 0:
			return { 'error': 'invalid from/to date' }

		out = {}
		for d in range(delta+1):
			key = datetime.fromordinal(from_date + d).strftime('%Y-%m-%d')
			if key in self.data:
				out[key] = self.data[key] # TODO: exception catching
		return out

	def update(self, data):
		for key in data:
			datum = data[key]
			if datum is None:
				if key in self.data:
					self.data.pop(key)
			else:
				self.data[key] = datum
		# self.flush()

	def flush(self):
		with open(self.file, 'w') as f:
			json.dump(self.data, f)
