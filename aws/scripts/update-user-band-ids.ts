import { DynamoDBClient, QueryCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const dynamo = new DynamoDBClient({ region: 'us-east-1' });

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || 'oslynstudio-UserTable';
const USER_BAND_MEMBERSHIP_TABLE_NAME = process.env.USER_BAND_MEMBERSHIP_TABLE_NAME || 'oslynstudio-UserBandMembershipTable';

const TARGET_USER_ID = 'a8da4690-a3ae-4557-bb28-3764247325f8_usr';

async function updateUserBandIds() {
  console.log('🔄 Updating user band IDs...');

  // 1. Get all bands the user is a member of
  console.log(`👤 Getting band memberships for user ${TARGET_USER_ID}...`);
  const userBandsRes = await dynamo.send(new QueryCommand({
    TableName: USER_BAND_MEMBERSHIP_TABLE_NAME,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': { S: TARGET_USER_ID } }
  }));

  if (!userBandsRes.Items || userBandsRes.Items.length === 0) {
    console.log('❌ No band memberships found for user');
    return;
  }

  const bandIds = userBandsRes.Items.map(item => unmarshall(item).bandId);
  console.log(`📊 Found ${bandIds.length} band memberships:`, bandIds);

  // 2. Update the user's bandIds field
  console.log(`🔄 Updating user ${TARGET_USER_ID} with bandIds...`);
  try {
    await dynamo.send(new UpdateItemCommand({
      TableName: USER_TABLE_NAME,
      Key: {
        userId: { S: TARGET_USER_ID }
      },
      UpdateExpression: 'SET bandIds = :bandIds',
      ExpressionAttributeValues: marshall({
        ':bandIds': bandIds
      }),
    }));
    console.log('✅ Successfully updated user bandIds');
  } catch (error) {
    console.error('❌ Error updating user bandIds:', error);
  }

  console.log('🎉 User band IDs update completed');
}

updateUserBandIds().catch(console.error);
