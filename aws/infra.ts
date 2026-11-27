import { App } from 'aws-cdk-lib'

import { S3Stack } from './stacks/s3-stack'
import { DynamoStack } from './stacks/dynamo-stack'
import { AppsyncStack } from './stacks/appsync-stack'
import { IamStack } from './stacks/iam-stack'
import { ImporterStack } from './stacks/importer-stack'
import { AmplifyComputeRoleStack } from './stacks/amplify-compute-role-stack'

const PROJECT_NAME = 'oslynstudio'

const app = new App()


// 9e7724c6-fbda-4a0c-874d-3841ae0848c1
const s3Stack = new S3Stack(app, `${PROJECT_NAME}-S3Stack`, { name: PROJECT_NAME })
const dynamoStack = new DynamoStack(app, `${PROJECT_NAME}-DynamoStack`, { name: PROJECT_NAME })

const importerStack = new ImporterStack(app, `${PROJECT_NAME}-ImporterStack`, { name: PROJECT_NAME })

const appsyncStack = new AppsyncStack(app, `${PROJECT_NAME}-AppsyncStack`, { name: PROJECT_NAME })
appsyncStack.addDependency(dynamoStack)
appsyncStack.addDependency(importerStack)

const iamStack = new IamStack(app, `${PROJECT_NAME}-IamStack`, { name: PROJECT_NAME})
iamStack.addDependency(s3Stack)

const amplifyComputeRoleStack = new AmplifyComputeRoleStack(app, `${PROJECT_NAME}-AmplifyComputeRoleStack`, { name: PROJECT_NAME })
amplifyComputeRoleStack.addDependency(s3Stack)

app.synth()