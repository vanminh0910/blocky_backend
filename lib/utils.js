'use strict';

var _ = require('underscore');
var uuid = require('uuid');
const config = require('../lib/config');
const constants = require('../lib/constants');
const jwt = require('jsonwebtoken');

var utils = {

	createResponse: function (statusCode, message, data) {
		if (statusCode != null && statusCode != 200) {
			return {
				statusCode: statusCode,
				body: JSON.stringify({
					error: {
						code: statusCode,
						message: message
					}
				})
			};
		} else {
			return {
				statusCode: 200,
				body: JSON.stringify({data: data})
			};
		}

	},

	generateToken: function(user) {

		return jwt.sign({user: user}, config.jwt.secret, {
			expiresIn: '2 days'
		});
	},

	toAttributeUpdates: function(keyValues) {
		return _.mapObject(keyValues, function(val, key) {
			return {
				Action: 'PUT',
				Value: val
			}
		});
	}

};

module.exports = utils;
