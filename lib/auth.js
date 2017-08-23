'use strict';

const jwt = require('jsonwebtoken');
const config = require('./config');
const utils = require('./utils');

// Policy helper function
const generatePolicy = (principalId, effect, resource) => {
  var authResponse = {};
  authResponse.principalId = principalId;
  if (effect && resource) {
    const policyDocument = {};
    policyDocument.Version = '2012-10-17';
    policyDocument.Statement = [];
    const statementOne = {};
    statementOne.Action = 'execute-api:Invoke';
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }
  
  return authResponse;
};

// Reusable Authorizer function, set on `authorizer` field in serverless.yml
module.exports.auth = (event, context, callback) => {
  if (event.authorizationToken) {
    // remove "JWT " from token
    const token = event.authorizationToken.substring(4);
    jwt.verify(token, config.jwt.secret, null, (error, decoded) => {
      if (error) {
        callback(null, generatePolicy('user', 'Deny', event.methodArn));
        return;
      } else {
        callback(null, generatePolicy(decoded.user.id, 'Allow', event.methodArn));
      }
    });
  } else {
    callback(null, generatePolicy('user', 'Deny', event.methodArn));
  }
};

