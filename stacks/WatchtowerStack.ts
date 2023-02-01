import { StackContext, Api, Function, Config, Table, use } from "@serverless-stack/resources";

export function WatchtowerStack({ stack }: StackContext) {

  const table = new Table(stack, "WatchtowerEvents", {
    fields: {
      objectId: "string",
      eventId: "string",
      dataType: "string",
      eventType: "string",
      objectStatus: "string",
      systemName: "string",
      externalId: "string",
      description: "string",
      eventTime: "number",
    },
    primaryIndex: { partitionKey: "objectId", sortKey: "eventId" },
  });

  const API_KEY = new Config.Secret(stack, "API_KEY");

  const api = new Api(stack, "api", {
    authorizers: {
      myAuthorizer: {
        type: "lambda",
        responseTypes: ["simple"],
        function: new Function(stack, "Authorizer", {
          handler: "functions/authorizer.handler",
          bind: [
            API_KEY,
          ]
        })
      }
    },
    defaults: {
      authorizer: "myAuthorizer",
      function: {
        bind: [table]
      }
    },
    routes: {
      "POST /trace": "functions/addTrace.handler",
      "GET /object/{objectId}": "functions/getObjectStatus.handler",
    },
  });

  stack.addOutputs({
    ApiEndpoint: api.url,
  });
}
