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

/**
 * @param a1 
 * @param a2 
 * @param matchKey 
 * @param outputKey 
 * @returns 
 */
export const merge = (a1: any, a2: any, matchKey: string, outputKey?: string) => {
  return a1.map((o1: any) => {
    const matchingObj = a2.find((o2: any) => o2[matchKey] === o1[matchKey])
    if (!outputKey)  return matchingObj ? { ...o1, ...matchingObj } : o1
    else return matchingObj ? { ...o1, [outputKey]: matchingObj } : o1
  })
}