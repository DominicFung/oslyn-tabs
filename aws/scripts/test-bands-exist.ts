import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const BAND_TABLE_NAME = process.env.BAND_TABLE_NAME || 'oslynstudio-BandTable'
const BAND_IDS = [
  '9e7724c6-fbda-4a0c-874d-3841ae0848c1_usr_default_band',
  'a8da4690-a3ae-4557-bb28-3764247325f8_usr_default_band'
]

async function testBandsExist() {
  const dynamo = new DynamoDBClient({})
  
  console.log('🔍 Testing if bands exist in BAND_TABLE...')
  console.log('📊 Band IDs to check:', BAND_IDS)
  
  for (let i = 0; i < BAND_IDS.length; i++) {
    const bandId = BAND_IDS[i]
    console.log(`\n📊 ${i + 1}. Checking band: ${bandId}`)
    
    try {
      const result = await dynamo.send(new GetItemCommand({
        TableName: BAND_TABLE_NAME,
        Key: { bandId: { S: bandId } }
      }))
      
      if (result.Item) {
        const band = unmarshall(result.Item)
        console.log(`✅ Band found: ${band.name}`)
        console.log(`   - Owner: ${band.userId}`)
        console.log(`   - Admins: ${band.adminIds?.length || 0}`)
        console.log(`   - Members: ${band.memberIds?.length || 0}`)
      } else {
        console.log(`❌ Band NOT found in BAND_TABLE`)
      }
    } catch (error) {
      console.log(`❌ Error checking band: ${error}`)
    }
  }
}

// Run if this file is executed directly
if (require.main === module) {
  testBandsExist()
    .then(() => {
      console.log('\nTest completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Test failed:', error)
      process.exit(1)
    })
}

export { testBandsExist }
