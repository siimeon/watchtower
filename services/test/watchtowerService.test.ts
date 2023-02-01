import { describe, it, expect, afterEach } from "vitest";
import AWS from "aws-sdk";
import { Table } from "@serverless-stack/node/table";
import { createNewTrace, getObjectStatuses, getTraceWithEventId } from "../core/watchtowerService";
import { deleteAllItemsWithPartitionKey } from "../core/dynamoDbHelper";

describe("Watchtower service", async () => {

  afterEach(async () => {
    const documentClient = new AWS.DynamoDB.DocumentClient();
    await deleteAllItemsWithPartitionKey({
      documentClient,
      tableName: Table.WatchtowerEvents.tableName,
      partitionKeyValue: "test",
      partitionKeyName: "objectId",
      sortKeyName: "eventId"
    });
  });

  it("createNewTrace return eventId", async () => {
    const eventId = await createNewTrace({
      objectId: "test",
      systemName: "test",
      dataType: "test",
      eventType: "add",
      externalId: "test",
      description: "test",
    });

    expect(eventId).toMatch(/test::\d+/);
  });

  it("createNewTrace throw error if invalid event type", async () => {
    await expect(
      createNewTrace({
        objectId: "test",
        systemName: "test",
        dataType: "test",
        eventType: "invalid",
        externalId: "test",
        description: "test",
      })
    ).rejects.toThrowError();
  });
  
  it("getTraceWithEventId return trace object with objectId and eventId", async () => {
    const eventId = await createNewTrace({
      objectId: "test",
      systemName: "test",
      dataType: "test",
      eventType: "add",
      externalId: "test",
      description: "test",
    });

    const trace = await getTraceWithEventId("test", eventId);
    expect(trace.objectId).toBe("test");
    expect(trace.eventId).toBe(eventId);
    expect(trace.dataType).toBe("test");
  });

  it("getTraceWithEventId throws error if trace not found", async () => {
    await expect(
      getTraceWithEventId("test", "not-exist-event-id")
    ).rejects.toThrowError();
  });

  it("getObjectStatuses returns empty array if no traces found with objectId", async () => {
    const statuses = await getObjectStatuses("not-exist-object-id");
    expect(statuses).toEqual([]);
  });

  it("getObjectStatuses returns array of statuses", async () => {
    const trace = {
      objectId: "test",
      systemName: "test",
      dataType: "test",
      eventType: "add",
      externalId: "test",
      description: "test",
    }
    
    await createNewTrace(trace);

    const statuses1 = await getObjectStatuses("test");
    expect(statuses1.length).toBe(1);
    expect(statuses1[0].objectId).toBe("test");
    expect(statuses1[0].externalId).toBe("test");
    expect(statuses1[0].deleted).toBe(false);

    await createNewTrace({
      ...trace,
      externalId: "test2",
    });

    const statuses2 = await getObjectStatuses("test");
    expect(statuses2.length).toBe(1);
    expect(statuses2[0].objectId).toBe("test");
    expect(statuses2[0].externalId).toBe("test2");
    expect(statuses2[0].deleted).toBe(false);
  });

  it("getObjectStatuses object status is deleted for after delete trace", async () => {
    const trace = {
      objectId: "test",
      systemName: "test",
      dataType: "test",
      eventType: "add",
      externalId: "test",
      description: "test",
    }
    
    await createNewTrace(trace);

    const statuses1 = await getObjectStatuses("test");
    expect(statuses1.length).toBe(1);
    expect(statuses1[0].objectId).toBe("test");
    expect(statuses1[0].externalId).toBe("test");
    expect(statuses1[0].deleted).toBe(false);

    await createNewTrace({
      ...trace,
      eventType: "delete",
    });

    const statuses2 = await getObjectStatuses("test");
    expect(statuses2.length).toBe(1);
    expect(statuses2[0].objectId).toBe("test");
    expect(statuses2[0].externalId).toBe("test");
    expect(statuses2[0].deleted).toBe(true);
  });
});
