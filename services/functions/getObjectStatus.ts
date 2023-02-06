import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { getObjectStatuses, WatchtowerTraceRecord, WatchtowerObjectStatusRecord } from "../core/watchtowerService";

const mapResponse = (traceRecords: WatchtowerObjectStatusRecord[]) => {
  return traceRecords.map((traceRecord) => {
    return {
      objectId: traceRecord.objectId,
      systemName: traceRecord.systemName,
      dataType: traceRecord.dataType,
      deleted: traceRecord.deleted,
      externalId: traceRecord.externalId,
      updatedAt: traceRecord.eventTime,
    };
  });
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const objectId = event.pathParameters?.objectId;

  if (!objectId) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "text/plain" },
      body: "Missing path parameter",
    };
  }

  try {
    const objectStatuses = await getObjectStatuses(objectId);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        objectId,
        statuses: mapResponse(objectStatuses),
      }),
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "error",
        message: "Error getting object status"
      }),
    };
  }
}

