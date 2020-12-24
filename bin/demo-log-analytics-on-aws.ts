#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DemoLogAnalyticsOnAwsStack } from '../lib/demo-log-analytics-on-aws-stack';

const envJP = { account: process.env.AWS_ACCOUNT, region: process.env.AWS_REGION };

const app = new cdk.App();
new DemoLogAnalyticsOnAwsStack(app, 'DemoLogAnalyticsOnAwsStack', { env: envJP });
