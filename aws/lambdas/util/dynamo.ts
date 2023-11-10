import { UpdateItemCommandInput } from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'

export const updateDynamoUtil = (db: { table: string, item: { [key: string]: any }, key: { [key: string]: any } }): UpdateItemCommandInput => {
  let params = {
    TableName: db.table,
    Key: db.key || {},
    ExpressionAttributeValues: {},
    ExpressionAttributeNames: {},
    UpdateExpression: "",
    ReturnValues: "UPDATED_NEW"
  } as UpdateItemCommandInput

  console.log(params)

  let prefix = "set "
  for (const o of Object.keys(db.item)) {
    if (db.item[o] != undefined && db.item[o] != null) {
      console.log(`${o} :: ${db.item[o]}`)
      params.UpdateExpression += prefix + "#" + o + " = :" + o
      params.ExpressionAttributeValues![":" + o] = db.item[o]
      params.ExpressionAttributeNames!["#" + o] = o
      prefix = ", "
    }
  }

  params.Key = marshall(params.Key, { removeUndefinedValues: true })
  params.ExpressionAttributeValues = marshall(params.ExpressionAttributeValues, { removeUndefinedValues: true })

  console.log(params)
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
export const merge = (a1: any[], a2: any[], matchKey: string, outputKey?: string) => {
  return a1.map((o1: any) => {
    const matchingObj = a2.find((o2: any) => o2[matchKey] === o1[matchKey])
    if (!outputKey)  return matchingObj ? { ...o1, ...matchingObj } : o1
    else return matchingObj ? { ...o1, [outputKey]: matchingObj } : o1
  })
}

/**
 * @param a1 
 * @param a2 
 * @param mk1 Match Key 1 is a key in a1. The value MUST be a string array.
 * @param mk2 Match Key 2 is a key in a2. if value of mk2 in a2 is in a2 mk1, then that object in a2 is added to a1.
 * @param outputKey 
 * @returns 
 */
export const multiMerge = (a1: any[], a2: any[], mk1: string, mk2: string, outputKey?: string) => {
  console.log("enter multiMerge")
  console.log(a1)
  console.log(a2)
  return a1.map((o1: any) => {
    console.log(`multiMerge: ${o1[mk1]}`)

    if (!Array.isArray(o1[mk1])) {
      console.log(`multiMerge: no array matching key ${mk1}`)
      if (!outputKey) return { ...o1 }
      else { return { ...o1, [outputKey]: []} }
    }

    const mos = []
    for (let i=0; i<o1[mk1].length; i++) {
      console.log(`multiMerge: ${o1[mk1][i]}`)
      const mo = a2.find((o2: any) => o1[mk1][i] === o2[mk2])
      console.log(`multiMerge: ${JSON.stringify(mo)}`)
      if (mo) mos.push(mo)
    }
    
    if (!outputKey)  return mos ? { ...o1, [mk1]:mos } : { ...o1 }
    else return mos ? { ...o1, [outputKey]: mos } : { ...o1 }
  })
}