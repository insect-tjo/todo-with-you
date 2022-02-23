#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsCdkTodoStack } from '../lib/aws-cdk-todo-stack';
import { apiDocumentsStack } from '../lib/api-documents-stack';

const app = new cdk.App();
const toDoStack = new AwsCdkTodoStack(app, 'AwsCdkTodoStack', {});

new apiDocumentsStack(app, 'apiDocumentsStack', {
  todoApi: toDoStack.todoApiGateway
});