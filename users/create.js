'use strict';

var lib = require('../lib');

module.exports.create = (event, context, callback) => {
	callback(null, {
		statusCode: 400,
		body: JSON.stringify({ error: 'Bad Request', message: 'Please enter name of the script' }),
	});
};