# Watchtower - Object tracking service

Watchtower is an object-tracking service for storing object traces from different external services.
This kind of object tracing can be helpful in certain scenarios for example in a situation where user data needs to be integrated into different external services and it's hard to keep track of where user data is stored. In these cases, Watchtower can keep track of when the user object is updated to different services and if services have their external ids that can also be stored in Watchtower. This can help for both auditing and using information integrations in other services.

Watchtower works by storing traces that it receives about object statuses of the different systems. Idea is that when object data is integrated into a new service either service or integration should send a trace into the Watchtower. This trace should include the service name, trace event (add, update, delete), optional external id, and optional description. Watchtower keeps object statues and offers API for fetching object status.

## How to deploy

Watchtower is built with Serverless stack SST and uses Dynamodb to store data. Deploying Watchtower can be done with SST tooling.

First API key for the watchtower needs to be set as SST secret for the application

```
sst secrets set API_KEY '<api key>' --stage <stage name>
```

Next application can be deployed

```
sst deploy --stage <stage name>
```

After deploying application traces can be sent to Watchtower application.

## Api documentation

Api documentation for service can be found in [openapi.yaml](openapi.yaml)

## License 

This project is licensed under the terms of the MIT license.
