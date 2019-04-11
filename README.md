# blocky_backend
Backend for blocky

# start server
```sh
sls offline start --host 0.0.0.0
```

# start only dynamodb local
```sh
sls dynamodb install
sls dynamodb migrate
sls dynamodb seed
sls dynamodb start --seed users
```

# deploy
```sh
sls deploy --stage staging
```
