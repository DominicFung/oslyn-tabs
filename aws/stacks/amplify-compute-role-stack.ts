import { App, CfnOutput, Fn, Stack } from 'aws-cdk-lib'
import { Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam'

interface AmplifyComputeRoleProps {
  name: string
}

const AMPLIFY_ACCOUNT = '006033392195'
const AMPLIFY_APP_ID = 'd1g4kmtrf03nry'
const AMPLIFY_REGION = 'us-east-1'

/**
 * SSR compute role for the existing Amplify Hosting app (not created by CDK).
 * Deploy this stack, then attach the output ARN with `aws amplify update-app`.
 * This stack does not call update-app.
 */
export class AmplifyComputeRoleStack extends Stack {
  constructor(app: App, id: string, props: AmplifyComputeRoleProps) {
    super(app, id)

    const bucketName = Fn.importValue(`${props.name}-bucketName`)
    const followRecordings = Fn.join('', [
      'arn:aws:s3:::',
      bucketName,
      '/follow-recordings/*',
    ])

    const role = new Role(this, 'Role', {
      assumedBy: new ServicePrincipal('amplify.amazonaws.com', {
        conditions: {
          StringEquals: { 'aws:SourceAccount': AMPLIFY_ACCOUNT },
          ArnLike: {
            'aws:SourceArn': `arn:aws:amplify:${AMPLIFY_REGION}:${AMPLIFY_ACCOUNT}:apps/${AMPLIFY_APP_ID}*`,
          },
        },
      }),
      description: 'Amplify SSR compute role. PutObject on follow-recordings only.',
      inlinePolicies: {
        FollowRecordingsPut: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ['s3:PutObject'],
              resources: [followRecordings],
            }),
          ],
        }),
      },
    })

    new CfnOutput(this, 'ComputeRoleArn', {
      value: role.roleArn,
      exportName: `${props.name}-AmplifyComputeRoleArn`,
      description: 'Pass this ARN to aws amplify update-app --compute-role-arn. This stack does not attach it.',
    })
  }
}
