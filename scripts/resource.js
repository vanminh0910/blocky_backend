'use strict';

var lib = require('../lib');

module.exports.create = (event, context, callback) => {
	var item = lib.utils.api.parseEvent(event);
	lib.models.scripts.create(item.body, (err, result, message) => {
		return lib.utils.api.easyRespond(result, err, 200, context, message);
	});
};

module.exports.readAll = (event, context, callback) => {
	lib.models.scripts.readAll((err, result, message) => {
		return lib.utils.api.easyRespond(result, err, 200, context, message);
	});
};

module.exports.read = (event, context, callback) => {
	var item = lib.utils.api.parseEvent(event);
	lib.models.scripts.read(item.id, (err, result, message) => {
		return lib.utils.api.easyRespond(result, err, 200, context, message);
	});
};

module.exports.update = (event, context, callback) => {
	var item = lib.utils.api.parseEvent(event);
	lib.models.scripts.update(item.id, item.body, (err, result, message) => {
		return lib.utils.api.easyRespond(result, err, 200, context, message);
	});
};

module.exports.delete = (event, context, callback) => {
	var item = lib.utils.api.parseEvent(event);
	lib.models.scripts.delete(item.id, (err, result, message) => {
		return lib.utils.api.easyRespond(result, err, 200, context, message);
	});
};