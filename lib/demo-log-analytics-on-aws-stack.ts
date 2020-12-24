import * as cdk from '@aws-cdk/core';
import * as firehose from '@aws-cdk/aws-kinesisfirehose';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';
import * as glue from '@aws-cdk/aws-glue';

export class DemoLogAnalyticsOnAwsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const namespace = 'david-demo'
    const region = process.env.CDK_DEFAULT_REGION
    const account = process.env.CDK_DEFAULT_ACCOUNT

    // Create a bucket to store ingested data from Kinesis Firehose
    const analyticalBucket = new s3.Bucket(this, `AnalyticalLogsBucket`, {
      bucketName: `${namespace}-analytical-logs`,
    })

    // Create a bucket to store athena query's results
    new s3.Bucket(this, `AthenaQueryResultsBucket`, {
      bucketName: `${namespace}-athena-query-results`,
    })

    // Create a glue database and table to define the schema of output data
    const database = new glue.Database(this, 'AnalyticalLogsDatabase', {
      databaseName: `david_demo_analytical_logs`,
    })
    const table = new glue.Table(this, 'ParquetLogsTable', {
      database: database,
      tableName: `parquetlogs`,
      columns: [
        {
          name: 'user_id',
          type: glue.Schema.BIG_INT,
        },
        {
          name: 'movie_id',
          type: glue.Schema.BIG_INT,
        },
        {
          name: 'category',
          type: glue.Schema.STRING,
        },
        {
          name: 'sampled_at',
          type: glue.Schema.STRING,
        },
      ],
      partitionKeys: [
        {
          name: 'year',
          type: glue.Schema.STRING,
        },
        {
          name: 'month',
          type: glue.Schema.STRING,
        },
        {
          name: 'day',
          type: glue.Schema.STRING,
        },
      ],
      dataFormat: glue.DataFormat.PARQUET,
      bucket: analyticalBucket,
      s3Prefix: 'data/',
    })

    // Kinesis Firehose access the Glue Database and Table in order to be deployed and parse incomming data
    const analyticalPolicy = new iam.ManagedPolicy(this, 'AnalyticalManagedPolicy', {
      document: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            actions: [
              'glue:GetTable',
              'glue:GetTableVersion',
              'glue:GetTableVersions',
            ],
            effect: iam.Effect.ALLOW,
            resources: [
              database.catalogArn,
              database.databaseArn,
              table.tableArn,
            ],
          }),
        ],
      }),
    })

    const analyticalRole = new iam.Role(this, 'FirehoseRole', {
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
      roleName: `${namespace}-firehose-role`,
      description: 'Assumed by firehose analytical in order to access the Glue database and table',
      managedPolicies: [
        analyticalPolicy,
      ]
    })

    // Create a Kinesis Firehose to ingest incoming data
    const firehoseAnalytical = new firehose.CfnDeliveryStream(this, 'AnalyticalStreamFirehose', {
      deliveryStreamName: `${namespace}-analytical-stream`,
      deliveryStreamType: 'DirectPut',
      extendedS3DestinationConfiguration: {
        bucketArn: analyticalBucket.bucketArn,
        prefix: 'data\/year=!{timestamp:yyyy}\/month=!{timestamp:MM}\/day=!{timestamp:dd}\/',
        errorOutputPrefix: 'errors\/year=!{timestamp:yyyy}\/!{firehose:error-output-type}\/',
        roleArn: analyticalRole.roleArn,
        bufferingHints: {
          sizeInMBs: 64, // Buffering up to 64Mb (minimum is 64Mb)
          intervalInSeconds: 60, // Buffering up to 60 seconds
        },
        dataFormatConversionConfiguration: {
          enabled: true,
          inputFormatConfiguration: {
            deserializer: {
              openXJsonSerDe: {},
            },
          },
          outputFormatConfiguration: {
            serializer: {
              parquetSerDe: {},
            },
          },
          schemaConfiguration: {
            databaseName: database.databaseName,
            tableName: table.tableName,
            roleArn: analyticalRole.roleArn,
          },
        },
      },
    })

    // Attaches additional policies to the Kinesis Firehose Role
    const s3AnalyticalStatement = new iam.PolicyStatement({
      actions: [
        's3:GetObject',
        's3:PutObject',
      ],
      effect: iam.Effect.ALLOW,
      resources: [
        analyticalBucket.bucketArn,
        `${analyticalBucket.bucketArn}/*`,
      ],
    })

    const kinesisAnalyticalStatement = new iam.PolicyStatement({
      actions: [
        'kinesis:DescribeStream',
        'kinesis:GetRecords',
      ],
      effect: iam.Effect.ALLOW,
      resources: [
        `arn:aws:firehose:${region}:${account}:`,
        `${firehoseAnalytical.attrArn}/*`,
      ],
    })
    const additionalPolicy = new iam.ManagedPolicy(this, 'AdditionalAnalyticalManagedPolicy', {
      document: new iam.PolicyDocument({
        statements: [
          s3AnalyticalStatement,
          kinesisAnalyticalStatement,
        ],
      }),
    })
    additionalPolicy.attachToRole(analyticalRole)
  }
}
