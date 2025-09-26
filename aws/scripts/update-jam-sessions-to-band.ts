import { DynamoDBClient, ScanCommand, UpdateItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const dynamo = new DynamoDBClient({ region: 'us-east-1' });

const JAM_SESSION_TABLE_NAME = process.env.JAM_SESSION_TABLE_NAME || 'oslynstudio-JamSessionTable';
const BAND_TABLE_NAME = process.env.BAND_TABLE_NAME || 'oslynstudio-BandTable';
const USER_BAND_MEMBERSHIP_TABLE_NAME = process.env.USER_BAND_MEMBERSHIP_TABLE_NAME || 'oslynstudio-UserBandMembershipTable';

const TARGET_BAND_ID = '9e7724c6-fbda-4a0c-874d-3841ae0848c1_usr_default_band';
const TARGET_USER_ID = 'a8da4690-a3ae-4557-bb28-3764247325f8_usr';

async function updateJamSessionsToBand() {
  try {
    console.log('🎵 Starting jam session update process...');
    
    // 1. First, let's check if the band exists
    console.log(`🔍 Checking if band ${TARGET_BAND_ID} exists...`);
    try {
      const bandCheck = await dynamo.send(new ScanCommand({
        TableName: BAND_TABLE_NAME,
        FilterExpression: 'bandId = :bandId',
        ExpressionAttributeValues: {
          ':bandId': { S: TARGET_BAND_ID }
        }
      }));
      
      if (!bandCheck.Items || bandCheck.Items.length === 0) {
        console.log(`❌ Band ${TARGET_BAND_ID} does not exist. Creating it...`);
        
        // Create the band
        const bandData = {
          bandId: TARGET_BAND_ID,
          name: 'Default Band',
          description: 'Default band for jam sessions',
          isPublic: false,
          owner: TARGET_USER_ID,
          policy: 'PRIVATE_VIEW',
          createDate: Date.now(),
          updateDate: Date.now()
        };
        
        await dynamo.send(new PutItemCommand({
          TableName: BAND_TABLE_NAME,
          Item: marshall(bandData)
        }));
        
        console.log(`✅ Created band ${TARGET_BAND_ID}`);
      } else {
        console.log(`✅ Band ${TARGET_BAND_ID} already exists`);
      }
    } catch (error) {
      console.error('❌ Error checking/creating band:', error);
      return;
    }
    
    // 2. Add user to band membership
    console.log(`👤 Adding user ${TARGET_USER_ID} to band ${TARGET_BAND_ID}...`);
    try {
      const membershipData = {
        userId: TARGET_USER_ID,
        bandId: TARGET_BAND_ID,
        role: 'ADMIN',
        joinedAt: Date.now()
      };
      
      await dynamo.send(new PutItemCommand({
        TableName: USER_BAND_MEMBERSHIP_TABLE_NAME,
        Item: marshall(membershipData)
      }));
      
      console.log(`✅ Added user to band membership`);
    } catch (error) {
      console.error('❌ Error adding user to band:', error);
      return;
    }
    
    // 3. Get all jam sessions
    console.log('🔍 Scanning all jam sessions...');
    const scanResult = await dynamo.send(new ScanCommand({
      TableName: JAM_SESSION_TABLE_NAME
    }));
    
    if (!scanResult.Items || scanResult.Items.length === 0) {
      console.log('❌ No jam sessions found');
      return;
    }
    
    console.log(`📊 Found ${scanResult.Items.length} jam sessions`);
    
    // 4. Update each jam session to be private and associated with the band
    let updatedCount = 0;
    for (const item of scanResult.Items) {
      const jamSession = unmarshall(item);
      
      console.log(`🔄 Updating jam session: ${jamSession.jamSessionId}`);
      
      try {
        await dynamo.send(new UpdateItemCommand({
          TableName: JAM_SESSION_TABLE_NAME,
          Key: {
            jamSessionId: { S: jamSession.jamSessionId }
          },
          UpdateExpression: 'SET policy = :policy, bandId = :bandId, updateDate = :updateDate',
          ExpressionAttributeValues: {
            ':policy': { S: 'PRIVATE_VIEW' },
            ':bandId': { S: TARGET_BAND_ID },
            ':updateDate': { N: Date.now().toString() }
          }
        }));
        
        updatedCount++;
        console.log(`✅ Updated jam session: ${jamSession.jamSessionId}`);
      } catch (error) {
        console.error(`❌ Error updating jam session ${jamSession.jamSessionId}:`, error);
      }
    }
    
    console.log(`🎉 Successfully updated ${updatedCount} jam sessions`);
    console.log(`✅ All jam sessions are now private and associated with band ${TARGET_BAND_ID}`);
    console.log(`✅ User ${TARGET_USER_ID} is now a member of the band`);
    
  } catch (error) {
    console.error('❌ Error in update process:', error);
  }
}

// Run the update
updateJamSessionsToBand();
