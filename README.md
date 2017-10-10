# blocky_backend
Backend for blocky

# start server
sls offline start --host 0.0.0.0

# start only dynamodb local
sls dynamodb install
sls dynamodb migrate
sls dynamodb seed
sls dynamodb start --seed users

# deploy
sls deploy --stage staging
