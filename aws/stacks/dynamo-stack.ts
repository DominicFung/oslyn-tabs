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

    recordingTable.addGlobalSecondaryIndex({
      indexName: 'userId',
      partitionKey: {
        name: 'userId',
        type: AttributeType.STRING
      }
    })

    new CfnOutput(this, `${props.name}-RecordingTable-Name`, {
      value: recordingTable.tableName,
      exportName: `${props.name}-RecordingTable-Name`
    })

    new CfnOutput(this, `${props.name}-RecordingTable-Arn`, {
      value: recordingTable.tableArn,
      exportName: `${props.name}-RecordingTable-Arn`
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

    new CfnOutput(this, `${props.name}-SongTable-Name`, {
      value: songTable.tableName,
      exportName: `${props.name}-SongTable-Name`
    })

    new CfnOutput(this, `${props.name}-SongTable-Arn`, {
      value: songTable.tableArn,
      exportName: `${props.name}-SongTable-Arn`
    })

    const userTable = new Table(this, `${props.name}-UserTable`, {
      tableName: `${props.name}-UserTable`,
      partitionKey: {
        name: `userId`,
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      stream: StreamViewType.NEW_IMAGE,
      removalPolicy: RPOLICY
    })

    userTable.addGlobalSecondaryIndex({
      indexName: 'email',
      partitionKey: {
        name: 'email',
        type: AttributeType.STRING
      }
    })

    new CfnOutput(this, `${props.name}-UserTable-Name`, {
      value: userTable.tableName,
      exportName: `${props.name}-UserTable-Name`
    })

    new CfnOutput(this, `${props.name}-UserTable-Arn`, {
      value: userTable.tableArn,
      exportName: `${props.name}-UserTable-Arn`
    })

    const bandTable = new Table(this, `${props.name}-BandTable`, {
      tableName: `${props.name}-BandTable`,
      partitionKey: {
        name: `bandId`,
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      stream: StreamViewType.NEW_IMAGE,
      removalPolicy: RPOLICY
    })

    bandTable.addGlobalSecondaryIndex({
      indexName: 'owner',
      partitionKey: {
        name: 'userId',
        type: AttributeType.STRING
      }
    })

    new CfnOutput(this, `${props.name}-BandTable-Name`, {
      value: bandTable.tableName,
      exportName: `${props.name}-BandTable-Name`
    })

    new CfnOutput(this, `${props.name}-BandTable-Arn`, {
      value: bandTable.tableArn,
      exportName: `${props.name}-BandTable-Arn`
    })

    const bandUserRoleTable = new Table(this, `${props.name}-BandUserRoleTable`, {
      tableName: `${props.name}-BandUserRoleTable`,
      partitionKey: {
        name: `roleId`,
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      stream: StreamViewType.NEW_IMAGE,
      removalPolicy: RPOLICY
    })

    bandUserRoleTable.addGlobalSecondaryIndex({
      indexName: 'band',
      partitionKey: {
        name: 'bandId',
        type: AttributeType.STRING
      }
    })

    bandUserRoleTable.addGlobalSecondaryIndex({
      indexName: 'user',
      partitionKey: {
        name: "userId",
        type: AttributeType.STRING
      }
    })

    new CfnOutput(this, `${props.name}-BandUserRoleTable-Name`, {
      value: bandUserRoleTable.tableName,
      exportName: `${props.name}-BandUserRoleTable-Name`
    })

    new CfnOutput(this, `${props.name}-BandUserRoleTable-Arn`, {
      value: bandUserRoleTable.tableArn,
      exportName: `${props.name}-BandUserRoleTable-Arn`
    })

    const setListTable = new Table(this, `${props.name}-SetListTable`, {
      tableName: `${props.name}-SetListTable`,
      partitionKey: {
        name: `setListId`,
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      stream: StreamViewType.NEW_IMAGE,
      removalPolicy: RPOLICY
    })

    setListTable.addGlobalSecondaryIndex({
      indexName: 'owner',
      partitionKey: {
        name: 'userId',
        type: AttributeType.STRING
      }
    })

    new CfnOutput(this, `${props.name}-SetListTable-Name`, {
      value: setListTable.tableName,
      exportName: `${props.name}-SetListTable-Name`
    })

    new CfnOutput(this, `${props.name}-SetListTable-Arn`, {
      value: setListTable.tableArn,
      exportName: `${props.name}-SetListTable-Arn`
    })

    const jamSessionTable = new Table(this, `${props.name}-JamSessionTable`, {
      tableName: `${props.name}-JamSessionTable`,
      partitionKey: {
        name: `jamSessionId`,
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      stream: StreamViewType.NEW_IMAGE,
      removalPolicy: RPOLICY
    })

    new CfnOutput(this, `${props.name}-JamTable-Name`, {
      value: jamSessionTable.tableName,
      exportName: `${props.name}-JamTable-Name`
    })

    new CfnOutput(this, `${props.name}-JamTable-Arn`, {
      value: jamSessionTable.tableArn,
      exportName: `${props.name}-JamTable-Arn`
    })

    const TTL = "ttl"
    const inviteTable = new Table(this, `${props.name}-InviteTable`, {
      tableName: `${props.name}-InviteTable`,
      partitionKey: {
        name: `inviteId`,
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      stream: StreamViewType.NEW_IMAGE,
      removalPolicy: RPOLICY,
      timeToLiveAttribute: TTL
    })

    new CfnOutput(this, `${props.name}-InviteTable-Name`, {
      value: inviteTable.tableName,
      exportName: `${props.name}-InviteTable-Name`
    })

    new CfnOutput(this, `${props.name}-InviteTable-Arn`, {
      value: inviteTable.tableArn,
      exportName: `${props.name}-InviteTable-Arn`
    })
  }
}