import AWS from "aws-sdk";

export interface deleteAllItemsWithPartitionKeyParams {
  documentClient: AWS.DynamoDB.DocumentClient
  tableName: string
  partitionKeyValue: string
  partitionKeyName: string
  sortKeyName: string
}

export async function deleteAllItemsWithPartitionKey({
  documentClient,
  tableName,
  partitionKeyValue,
  partitionKeyName,
  sortKeyName
}: deleteAllItemsWithPartitionKeyParams) {
  const scanParams: any = {
      TableName: tableName,
      FilterExpression: "#pk = :pk",
      ExpressionAttributeNames: {
          "#pk": partitionKeyName
      },
      ExpressionAttributeValues: {
          ":pk": partitionKeyValue
      }
  };

  const itemsToDelete: any[] = [];
  let lastEvaluatedKey;
  do {
      scanParams.ExclusiveStartKey = lastEvaluatedKey;
      const scanResult = await documentClient.scan(scanParams).promise();
      itemsToDelete.push(...scanResult.Items!);
      lastEvaluatedKey = scanResult.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  for (const item of itemsToDelete) {
      const deleteParams = {
          TableName: tableName,
          Key: {
              [partitionKeyName]: item[partitionKeyName],
              [sortKeyName]: item[sortKeyName]
          }
      };

      await documentClient.delete(deleteParams).promise();
  }
}