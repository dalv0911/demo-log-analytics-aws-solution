#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DemoLogAnalyticsOnAwsStack } from '../lib/demo-log-analytics-on-aws-stack';

const app = new cdk.App();
new DemoLogAnalyticsOnAwsStack(app, 'DemoLogAnalyticsOnAwsStack');
