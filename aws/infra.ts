import { App } from 'aws-cdk-lib'

import { S3Stack } from './stacks/s3-stack'
import { DynamoStack } from './stacks/dynamo-stack'
import { AppsyncStack } from './stacks/appsync-stack'

const PROJECT_NAME = 'oslynstudio'

const app = new App()

new S3Stack(app, `${PROJECT_NAME}-S3Stack`, { name: PROJECT_NAME })
const dynamoStack = new DynamoStack(app, `${PROJECT_NAME}-DynamoStack`, { name: PROJECT_NAME })

const appsyncStack = new AppsyncStack(app, `${PROJECT_NAME}-AppsyncStack`, { name: PROJECT_NAME })
appsyncStack.addDependency(dynamoStack)

app.synth()