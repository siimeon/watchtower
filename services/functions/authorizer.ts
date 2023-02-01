import { APIGatewayRequestSimpleAuthorizerHandlerV2 } from "aws-lambda";
import { Config } from "@serverless-stack/node/config";


export const handler: APIGatewayRequestSimpleAuthorizerHandlerV2 = async (event) => {
  // Get authorization header
  const authHeader = event.headers?.authorization;

  // Check if authorization header is present
  if (!authHeader) {
    return {
      isAuthorized: false,
    }
  }

  // Check if authorization header bearer token is valid
  const [authType, token] = authHeader.split(" ");
  if (authType !== "Bearer" || token !== Config.API_KEY) {
    return {
      isAuthorized: false,
    }
  }

  return {
    isAuthorized: true,
    context: {},
  };
};
