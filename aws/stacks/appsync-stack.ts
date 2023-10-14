import { App, CfnOutput, Duration, Expiration, Fn, Stack } from 'aws-cdk-lib'
import { GraphqlApi, SchemaFile, AuthorizationType, FieldLogLevel } from 'aws-cdk-lib/aws-appsync'
import { ManagedPolicy, Policy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { Runtime } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs'
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

    const setListDynamoName = Fn.importValue(`${props.name}-SetListTable-Name`)
    const setListDynamoArn = Fn.importValue(`${props.name}-SetListTable-Arn`)

    const jamDynamoName = Fn.importValue(`${props.name}-JamTable-Name`)
    const jamDynamoArn = Fn.importValue(`${props.name}-JamTable-Arn`)

    const inviteDynamoName = Fn.importValue(`${props.name}-InviteTable-Name`)
    const inviteDynamoArn = Fn.importValue(`${props.name}-InviteTable-Arn`)

    const appsync = new GraphqlApi(this, `${props.name}-Appsync`, {
      name: `${props.name}`,
      schema: SchemaFile.fromAsset(path.join(__dirname, "../", 'schema.graphql')),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: Expiration.after(Duration.days(365))
          }
        },
      },
      xrayEnabled: true,
      logConfig: { excludeVerboseContent: true, fieldLogLevel: FieldLogLevel.ALL }, // remove later
    })

    new CfnOutput(this, "GraphQLAPIURL", { value: appsync.graphqlUrl })
    new CfnOutput(this, "GraphQLAPIKey", { value: appsync.apiKey || '' })
    new CfnOutput(this, "Stack Region", { value: this.region })
    new CfnOutput(this, `${props.name}-AppsyncId`, { value: appsync.apiId })

    new CfnOutput(this, `${props.name}-AppsyncArn`, {
      value: appsync.arn,
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
            actions: [ "dynamodb:*" ],
            resources: [ 
              `${userDynamoArn}*`, `${bandDynamoArn}*`, `${songDynamoArn}*`, 
              `${setListDynamoArn}*`, `${jamDynamoArn}*`, `${inviteDynamoArn}*`
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
      bundling: { externalModules: ['aws-sdk'] },
      depsLockFilePath: join(__dirname, '../lambdas', 'package-lock.json'),
      environment: { 
        USER_TABLE_NAME: userDynamoName,
        BAND_TABLE_NAME: bandDynamoName,
        SONG_TABLE_NAME: songDynamoName,
        SETLIST_TABLE_NAME: setListDynamoName,
        JAM_TABLE_NAME: jamDynamoName,
        INVITE_TABLE_NAME: inviteDynamoName
      },
      runtime: Runtime.NODEJS_16_X,
    }

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
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}ListBandsDS`, listBands)
    .createResolver(`${props.name}-ListBandsResolver`, {
      typeName: "Query",
      fieldName: "listBands"
    })

    const listPublicBands = new NodejsFunction(this, `${props.name}-ListPublicBands`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'band', 'listPublicBands.ts'),
      timeout: Duration.minutes(5),
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

    const listPublicJamSessions = new NodejsFunction(this, `${props.name}-ListPublicJamSessions`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'jam', 'listPublicJamSessions.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}ListPublicJamSessionsDS`, listPublicJamSessions)
    .createResolver(`${props.name}-ListPublicJamSessionsResolver`, {
      typeName: "Query",
      fieldName: "listPublicJamSessions"
    })

    const signInToJamSession = new NodejsFunction(this, `${props.name}-SignInToJamSession`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'jam', 'signInToJamSession.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}SignInToJamSessionDS`, signInToJamSession)
    .createResolver(`${props.name}-SignInToJamSessionResolver`, {
      typeName: "Mutation",
      fieldName: "signInToJamSession"
    })

    const signOutFromJamSession = new NodejsFunction(this, `${props.name}-SignOutFromJamSession`, {
      entry: join(__dirname, '../lambdas', 'appsync', 'jam', 'signOutFromJamSession.ts'),
      timeout: Duration.minutes(5),
      ...nodeJsFunctionProps
    })

    appsync.addLambdaDataSource(`${props.name}SignOutFromJamSessionDS`, signOutFromJamSession)
    .createResolver(`${props.name}-SignOutFromJamSessionResolver`, {
      typeName: "Mutation",
      fieldName: "signOutFromJamSession"
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
  }
}