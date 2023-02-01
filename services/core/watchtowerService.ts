import AWS from "aws-sdk";
import { Table } from "@serverless-stack/node/table";

export interface WatchtowerTrace {
  objectId: string;
  systemName: string;
  dataType: string;
  eventType: string;
  externalId?: string;
  description?: string;
}

export interface WatchtowerTraceRecord extends WatchtowerTrace {
  eventId: string;
  eventTime: number;
  
}

export interface WatchtowerObjectStatusRecord extends WatchtowerTraceRecord {
  deleted: boolean;
}

export interface WatchtowerTableParams {
  TableName: string;
  Item: WatchtowerTraceRecord;
}

const documentClient = new AWS.DynamoDB.DocumentClient();

const writeTraceToDynamoDb = async (traceRecord: WatchtowerTraceRecord | WatchtowerObjectStatusRecord) => {
  const params: WatchtowerTableParams = {
    TableName: Table.WatchtowerEvents.tableName,
    Item: traceRecord,
  };
  return documentClient.put(params).promise();
}

const queryDynamicDb = async ({KeyConditionExpression, ExpressionAttributeValues}: Omit<AWS.DynamoDB.DocumentClient.QueryInput, "TableName">) => {
  const params: AWS.DynamoDB.DocumentClient.QueryInput = {
    TableName: Table.WatchtowerEvents.tableName,
    KeyConditionExpression,
    ExpressionAttributeValues
  };

  return documentClient.query(params).promise();
}

/**
 * Create a new trace
 * @param trace 
 * @returns Promise<string> eventId
 * @throws Error if invalid event type
 */
export const createNewTrace = async (trace: WatchtowerTrace) => { 
  const { objectId, systemName, dataType, eventType, externalId, description } = trace;
  
  // validate event type
  if (!['add', 'update', 'delete'].includes(eventType)) {
    throw new Error(`Invalid event type: ${eventType}`);
  }

  const sanitizedSystemName = systemName.toLocaleLowerCase();
  const sanitizedDataType = dataType.toLocaleLowerCase();
  const timeStamp = Date.now();
  const traceEventId = `${sanitizedSystemName}::${timeStamp}`;
  
  
  await writeTraceToDynamoDb({
    objectId,
    eventId: traceEventId,
    systemName: sanitizedSystemName,
    dataType: sanitizedDataType,
    eventType,
    eventTime: timeStamp,
    externalId,
    description,
  });
  await writeTraceToDynamoDb({
    objectId,
    eventId: `status::${sanitizedSystemName}`,
    systemName: sanitizedSystemName,
    dataType: sanitizedDataType,
    eventType: "status",
    deleted: eventType === "delete",
    eventTime: timeStamp,
    externalId,
  });
  return traceEventId;
}

/**
 * Get statuses for an object
 * @param objectId 
 * @returns WatchtowerTraceRecord[] status records for the object
 */
export const getObjectStatuses = async (objectId: string) => {
  const data = await queryDynamicDb({
    KeyConditionExpression: 'objectId = :objectId and begins_with(eventId, :status)',
    ExpressionAttributeValues: {
        ':objectId': objectId,
        ':status': 'status::'
    }
  });

  if (data.Count === 0) {
    return [];
  }
  return data.Items as WatchtowerObjectStatusRecord[];
}

/**
 * Get a trace record for an object
 * @param objectId
 * @param eventId
 * @returns WatchtowerTraceRecord
 * @throws Error if no trace record is found
 */
export const getTraceWithEventId = async (objectId: string, eventId: string): Promise<WatchtowerTraceRecord> => {
  const data = await queryDynamicDb({
    KeyConditionExpression: 'objectId = :objectId and eventId = :eventId',
    ExpressionAttributeValues: {
        ':objectId': objectId,
        ':eventId': eventId
    }
  });

  if (data.Count === 0 || !data.Items) {
    throw new Error(`No trace found for object ${objectId} and event ${eventId}`);
  }
  return data.Items[0] as WatchtowerTraceRecord;
}

