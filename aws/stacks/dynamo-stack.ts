import { App, CfnOutput, RemovalPolicy, Stack } from 'aws-cdk-lib'
import { AttributeType, BillingMode, StreamViewType, Table } from 'aws-cdk-lib/aws-dynamodb'

interface DynamoProps {
  name: string
}

const RPOLICY = RemovalPolicy.DESTROY

export class DynamoStack extends Stack {
  constructor(app: App, id: string, props: DynamoProps) {
    super(app, id)

    const recordingTable = new Table(this, `${props.name}-RecordingTable`, {
      tableName: `${props.name}-RecordingTable`,
      partitionKey: {
        name: `recordingId`,
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      stream: StreamViewType.NEW_IMAGE,
      removalPolicy: RPOLICY
    })

    recordingTable.addGlobalSecondaryIndex({
      indexName: 'songId',
      partitionKey: {
        name: 'songId',
        type: AttributeType.STRING
      }
    })

    new CfnOutput(this, `${props.name}-RecordingTableName`, {
      value: recordingTable.tableName,
      exportName: `${props.name}-RecordingTableName`
    })

    new CfnOutput(this, `${props.name}-RecordingTableArn`, {
      value: recordingTable.tableArn,
      exportName: `${props.name}-RecordingTableArn`
    })

    const songTable = new Table(this, `${props.name}-SongTable`, {
      tableName: `${props.name}-SongTable`,
      partitionKey: {
        name: `songId`,
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      stream: StreamViewType.NEW_IMAGE,
      removalPolicy: RPOLICY
    })

    songTable.addGlobalSecondaryIndex({
      indexName: 'userId',
      partitionKey: {
        name: 'userId',
        type: AttributeType.STRING
      }
    })

    new CfnOutput(this, `${props.name}-SongTableName`, {
      value: songTable.tableName,
      exportName: `${props.name}-SongTableName`
    })

    new CfnOutput(this, `${props.name}-SongTableArn`, {
      value: songTable.tableArn,
      exportName: `${props.name}-SongTableArn`
    })
  }
}