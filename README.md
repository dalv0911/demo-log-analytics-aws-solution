# Demonstrate streaming and analyzing log data by using AWS solution
## The architecture
Here is a diagram describle the architecture of the streaming and analyzing log data by using AWS Solution.
![](./images/IMG_01.png)

As you can see, we use 4 aws services
- `Amazon Kinesis Data Firehose`
  - Streaming log data from application to S3, using the schema defined by AWS Glue.
  - Buffering incomming data by size and the duration of data is in Firehose.
- `AWS Glue`
  - Define schema which should be the output to S3.
  - Define parquet file output (columnar format).
  - Define partition of the output, which Amazon Athena will reference when querying.
- `Amazon S3`
  - Store the parquet data which received from the Kinesis Firehose
- `Amazon Athena`
  - Using AWS Glue's schema to query data from S3 directly.

## About the CDK project
This is a project for TypeScript development with CDK.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

### Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
