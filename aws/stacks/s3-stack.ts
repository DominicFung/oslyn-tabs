import { App, CfnOutput, Stack, RemovalPolicy } from 'aws-cdk-lib'
import { BlockPublicAccess, Bucket, HttpMethods, ObjectOwnership } from 'aws-cdk-lib/aws-s3'

interface S3Props {
  name: string
}

export class S3Stack extends Stack {
  constructor(app: App, id: string, props: S3Props) {
    super(app, id)
    console.log(props)

    const s3 = new Bucket(this, `${props.name}-Bucket`, {
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false
      } as BlockPublicAccess,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      objectOwnership: ObjectOwnership.OBJECT_WRITER,
      cors: [{
          allowedMethods: [HttpMethods.GET, HttpMethods.POST, HttpMethods.PUT,],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        }],
      // https://stackoverflow.com/questions/76097031/aws-s3-bucket-cannot-have-acls-set-with-objectownerships-bucketownerenforced-s
      // accessControl: BucketAccessControl.PUBLIC_READ,
      publicReadAccess: true
    })

    new CfnOutput(this, 'bucketName', {
      value: s3.bucketName,
      exportName: `${props.name}-bucketName`
    })

    new CfnOutput(this, 'bucketArn', {
      value: s3.bucketArn,
      exportName: `${props.name}-bucketArn`
    })
  }
}