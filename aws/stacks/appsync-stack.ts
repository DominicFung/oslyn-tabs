import { App, CfnOutput, Duration, Fn, RemovalPolicy, Stack } from 'aws-cdk-lib'
// import { GraphqlApi, SchemaFile, AuthorizationType, FieldLogLevel } from 'aws-cdk-lib/aws-appsync'
import { AmplifyGraphqlApi, AmplifyGraphqlDefinition } from '@aws-amplify/graphql-api-construct'
import { ManagedPolicy, Policy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { CfnPermission, Function, Runtime, RuntimeFamily } from 'aws-cdk-lib/aws-lambda'
import { IMPORTER_CONTROL_EXPORT } from '../importerNames'
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs'
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb'
import path, { join } from 'path'

interface AppsyncProps {
  name: string
}

export class AppsyncStack extends Stack {
  constructor(app: App, id: string, props: AppsyncProps) {
    super(app, id)

    const userDynamoName = Fn.importValue(`${props.name}-UserTable-Name`)
    const userDynamoArn = Fn.importValue(`${props.name}-UserTable-Arn`)

    const songDynamoName = Fn.importValue(`${props.name}-SongTable-Name`)
    const songDynamoArn = Fn.importValue(`${props.name}-SongTable-Arn`)

    const bandDynamoName = Fn.importValue(`${props.name}-BandTable-Name`)
    const bandDynamoArn = Fn.importValue(`${props.name}-BandTable-Arn`)

    const userBandRoleDynamoName = Fn.importValue(`${props.name}-BandUserRoleTable-Name`)
    const userBandRoleDynamoArn = Fn.importValue(`${props.name}-BandUserRoleTable-Arn`)

    const setListDynamoName = Fn.importValue(`${props.name}-SetListTable-Name`)
    const setListDynamoArn = Fn.importValue(`${props.name}-SetListTable-Arn`)

    const jamDynamoName = Fn.importValue(`${props.name}-JamTable-Name`)
    const jamDynamoArn = Fn.importValue(`${props.name}-JamTable-Arn`)

    const inviteDynamoName = Fn.importValue(`${props.name}-InviteTable-Name`)
    const inviteDynamoArn = Fn.importValue(`${props.name}-InviteTable-Arn`)

    const recordingDynamoName = Fn.importValue(`${props.name}-RecordingTable-Name`)
    const recordingDynamoArn = Fn.importValue(`${props.name}-RecordingTable-Arn`)

    const userBandMembershipDynamoName = Fn.importValue(`${props.name}-UserBandMembershipTable-Name`)
    const userBandMembershipDynamoArn = Fn.importValue(`${props.name}-UserBandMembershipTable-Arn`)

    const bandSongDynamoName = Fn.importValue(`${props.name}-BandSongTable-Name`)
    const bandSongDynamoArn = Fn.importValue(`${props.name}-BandSongTable-Arn`)

    const bandSetlistDynamoName = Fn.importValue(`${props.name}-BandSetlistTable-Name`)
    const bandSetlistDynamoArn = Fn.importValue(`${props.name}-BandSetlistTable-Arn`)

    // New table lives in this stack so a deploy does not touch DynamoStack.
    // DynamoStack owns the existing tables and uses DESTROY; adding a table there
    // would require deploying that stack. This table is only created with AppsyncStack.
    const chordImportTable = new Table(this, `${props.name}-ChordImportTable`, {
      tableName: `${props.name}-ChordImportTable`,
      partitionKey: { name: 'requestId', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    })
    chordImportTable.addGlobalSecondaryIndex({
      indexName: 'status',
      partitionKey: { name: 'status', type: AttributeType.STRING },
    })

    const appsync = new AmplifyGraphqlApi(this, `${props.name}-Appsync`, {
      apiName: `${props.name}`,
      definition: AmplifyGraphqlDefinition.fromFiles(path.join(__dirname, "../", 'schema.graphql')),
      authorizationModes: {
        apiKeyConfig: { expires: Duration.days(365) }
      },
      
    })

    // const appsync = new GraphqlApi(this, `${props.name}-Appsync`, {
    //   name: `${props.name}`,
    //   schema: SchemaFile.fromAsset(path.join(__dirname, "../", 'schema.graphql')),
    //   authorizationConfig: {
    //     defaultAuthorization: {
    //       authorizationType: AuthorizationType.API_KEY,
    //       apiKeyConfig: {
    //         expires: Expiration.after(Duration.days(365))
    //       }
    //     },
    //   },
    //   xrayEnabled: true,
    //   logConfig: { excludeVerboseContent: true, fieldLogLevel: FieldLogLevel.ALL }, // remove later
    // })

    new CfnOutput(this, "GraphQLAPIURL", { value: appsync.graphqlUrl })
    new CfnOutput(this, "GraphQLAPIKey", { value: appsync.apiKey || '' })
    new CfnOutput(this, "Stack Region", { value: this.region })
    new CfnOutput(this, `${props.name}-AppsyncId`, { value: appsync.apiId })

    new CfnOutput(this, `${props.name}-AppsyncArn`, {
      value: appsync.resources.graphqlApi.arn,
      exportName: `${props.name}-AppsyncArn`
    })

    const excRole = new Role(this, `${props.name}-AppsyncLambdaRole`, {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com')
    })

    excRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
    )

    excRole.attachInlinePolicy(
      new Policy(this, `${props.name}-InlinePolicy`, {
        statements: [
          new PolicyStatement({
            actions: [
              "secretsmanager:GetResourcePolicy",
              "secretsmanager:GetSecretValue",
              "secretsmanager:DescribeSecret",
              "secretsmanager:ListSecretVersionIds",
              "secretsmanager:ListSecrets"
            ],
            resources: ["*"]
          }),
          new PolicyStatement({
            actions: ["secretsmanager:GetSecretValue"],
            resources: [`arn:aws:secretsmanager:${this.region}:${this.account}:secret:oslynstudio/secret*`],
          }),
          new PolicyStatement({
            actions: [ "dynamodb:*" ],
            resources: [ 
              `${userDynamoArn}*`, `${bandDynamoArn}*`, `${songDynamoArn}*`, 
              `${setListDynamoArn}*`, `${jamDynamoArn}*`, `${inviteDynamoArn}*`,
              `${userBandRoleDynamoArn}*`, `${recordingDynamoArn}*`,
              `${userBandMembershipDynamoArn}*`, `${bandSongDynamoArn}*`, `${bandSetlistDynamoArn}*`,
              `${chordImportTable.tableArn}*`
            ]
          }),
          new PolicyStatement({
            actions: [ "lambda:InvokeFunction" ],
            resources: [ `*` ]
          })
        ]
      })
    )

    const nodeJsFunctionProps: NodejsFunctionProps = {
      role: excRole,
      bundling: {
        // Node 22 does not ship aws-sdk v2. esbuild 0.22+ also needs packages bundled
        // or this CDK version emits a runtime require("module").
        esbuildArgs: { '--packages': 'bundle' },
      },
      depsLockFilePath: join(__dirname, '../lambdas', 'package-lock.json'),
      environment: { 
        USER_TABLE_NAME: userDynamoName,
        BAND_TABLE_NAME: bandDynamoName,
        SONG_TABLE_NAME: songDynamoName,
        SETLIST_TABLE_NAME: setListDynamoName,
        JAM_TABLE_NAME: jamDynamoName,
        INVITE_TABLE_NAME: inviteDynamoName,
        USER_BAND_ROLE_TABLE_NAME: userBandRoleDynamoName,
        RECORDING_TABLE_NAME: recordingDynamoName,
        USER_BAND_MEMBERSHIP_TABLE_NAME: userBandMembershipDynamoName,
        BAND_SONG_TABLE_NAME: bandSongDynamoName,
        BAND_SETLIST_TABLE_NAME: bandSetlistDynamoName,
        CHORD_IMPORT_TABLE_NAME: chordImportTable.tableName
      },
      runtime: new Runtime('nodejs22.x', RuntimeFamily.NODEJS, { supportsInlineCode: true }),
    }

    const listMemory = 1024

    const createUser = new NodejsFunction(this, `${props.name}-CreateUser`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'user', 'createUser.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}CreateUserDS`, createUser)
    .createResolver(`${props.name}-CreateUserResolver`, {
      typeName: "Mutation",
      fieldName: "createUser"
    })

    const getUserById = new NodejsFunction(this, `${props.name}-GetUserById`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'user', 'getUserById.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}GetUserByIdDS`, getUserById)
    .createResolver(`${props.name}-GetUserByIdResolver`, {
      typeName: "Query",
      fieldName: "getUserById"
    })

    const addFriendByEmail = new NodejsFunction(this, `${props.name}-AddFriendByEmail`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'user', 'addFriendByEmail.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}AddFriendByEmailDS`, addFriendByEmail)
    .createResolver(`${props.name}-AddFriendByEmailResolver`, {
      typeName: "Mutation",
      fieldName: "addFriendByEmail"
    })

    const removeFriendById = new NodejsFunction(this, `${props.name}-RemoveFriendById`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'user', 'removeFriendById.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}RemoveFriendByIdDS`, removeFriendById)
    .createResolver(`${props.name}-RemoveFriendByIdResolver`, {
      typeName: "Mutation",
      fieldName: "removeFriendById"
    })

    const createSong = new NodejsFunction(this, `${props.name}-CreateSong`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'song', 'createSong.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}CreateSongDS`, createSong)
    .createResolver(`${props.name}-CreateSongResolver`, {
      typeName: "Mutation",
      fieldName: "createSong"
    })

    const updateSong = new NodejsFunction(this, `${props.name}-UpdateSong`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'song', 'updateSong.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}UpdateSongDS`, updateSong)
    .createResolver(`${props.name}-UpdateSongResolver`, {
      typeName: "Mutation",
      fieldName: "updateSong"
    })

    const getSong = new NodejsFunction(this, `${props.name}-GetSong`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'song', 'getSong.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}GetSongDS`, getSong)
    .createResolver(`${props.name}-GetSongResolver`, {
      typeName: "Query",
      fieldName: "getSong"
    })

    const getSongCount = new NodejsFunction(this, `${props.name}-GetSongCount`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'song', 'getSongCount.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}GetSongCountDS`, getSongCount)
    .createResolver(`${props.name}-GetSongCountResolver`, {
      typeName: "Query",
      fieldName: "getSongCount"
    })

    const listSongs = new NodejsFunction(this, `${props.name}-ListSongs`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'song', 'listSongs.ts'),
      timeout: Duration.minutes(5),
      memorySize: listMemory,
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}ListSongsDS`, listSongs)
    .createResolver(`${props.name}-ListSongsResolver`, {
      typeName: "Query",
      fieldName: "listSongs"
    })

    const listSharedSongs = new NodejsFunction(this, `${props.name}-ListSharedSongs`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'song', 'listSharedSongs.ts'),
      timeout: Duration.minutes(5),
      memorySize: listMemory,
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}ListSharedSongsDS`, listSharedSongs)
    .createResolver(`${props.name}-ListSharedSongsResolver`, {
      typeName: "Query",
      fieldName: "listSharedSongs"
    })

    const shareSong = new NodejsFunction(this, `${props.name}-ShareSong`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'song', 'shareSong.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}ShareSongDS`, shareSong)
    .createResolver(`${props.name}-ShareSongResolver`, {
      typeName: "Mutation",
      fieldName: "shareSong"
    })

    const shareSongWithBand = new NodejsFunction(this, `${props.name}-ShareSongWithBand`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'song', 'shareSongWithBand.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}ShareSongWithBandDS`, shareSongWithBand)
    .createResolver(`${props.name}-ShareSongWithBandResolver`, {
      typeName: "Mutation",
      fieldName: "shareSongWithBand"
    })

    const getBand = new NodejsFunction(this, `${props.name}-GetBand`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'band', 'getBand.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}GetBandDS`, getBand)
    .createResolver(`${props.name}-GetBandResolver`, {
      typeName: "Query",
      fieldName: "getBand"
    })

    const createBand = new NodejsFunction(this, `${props.name}-CreateBand`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'band', 'createBand.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}CreateBandDS`, createBand)
    .createResolver(`${props.name}-CreateBandResolver`, {
      typeName: "Mutation",
      fieldName: "createBand"
    })

    const updateBand = new NodejsFunction(this, `${props.name}-UpdateBand`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'band', 'updateBand.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}UpdateBandDS`, updateBand)
    .createResolver(`${props.name}-UpdateBandResolver`, {
      typeName: "Mutation",
      fieldName: "updateBand"
    })

    const listBands = new NodejsFunction(this, `${props.name}-ListBands`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'band', 'listBands.ts'),
      timeout: Duration.minutes(5),
      memorySize: listMemory,
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}ListBandsDS`, listBands)
    .createResolver(`${props.name}-ListBandsResolver`, {
      typeName: "Query",
      fieldName: "listBands"
    })

    const listSharedBands = new NodejsFunction(this, `${props.name}-ListSharedBands`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'band', 'listSharedBands.ts'),
      timeout: Duration.minutes(5),
      memorySize: listMemory,
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}ListSharedBandsDS`, listSharedBands)
    .createResolver(`${props.name}-ListSharedBandsResolver`, {
      typeName: "Query",
      fieldName: "listSharedBands"
    })

    const listPublicBands = new NodejsFunction(this, `${props.name}-ListPublicBands`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'band', 'listPublicBands.ts'),
      timeout: Duration.minutes(5),
      memorySize: listMemory,
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}ListPublicBandsDS`, listPublicBands)
    .createResolver(`${props.name}-ListPublicBandsResolver`, {
      typeName: "Query",
      fieldName: "listPublicBands"
    })

    const createSet = new NodejsFunction(this, `${props.name}-CreateSet`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'setList', 'createSet.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}CreateSetDS`, createSet)
    .createResolver(`${props.name}-CreateSetResolver`, {
      typeName: "Mutation",
      fieldName: "createSet"
    })

    const updateSet = new NodejsFunction(this, `${props.name}-UpdateSet`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'setList', 'updateSet.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}UpdateSetDS`, updateSet)
    .createResolver(`${props.name}-UpdateSetResolver`, {
      typeName: "Mutation",
      fieldName: "updateSet"
    })

    const getSet = new NodejsFunction(this, `${props.name}-GetSet`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'setList', 'getSet.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}GetSetDS`, getSet)
    .createResolver(`${props.name}-GetSetResolver`, {
      typeName: "Query",
      fieldName: "getSet"
    })

    const getSetCount = new NodejsFunction(this, `${props.name}-GetSetCount`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'setList', 'getSetCount.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}GetSetCountDS`, getSetCount)
    .createResolver(`${props.name}-GetSetCountResolver`, {
      typeName: "Query",
      fieldName: "getSetCount"
    })

    const listSet = new NodejsFunction(this, `${props.name}-ListSet`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'setList', 'listSets.ts'),
      timeout: Duration.minutes(5),
      memorySize: listMemory,
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}ListSetDS`, listSet)
    .createResolver(`${props.name}-ListSetResolver`, {
      typeName: "Query",
      fieldName: "listSets"
    })

    const addSongToSet = new NodejsFunction(this, `${props.name}-AddSongToSet`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'setList', 'addSongToSet.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}AddSongToSetDS`, addSongToSet)
    .createResolver(`${props.name}-AddSongToSetResolver`, {
      typeName: "Mutation",
      fieldName: "addSongToSet"
    })

    const getJamSession = new NodejsFunction(this, `${props.name}-GetJamSession`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'jam', 'getJamSession.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}GetJamSessionDS`, getJamSession)
    .createResolver(`${props.name}-GetJamSessionResolver`, {
      typeName: "Query",
      fieldName: "getJamSession"
    })

    const createJamSession = new NodejsFunction(this, `${props.name}-CreateJamSession`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'jam', 'createJamSession.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}CreateJamSessionDS`, createJamSession)
    .createResolver(`${props.name}-CreateJamSessionResolver`, {
      typeName: "Mutation",
      fieldName: "createJamSession"
    })

    const getUserJamSessions = new NodejsFunction(this, `${props.name}-GetUserJamSessions`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'jam', 'getUserJamSessions.ts'),
      timeout: Duration.minutes(5),
      memorySize: listMemory,
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}GetUserJamSessionsDS`, getUserJamSessions)
    .createResolver(`${props.name}-GetUserJamSessionsResolver`, {
      typeName: "Query",
      fieldName: "getUserJamSessions"
    })

    const updateJamSessionDescription = new NodejsFunction(this, `${props.name}-UpdateJamSessionDescription`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'jam', 'updateJamSessionDescription.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}UpdateJamSessionDescriptionDS`, updateJamSessionDescription)
    .createResolver(`${props.name}-UpdateJamSessionDescriptionResolver`, {
      typeName: "Mutation",
      fieldName: "updateJamSessionDescription"
    })

    const setJamQueue = new NodejsFunction(this, `${props.name}-SetJamQueue`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'jam', 'setJamQueue.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}SetJamQueueDS`, setJamQueue)
    .createResolver(`${props.name}-SetJamQueueResolver`, {
      typeName: "Mutation",
      fieldName: "setJamQueue"
    })

    const listPublicJamSessions = new NodejsFunction(this, `${props.name}-ListPublicJamSessions`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'jam', 'listPublicJamSessions.ts'),
      timeout: Duration.minutes(5),
      memorySize: listMemory,
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}ListPublicJamSessionsDS`, listPublicJamSessions)
    .createResolver(`${props.name}-ListPublicJamSessionsResolver`, {
      typeName: "Query",
      fieldName: "listPublicJamSessions"
    })

    const enterJam = new NodejsFunction(this, `${props.name}-EnterJam`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'jam', 'enterJam.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}EnterJamDS`, enterJam)
    .createResolver(`${props.name}-EnterJamResolver`, {
      typeName: "Mutation",
      fieldName: "enterJam"
    })

    const exitJam = new NodejsFunction(this, `${props.name}-ExitJam`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'jam', 'exitJam.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}ExitJamDS`, exitJam)
    .createResolver(`${props.name}-ExitJamResolver`, {
      typeName: "Mutation",
      fieldName: "exitJam"
    })

    const nextPage = new NodejsFunction(this, `${props.name}-NextPage`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'jam', 'nextPage.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}NextPageDS`, nextPage)
    .createResolver(`${props.name}-NextPageResolver`, {
      typeName: "Mutation",
      fieldName: "nextPage"
    })

    const nextSong = new NodejsFunction(this, `${props.name}-NextSong`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'jam', 'nextSong.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}NextSongDS`, nextSong)
    .createResolver(`${props.name}-NextSongResolver`, {
      typeName: "Mutation",
      fieldName: "nextSong"
    })

    const setSongKey = new NodejsFunction(this, `${props.name}-SetSongKey`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'jam', 'setSongKey.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}SetSongKeyDS`, setSongKey)
    .createResolver(`${props.name}-SetSongKeyResolver`, {
      typeName: "Mutation",
      fieldName: "setSongKey"
    })

    const addSongToJamQueue = new NodejsFunction(this, `${props.name}-AddSongToJamQueue`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'jam', 'addSongToJamQueue.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}AddSongToJamQueueDS`, addSongToJamQueue)
    .createResolver(`${props.name}-AddSongToJamQueueResolver`, {
      typeName: "Mutation",
      fieldName: "addSongToJamQueue"
    })

    const removeSongFromJamQueue = new NodejsFunction(this, `${props.name}-RemoveSongFromJamQueue`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'jam', 'removeSongFromJamQueue.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}RemoveSongFromJamQueueDS`, removeSongFromJamQueue)
    .createResolver(`${props.name}-RemoveSongFromJamQueueResolver`, {
      typeName: "Mutation",
      fieldName: "removeSongFromJamQueue"
    })

    const setJamSlideConfig = new NodejsFunction(this, `${props.name}-SetJamSlideConfig`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'jam', 'setJamSlideConfig.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}SetJamSlideConfigDS`, setJamSlideConfig)
    .createResolver(`${props.name}-SetJamSlideConfigResolver`, {
      typeName: "Mutation",
      fieldName: "setJamSlideConfig"
    })

    const listUserJamSessions = new NodejsFunction(this, `${props.name}-ListUserJamSessions`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'jam', 'listUserJamSessions.ts'),
      timeout: Duration.minutes(5),
      memorySize: listMemory,
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}ListUserJamSessionsDS`, listUserJamSessions)
    .createResolver(`${props.name}-ListUserJamSessionsResolver`, {
      typeName: "Query",
      fieldName: "listUserJamSessions"
    })

    const countJamsForSet = new NodejsFunction(this, `${props.name}-CountJamsForSet`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'setList', 'countJamsForSet.ts'),
      timeout: Duration.minutes(5),
      memorySize: listMemory,
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}CountJamsForSetDS`, countJamsForSet)
    .createResolver(`${props.name}-CountJamsForSetResolver`, {
      typeName: "Query",
      fieldName: "countJamsForSet"
    })

    const deleteSet = new NodejsFunction(this, `${props.name}-DeleteSet`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'setList', 'deleteSet.ts'),
      timeout: Duration.minutes(5),
      memorySize: listMemory,
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}DeleteSetDS`, deleteSet)
    .createResolver(`${props.name}-DeleteSetResolver`, {
      typeName: "Mutation",
      fieldName: "deleteSet"
    })

    const searchSongs = new NodejsFunction(this, `${props.name}-SearchSongs`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'song', 'searchSongs.ts'),
      timeout: Duration.minutes(5),
      memorySize: listMemory,
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}SearchSongsDS`, searchSongs)
    .createResolver(`${props.name}-SearchSongsResolver`, {
      typeName: "Query",
      fieldName: "searchSongs"
    })

    const searchSpotifyTracks = new NodejsFunction(this, `${props.name}-SearchSpotifyTracks`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'spotify', 'searchSpotifyTracks.ts'),
      timeout: Duration.seconds(30),
      memorySize: 256,
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}SearchSpotifyTracksDS`, searchSpotifyTracks)
    .createResolver(`${props.name}-SearchSpotifyTracksResolver`, {
      typeName: "Query",
      fieldName: "searchSpotifyTracks"
    })

    const setLiveJamChordSheet = new NodejsFunction(this, `${props.name}-SetLiveJamChordSheet`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'jam', 'setLiveJamChordSheet.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}SetLiveJamChordSheetDS`, setLiveJamChordSheet)
    .createResolver(`${props.name}-SetLiveJamChordSheetResolver`, {
      typeName: "Mutation",
      fieldName: "setLiveJamChordSheet"
    })

    const createChordImport = new NodejsFunction(this, `${props.name}-CreateChordImport`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'import', 'createChordImport.ts'),
      timeout: Duration.seconds(30),
      ...nodeJsFunctionProps
    })
    appsync.addLambdaDataSource(`${props.name}CreateChordImportDS`, createChordImport)
    .createResolver(`${props.name}-CreateChordImportResolver`, {
      typeName: "Mutation",
      fieldName: "createChordImport"
    })

    const listPendingImports = new NodejsFunction(this, `${props.name}-ListPendingImports`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'import', 'listPendingImports.ts'),
      timeout: Duration.seconds(30),
      memorySize: listMemory,
      ...nodeJsFunctionProps
    })
    appsync.addLambdaDataSource(`${props.name}ListPendingImportsDS`, listPendingImports)
    .createResolver(`${props.name}-ListPendingImportsResolver`, {
      typeName: "Query",
      fieldName: "listPendingImports"
    })

    const claimImport = new NodejsFunction(this, `${props.name}-ClaimImport`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'import', 'claimImport.ts'),
      timeout: Duration.seconds(30),
      ...nodeJsFunctionProps
    })
    appsync.addLambdaDataSource(`${props.name}ClaimImportDS`, claimImport)
    .createResolver(`${props.name}-ClaimImportResolver`, {
      typeName: "Mutation",
      fieldName: "claimImport"
    })

    const releaseImport = new NodejsFunction(this, `${props.name}-ReleaseImport`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'import', 'releaseImport.ts'),
      timeout: Duration.seconds(30),
      ...nodeJsFunctionProps
    })
    appsync.addLambdaDataSource(`${props.name}ReleaseImportDS`, releaseImport)
    .createResolver(`${props.name}-ReleaseImportResolver`, {
      typeName: "Mutation",
      fieldName: "releaseImport"
    })

    const completeImport = new NodejsFunction(this, `${props.name}-CompleteImport`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'import', 'completeImport.ts'),
      timeout: Duration.minutes(1),
      ...nodeJsFunctionProps
    })
    appsync.addLambdaDataSource(`${props.name}CompleteImportDS`, completeImport)
    .createResolver(`${props.name}-CompleteImportResolver`, {
      typeName: "Mutation",
      fieldName: "completeImport"
    })

    const failImport = new NodejsFunction(this, `${props.name}-FailImport`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'import', 'failImport.ts'),
      timeout: Duration.seconds(30),
      ...nodeJsFunctionProps
    })
    appsync.addLambdaDataSource(`${props.name}FailImportDS`, failImport)
    .createResolver(`${props.name}-FailImportResolver`, {
      typeName: "Mutation",
      fieldName: "failImport"
    })

    const getSongUsage = new NodejsFunction(this, `${props.name}-GetSongUsage`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'song', 'getSongUsage.ts'),
      timeout: Duration.minutes(1),
      memorySize: listMemory,
      ...nodeJsFunctionProps
    })
    appsync.addLambdaDataSource(`${props.name}GetSongUsageDS`, getSongUsage)
    .createResolver(`${props.name}-GetSongUsageResolver`, {
      typeName: "Query",
      fieldName: "getSongUsage"
    })

    const deleteSong = new NodejsFunction(this, `${props.name}-DeleteSong`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'song', 'deleteSong.ts'),
      timeout: Duration.minutes(2),
      memorySize: listMemory,
      ...nodeJsFunctionProps
    })
    appsync.addLambdaDataSource(`${props.name}DeleteSongDS`, deleteSong)
    .createResolver(`${props.name}-DeleteSongResolver`, {
      typeName: "Mutation",
      fieldName: "deleteSong"
    })

    const removeSongFromJam = new NodejsFunction(this, `${props.name}-RemoveSongFromJam`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'jam', 'removeSongFromJam.ts'),
      timeout: Duration.seconds(30),
      ...nodeJsFunctionProps
    })
    appsync.addLambdaDataSource(`${props.name}RemoveSongFromJamDS`, removeSongFromJam)
    .createResolver(`${props.name}-RemoveSongFromJamResolver`, {
      typeName: "Mutation",
      fieldName: "removeSongFromJam"
    })

    const addSongToLiveJam = new NodejsFunction(this, `${props.name}-AddSongToLiveJam`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'jam', 'addSongToLiveJam.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}AddSongToLiveJamDS`, addSongToLiveJam)
    .createResolver(`${props.name}-AddSongToLiveJamResolver`, {
      typeName: "Mutation",
      fieldName: "addSongToLiveJam"
    })

    const deleteJamSession = new NodejsFunction(this, `${props.name}-DeleteJamSession`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'jam', 'deleteJamSession.ts'),
      timeout: Duration.minutes(2),
      memorySize: listMemory,
      ...nodeJsFunctionProps
    })
    appsync.addLambdaDataSource(`${props.name}DeleteJamSessionDS`, deleteJamSession)
    .createResolver(`${props.name}-DeleteJamSessionResolver`, {
      typeName: "Mutation",
      fieldName: "deleteJamSession"
    })

    const ensureJamJoinToken = new NodejsFunction(this, `${props.name}-EnsureJamJoinToken`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'jam', 'ensureJamJoinToken.ts'),
      timeout: Duration.seconds(15),
      ...nodeJsFunctionProps
    })
    appsync.addLambdaDataSource(`${props.name}EnsureJamJoinTokenDS`, ensureJamJoinToken)
    .createResolver(`${props.name}-EnsureJamJoinTokenResolver`, {
      typeName: "Mutation",
      fieldName: "ensureJamJoinToken"
    })

    const createRecording = new NodejsFunction(this, `${props.name}-CreateRecording`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'recording', 'createRecording.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}CreateRecordingDS`, createRecording)
    .createResolver(`${props.name}-CreateRecordingResolver`, {
      typeName: "Mutation",
      fieldName: "createRecording"
    })

    // The function, its ECS permissions, and the Fargate service live in ImporterStack.
    // sameEnvironment lets AppSync's invoke permission be added in this stack only,
    // so ImporterStack does not take a reference back to this API.
    const importerControl = Function.fromFunctionAttributes(this, `${props.name}-ImporterControlFn`, {
      functionArn: Fn.importValue(IMPORTER_CONTROL_EXPORT),
      sameEnvironment: true,
    })
    appsync.addLambdaDataSource(`${props.name}ImporterStatusDS`, importerControl)
    .createResolver(`${props.name}-ImporterStatusResolver`, {
      typeName: "Query",
      fieldName: "importerStatus"
    })
    appsync.addLambdaDataSource(`${props.name}SetImporterRunningDS`, importerControl)
    .createResolver(`${props.name}-SetImporterRunningResolver`, {
      typeName: "Mutation",
      fieldName: "setImporterRunning"
    })
    new CfnPermission(this, `${props.name}-ImporterControlInvoke`, {
      action: 'lambda:InvokeFunction',
      functionName: Fn.importValue(IMPORTER_CONTROL_EXPORT),
      principal: 'appsync.amazonaws.com',
      sourceArn: appsync.resources.graphqlApi.arn,
    })
  }
}