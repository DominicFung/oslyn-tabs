import { App, CfnOutput, Stack, Fn } from 'aws-cdk-lib'
import { AccessKey, Policy, PolicyStatement, User } from 'aws-cdk-lib/aws-iam'

interface IamProps {
  name: string
}

export class IamStack extends Stack {
  constructor(app: App, id: string, props: IamProps) {
    super(app, id)

    // const userDynamoArn = Fn.importValue(`${props.name}-UserTable-Arn`)
    // const songDynamoArn = Fn.importValue(`${props.name}-SongTable-Arn`)
    // const bandDynamoArn = Fn.importValue(`${props.name}-BandTable-Arn`)
    // const setListDynamoArn = Fn.importValue(`${props.name}-SetListTable-Arn`)
    // const jamDynamoArn = Fn.importValue(`${props.name}-JamTable-Arn`)
    // const inviteDynamoArn = Fn.importValue(`${props.name}-InviteTable-Arn`)
    
    const bucketArn = Fn.importValue(`${props.name}-bucketArn`)

    const user = new User(this, `${props.name}-User`)
    user.attachInlinePolicy(new Policy(this, `${props.name}-InlinePolicy`, {
      statements: [
        // new PolicyStatement({
        //   actions: [ "dynamodb:*" ],
        //   resources: [ 
        //     `${userDynamoArn}*`, `${bandDynamoArn}*`, `${songDynamoArn}*`, 
        //     `${setListDynamoArn}*`, `${jamDynamoArn}*`, `${inviteDynamoArn}*`
        //   ]
        // }),
        new PolicyStatement({
          resources: [ bucketArn, `${bucketArn}/*` ],
          actions: ["s3:*"]
        }),
      ]
    }))

    const accessKey = new AccessKey(this, `${props.name}-AccessKey`, { user })
    
    new CfnOutput(this, 'AccessKey', {
      value: accessKey.accessKeyId,
      exportName: "AccessKey"
    })

    new CfnOutput(this, 'SecretKey', {
      value: accessKey.secretAccessKey.unsafeUnwrap(),
      exportName: "SecretKey"
    })
  }
}