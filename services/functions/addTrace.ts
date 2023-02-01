import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { createNewTrace, WatchtowerTrace } from "../core/watchtowerService";


export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const { body } = event;
  const { objectId, systemName, dataType, eventType, externalId, description } = JSON.parse(body || "{}");;

  if (!objectId || !systemName || !dataType || !eventType) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "text/plain" },
      body: "Missing required fields",
    };
  }
  if (typeof objectId !== "string" || typeof systemName !== "string" || typeof dataType !== "string" || typeof eventType !== "string") {
    return {
      statusCode: 400,
      headers: { "Content-Type": "text/plain" },
      body: "Invalid field type",
    };
  }
  if (typeof externalId !== "undefined" && typeof externalId !== "string") {
    return {
      statusCode: 400,
      headers: { "Content-Type": "text/plain" },
      body: "Invalid field type",
    };
  }
  if (typeof description !== "undefined" && typeof description !== "string") {
    return {
      statusCode: 400,
      headers: { "Content-Type": "text/plain" },
      body: "Invalid field type",
    };
  }

  const trace: WatchtowerTrace = {
    objectId,
    systemName,
    dataType,
    eventType,
    externalId,
    description,
  }
  
  try {
    const traceId = await createNewTrace(trace);
    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "success",
        traceEventId: traceId,
        message: `Trace created with id ${traceId}`
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "error",
        message: "Error creating trace"
      })
    };
  }

}
