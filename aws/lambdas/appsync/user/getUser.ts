import { AppSyncResolverEvent } from 'aws-lambda'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  email: string, username: string, firstName?: string, lastName?: string
}, null>) => {
  console.log(event)

  

}