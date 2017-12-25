'use strict';

var _ = require('underscore');
var uuid = require('uuid');
const config = require('../lib/config');
const constants = require('../lib/constants');
const jwt = require('jsonwebtoken');
const path = require('path');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const ses = require('nodemailer-ses-transport');

const smtpTransport = nodemailer.createTransport(ses({
	accessKeyId: config.accessKeyId,
	secretAccessKey: config.secretAccessKey
}));

const handlebarsOptions = {
	viewEngine: 'handlebars',
	viewPath: path.resolve('./lib/templates/'),
	extName: '.html'
};

smtpTransport.use('compile', hbs(handlebarsOptions));

var utils = {

	createResponse: function (statusCode, message, data) {
		if (statusCode != null && statusCode != 200) {
			if (statusCode == 500)
				message = 'An internal server error occurred';
			
			return {
				statusCode: statusCode,
				headers: {
					'Access-Control-Allow-Origin' : '*',
					'Access-Control-Allow-Headers':'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
					'Access-Control-Allow-Credentials' : true,
					'Content-Type': 'application/json'
				},
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
				headers: {
					'Access-Control-Allow-Origin' : '*',
					'Access-Control-Allow-Headers':'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
					'Access-Control-Allow-Credentials' : true,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			};
		}

	},

	generateToken: function (user) {

		return jwt.sign({ user: user }, config.jwt.secret, {
			expiresIn: '2 days'
		});
	},

	filterBlankAttributes: function(obj) {
		for (var propName in obj) { 
			if (obj[propName] === null || obj[propName] === undefined || obj[propName] === '') {
				delete obj[propName];
			}
		}

		return obj;
	},

	toAttributeUpdates: function (keyValues) {
		keyValues = utils.filterBlankAttributes (keyValues);
		return _.mapObject(keyValues, function (val, key) {
			return {
				Action: 'PUT',
				Value: val
			}
		});
	},

	getEpochTime: function(days, hours) {
		var d = new Date();
		d.setDate(d.getDate()-days);
		if (hours) {
			d.setHours(d.getHours()-hours);
		}
		return d.getTime();
	},

	sendMail: function (mailOptions) {
		smtpTransport.sendMail(mailOptions, function (error) {
			if (error) {
				console.log(error);
			}
		});
	},

	getStrBetween: function (str, start, end) {
		var getBetween = {
			results: [],
			string: "",
			getBetween: function (sub1, sub2) {
				if (this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0) return false;
				var SP = this.string.indexOf(sub1) + sub1.length;
				var string1 = this.string.substr(0, SP);
				var string2 = this.string.substr(SP);
				var TP = string1.length + string2.indexOf(sub2);
				return this.string.substring(SP, TP);
			},
			removeFromBetween: function (sub1, sub2) {
				if (this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0) return false;
				var removal = sub1 + this.getBetween(sub1, sub2) + sub2;
				this.string = this.string.replace(removal, "");
			},
			getAllResults: function (sub1, sub2) {
				if (this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0) return;
				var result = this.getBetween(sub1, sub2);
				this.results.push(result);
				this.removeFromBetween(sub1, sub2);
				if (this.string.indexOf(sub1) > -1 && this.string.indexOf(sub2) > -1) {
					this.getAllResults(sub1, sub2);
				} else return;
			},
			get: function (string, sub1, sub2) {
				this.results = [];
				this.string = string;
				this.getAllResults(sub1, sub2);
				return this.results;
			}
		};
		return getBetween.get(str, start, end);
	}
};

module.exports = utils;
