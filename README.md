
# Nestjs Requests Log Middleware

This project is an example of requests log using middleware in NestJS.

The purpose of this project is to log every requests and its respective responses. For that purpose, CorrelationId/ContextId is used to trace entire call

## Requirements
1 - Docker + Docker compose OR NodeJS 20.x installed

### Running project
```
docker-compose up
```

### Sending request
```
curl --location 'http://localhost:3001' \
--header 'x-correlation-id: my-correlation-123'
```
