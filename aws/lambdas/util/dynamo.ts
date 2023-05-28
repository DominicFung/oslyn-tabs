import { UpdateItemCommandInput } from '@aws-sdk/client-dynamodb'

export const updateDynamoUtil = (db: { table: string, item: { [key: string]: any } }): UpdateItemCommandInput => {
  let params = {
    TableName: db.table,
    Key: {},
    ExpressionAttributeValues: {},
    ExpressionAttributeNames: {},
    UpdateExpression: "",
    ReturnValues: "UPDATED_NEW"
  } as UpdateItemCommandInput

  let prefix = "set "
  for (const o of Object.keys(db.item)) {
    if (db.item[o]) { 
      params.Key![o] = db.item[o]
      params.UpdateExpression += prefix + "#" + o + " = :" + o
      params.ExpressionAttributeValues![":" + o] = db.item[o]
      params.ExpressionAttributeNames!["#" + o] = o
      prefix = ", "
    }
  }
  return params
}

export function hasSubstring(strings: string[], substring: string): boolean {
  return strings.some((str) => str.includes(substring));
}