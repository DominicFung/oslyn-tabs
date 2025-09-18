// Simple test to check if jam sessions exist
const AWS = require('aws-sdk');

// Configure AWS (you'll need to set your credentials)
const dynamodb = new AWS.DynamoDB({ region: 'us-east-1' }); // Change region as needed

async function testJamSessions() {
  try {
    // Try to scan the jam session table to see what exists
    const params = {
      TableName: 'oslynstudio-JamSessionTable', // This might need to be adjusted
      Limit: 10
    };
    
    const result = await dynamodb.scan(params).promise();
    console.log('Found jam sessions:', result.Items?.length || 0);
    
    if (result.Items && result.Items.length > 0) {
      console.log('Sample jam session IDs:');
      result.Items.forEach((item, index) => {
        if (item.jamSessionId) {
          console.log(`${index + 1}. ${item.jamSessionId.S}`);
        }
      });
    } else {
      console.log('No jam sessions found in the database');
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.log('This might be because:');
    console.log('1. The table name is different');
    console.log('2. AWS credentials are not configured');
    console.log('3. The region is wrong');
    console.log('4. The table doesn\'t exist');
  }
}

testJamSessions();

