#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""A Toy Key-value Database

Used JSON for storage.
Made for testing purpose.

Copyright 2019, Shawwwn <shawwwn1@gmail.com>
"""

import json

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

	def get(self):
		return self.data

	def update(self, data):
		for key in data:
			datum = data[key];
			if datum is None:
				key in self.data and self.data.pop(key)
			else:
				self.data[key] = datum
		# self.flush()

	def flush(self):
		with open(self.file, 'w') as f:
			json.dump(self.data, f)
