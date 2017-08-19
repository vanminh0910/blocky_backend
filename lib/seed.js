'use strict';

const uuid = require('uuid');
const shortid = require('shortid');
const validator = require('validator');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const _ = require('underscore');
const config = require('../lib/config');
const constants = require('../lib/constants');
const dynamodb = require('../lib/dynamodb');
const utils = require('../lib/utils');

var markInitialized = (errorCb, successCb) => {
  const timestamp = new Date().getTime();

  var params = {
    TableName: process.env.SETTINGS_TABLE_NAME,
    Item: {
      name: 'initialize_data',
      value: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
  };

  dynamodb.put(params, (error) => {
    if (error) {
      console.error(error);
      errorCb(error);
    } else {
      successCb();
    }
  });
}

var addBrokerUser = (errorCb, successCb) => {
  const timestamp = new Date().getTime();

  var params = {
    TableName: process.env.USERS_TABLE_NAME,
    Item: {
      id: uuid.v1(),
      name: process.env.BROKER_NAME,
      email: process.env.BROKER_EMAIL,
      password: bcrypt.hashSync(process.env.BROKER_PASSWORD),
      authKey : shortid.generate(),
      activated: true,
      role: constants.ROLE_BROKER,
      language: 'en',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    ConditionExpression: "attribute_not_exists(email)",
  };

  dynamodb.put(params, (error) => {
    if (error) {
      console.error(error);
      errorCb(error);
      return;
    }

    successCb(params.Item);

  });
}

module.exports.seed = (event, context, callback) => {

  const getParams = {
    TableName: process.env.SETTINGS_TABLE_NAME,
    Key: {
      name: 'initialize_data'
    }
  };

  dynamodb.get(getParams, (error, result) => {
    if (error) {
      console.error(error);
      callback(null, utils.createResponse(500, 'An internal server error occurred '));
      return;
    }

    if (!_.isEmpty(result)) {
      callback(null, utils.createResponse(400, 'Data already initialized'));
      return;
    }

    addBrokerUser(function() {
      callback(null, utils.createResponse(500, 'An internal server error occurred '));
    }, function() {
      markInitialized(function() {
        callback(null, utils.createResponse(500, 'An internal server error occurred'));
      }, function() {
        callback(null, utils.createResponse(200, 'Data initialized successfully'));
      })
    });    
  });
};