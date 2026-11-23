import { App, CfnOutput, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib'
import { Platform } from 'aws-cdk-lib/aws-ecr-assets'
import * as cr from 'aws-cdk-lib/custom-resources'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import { join } from 'path'
import {
  IMPORTER_API_KEY_PARAMETER,
  IMPORTER_CLUSTER_NAME,
  IMPORTER_CONTROL_EXPORT,
  IMPORTER_ENDPOINT_PARAMETER,
  IMPORTER_SECRET_ID,
  IMPORTER_SERVICE_NAME,
} from '../importerNames'

interface ImporterProps {
  name: string
}

/**
 * One Fargate Spot task for the Ultimate Guitar import worker.
 * Public subnets and a public IP, no NAT gateway. desiredCount starts at 0.
 * 0.25 vCPU and 1 GB: Chromium does not fit in 512 MB. About $0.01/hr on demand
 * while a task is running, less on Spot, and $0 while the service is off.
 */
export class ImporterStack extends Stack {
  constructor(app: App, id: string, props: ImporterProps) {
    super(app, id)

    const endpointParam = this.ensureParameter('EndpointParameter', IMPORTER_ENDPOINT_PARAMETER, 'String',
      'AppSync GraphQL URL for the UG import worker. Replace REPLACE_ME before turning the importer on.')
    const apiKeyParam = this.ensureParameter('ApiKeyParameter', IMPORTER_API_KEY_PARAMETER, 'SecureString',
      'AppSync API key for the UG import worker. Replace REPLACE_ME before turning the importer on. Do not commit the key.')

    const vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: `${props.name}-importer`,
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        { name: 'public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
      ],
    })

    const cluster = new ecs.Cluster(this, 'Cluster', {
      clusterName: IMPORTER_CLUSTER_NAME,
      vpc,
      enableFargateCapacityProviders: true,
      containerInsights: false,
    })

    const logGroup = new logs.LogGroup(this, 'Logs', {
      logGroupName: '/oslynstudio/ug-import',
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const executionRole = new iam.Role(this, 'ExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    })
    // Do not import these with StringParameter.fromStringParameterName.
    // That adds a template parameter of type AWS::SSM::Parameter::Value<String>,
    // and CloudFormation resolves it before the custom resource can create it.
    const endpointSecret = this.ssmParameterSecret(IMPORTER_ENDPOINT_PARAMETER)
    const apiKeySecret = this.ssmParameterSecret(IMPORTER_API_KEY_PARAMETER)
    endpointSecret.grantRead(executionRole)
    apiKeySecret.grantRead(executionRole)
    executionRole.addToPolicy(new iam.PolicyStatement({
      sid: 'DecryptImporterParameters',
      actions: ['kms:Decrypt'],
      resources: ['*'],
      conditions: { StringEquals: { 'kms:ViaService': `ssm.${this.region}.amazonaws.com` } },
    }))

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      family: IMPORTER_SERVICE_NAME,
      cpu: 256,
      memoryLimitMiB: 1024,
      executionRole,
      taskRole: new iam.Role(this, 'TaskRole', {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      }),
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.X86_64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    })

    taskDefinition.addContainer('worker', {
      containerName: 'ug-import',
      image: ecs.ContainerImage.fromAsset(join(__dirname, '../../worker/ug-import'), {
        platform: Platform.LINUX_AMD64,
      }),
      logging: ecs.LogDrivers.awsLogs({ logGroup, streamPrefix: 'ug-import' }),
      secrets: {
        APPSYNC_ENDPOINT: endpointSecret,
        APPSYNC_API_KEY: apiKeySecret,
      },
      stopTimeout: Duration.seconds(120),
      essential: true,
    })

    const tasks = new ec2.SecurityGroup(this, 'TaskSecurityGroup', {
      vpc,
      description: 'UG import worker. No inbound. Outbound to AppSync and Ultimate Guitar.',
      allowAllOutbound: true,
    })

    const service = new ecs.FargateService(this, 'Service', {
      cluster,
      serviceName: IMPORTER_SERVICE_NAME,
      taskDefinition,
      desiredCount: 0,
      assignPublicIp: true,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroups: [tasks],
      platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
      circuitBreaker: { rollback: true },
      minHealthyPercent: 0,
      maxHealthyPercent: 100,
      capacityProviderStrategies: [
        { capacityProvider: 'FARGATE_SPOT', base: 1, weight: 1 },
      ],
    })
    service.node.addDependency(endpointParam)
    service.node.addDependency(apiKeyParam)

    const clusterArn = `arn:aws:ecs:${this.region}:${this.account}:cluster/${IMPORTER_CLUSTER_NAME}`
    const serviceArn = `arn:aws:ecs:${this.region}:${this.account}:service/${IMPORTER_CLUSTER_NAME}/${IMPORTER_SERVICE_NAME}`
    const controlRole = new iam.Role(this, 'ControlRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    })
    controlRole.addToPolicy(new iam.PolicyStatement({
      sid: 'DescribeImporterService',
      actions: ['ecs:DescribeServices'],
      resources: [clusterArn, serviceArn],
    }))
    controlRole.addToPolicy(new iam.PolicyStatement({
      sid: 'ScaleImporterService',
      actions: ['ecs:UpdateService'],
      resources: [serviceArn],
    }))
    controlRole.addToPolicy(new iam.PolicyStatement({
      sid: 'ListImporterTasks',
      actions: ['ecs:ListTasks'],
      resources: [
        clusterArn,
        `arn:aws:ecs:${this.region}:${this.account}:container-instance/${IMPORTER_CLUSTER_NAME}/*`,
      ],
    }))
    controlRole.addToPolicy(new iam.PolicyStatement({
      sid: 'DescribeImporterTasks',
      actions: ['ecs:DescribeTasks'],
      resources: [`arn:aws:ecs:${this.region}:${this.account}:task/${IMPORTER_CLUSTER_NAME}/*`],
    }))
    controlRole.addToPolicy(new iam.PolicyStatement({
      sid: 'ReadImporterAuthSecret',
      actions: ['secretsmanager:GetSecretValue'],
      resources: [`arn:aws:secretsmanager:${this.region}:${this.account}:secret:${IMPORTER_SECRET_ID}-*`],
    }))

    const controlLogs = new logs.LogGroup(this, 'ControlLogs', {
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: RemovalPolicy.DESTROY,
    })
    const controlFn = new NodejsFunction(this, 'Control', {
      functionName: `${props.name}-ImporterControl`,
      entry: join(__dirname, '../lambdas/appsync/import/importerControl.ts'),
      handler: 'handler',
      role: controlRole,
      logGroup: controlLogs,
      timeout: Duration.seconds(20),
      memorySize: 256,
      runtime: new lambda.Runtime('nodejs22.x', lambda.RuntimeFamily.NODEJS, { supportsInlineCode: true }),
      projectRoot: join(__dirname, '../lambdas'),
      depsLockFilePath: join(__dirname, '../lambdas/package-lock.json'),
      bundling: {
        externalModules: [],
        esbuildArgs: { '--packages': 'bundle' },
      },
      environment: {
        IMPORTER_CLUSTER_NAME,
        IMPORTER_SERVICE_NAME,
        IMPORTER_SECRET_ID,
      },
    })

    new CfnOutput(this, 'ControlFunctionArn', {
      value: controlFn.functionArn,
      exportName: IMPORTER_CONTROL_EXPORT,
    })
    new CfnOutput(this, 'ClusterName', { value: cluster.clusterName })
    new CfnOutput(this, 'ServiceName', { value: service.serviceName })
    new CfnOutput(this, 'LogGroupName', { value: logGroup.logGroupName })
    new CfnOutput(this, 'AppsyncEndpointParameter', { value: IMPORTER_ENDPOINT_PARAMETER })
    new CfnOutput(this, 'AppsyncApiKeyParameter', { value: IMPORTER_API_KEY_PARAMETER })
  }

  /**
   * ECS secret by ARN only. StringParameter.fromStringParameterName would add
   * AWS::SSM::Parameter::Value<String>, which CloudFormation resolves before
   * ensureParameter runs. The task definition stores the ARN; ECS reads the
   * value when a task starts.
   */
  private ssmParameterSecret(name: string): ecs.Secret {
    const parameterArn = this.formatArn({
      service: 'ssm',
      resource: `parameter${name}`,
    })
    const parameter = {
      parameterArn,
      grantRead: (grantee: iam.IGrantable) => iam.Grant.addToPrincipal({
        grantee,
        actions: ['ssm:DescribeParameters', 'ssm:GetParameters', 'ssm:GetParameter', 'ssm:GetParameterHistory'],
        resourceArns: [parameterArn],
      }),
    }
    return ecs.Secret.fromSsmParameter(parameter as ssm.IParameter)
  }

  /**
   * Creates the parameter once. Later deploys describe it and do not write the value,
   * so replacing REPLACE_ME in the console is not undone by the next stack update.
   * The placeholder is not a real credential. The physical id is the parameter name;
   * changing it would delete the parameter on the next deploy.
   */
  private ensureParameter(id: string, name: string, type: 'String' | 'SecureString', description: string) {
    const parameterArn = `arn:aws:ssm:${this.region}:${this.account}:parameter${name}`
    return new cr.AwsCustomResource(this, id, {
      installLatestAwsSdk: false,
      logRetention: logs.RetentionDays.TWO_WEEKS,
      onCreate: {
        service: 'SSM',
        action: 'putParameter',
        parameters: {
          Name: name,
          Type: type,
          Value: 'REPLACE_ME',
          Description: description,
          Overwrite: false,
        },
        physicalResourceId: cr.PhysicalResourceId.of(name),
        ignoreErrorCodesMatching: 'ParameterAlreadyExists',
      },
      onUpdate: {
        service: 'SSM',
        action: 'describeParameters',
        parameters: {
          ParameterFilters: [{ Key: 'Name', Option: 'Equals', Values: [name] }],
        },
        physicalResourceId: cr.PhysicalResourceId.of(name),
      },
      onDelete: {
        service: 'SSM',
        action: 'deleteParameter',
        parameters: { Name: name },
        ignoreErrorCodesMatching: 'ParameterNotFound',
      },
      policy: cr.AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement({
          actions: ['ssm:PutParameter', 'ssm:DeleteParameter'],
          resources: [parameterArn],
        }),
        new iam.PolicyStatement({
          actions: ['ssm:DescribeParameters'],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          actions: ['kms:Encrypt', 'kms:Decrypt', 'kms:GenerateDataKey'],
          resources: ['*'],
          conditions: { StringEquals: { 'kms:ViaService': `ssm.${this.region}.amazonaws.com` } },
        }),
      ]),
    })
  }
}
