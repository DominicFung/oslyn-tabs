import { App } from 'aws-cdk-lib'

import { S3Stack } from './stacks/s3-stack'
import { DynamoStack } from './stacks/dynamo-stack'
import { AppsyncStack } from './stacks/appsync-stack'
import { IamStack } from './stacks/iam-stack'

const PROJECT_NAME = 'oslynstudio'

const app = new App()

const s3Stack = new S3Stack(app, `${PROJECT_NAME}-S3Stack`, { name: PROJECT_NAME })
const dynamoStack = new DynamoStack(app, `${PROJECT_NAME}-DynamoStack`, { name: PROJECT_NAME })

const appsyncStack = new AppsyncStack(app, `${PROJECT_NAME}-AppsyncStack`, { name: PROJECT_NAME })
appsyncStack.addDependency(dynamoStack)

const iamStack = new IamStack(app, `${PROJECT_NAME}-IamStack`, { name: PROJECT_NAME})
iamStack.addDependency(s3Stack)

app.synth()