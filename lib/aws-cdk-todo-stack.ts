import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import  * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { CognitoToApiGatewayToLambda } from '@aws-solutions-constructs/aws-cognito-apigateway-lambda';
import { LambdaToDynamoDB } from '@aws-solutions-constructs/aws-lambda-dynamodb';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AwsCdkTodoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    let apiVersion: string = "v1";

    //todo DynamoDB
    const table = new ddb.Table(this, "todo",{
      tableName: 'todo',
      partitionKey: {
          name: 'userid',
          type: ddb.AttributeType.STRING
      },
      sortKey: {
        name: 'todoid',
        type: ddb.AttributeType.STRING
      },
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: ddb.BillingMode.PAY_PER_REQUEST
    });

    // Lambdaの実行ロールのポリシ(STS実行)
   const CustomPolicySTS = new iam.PolicyDocument({
     statements: [new iam.PolicyStatement({
       actions: [
         'sts:AssumeRole',
       ],
       resources: [ '*' ], 
     })],
   });

    // LambdaがDynammoDBアクセス時に使用するポリシのベース（Lambda関数内でセッションポリシを用い、範囲を狭くする。）
    const CustomPolicyDDB = new iam.PolicyDocument({
      statements: [new iam.PolicyStatement({
        actions: [
          'dynamodb:DeleteItem',
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:Query',
          'dynamodb:Scan',
          'dynamodb:UpdateItem'
        ],
        resources: [ table.tableArn ],  
      })],
    });


    // Lambdaの実行ロール（STSを実行）
    const lambdaExecSTSRole = new iam.Role (this, 'lambdaExecSTSRole',{
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [ iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")],
      inlinePolicies: { CustomPolicySTS },
    });

    //Lambdaが関数内で引き受けるロール
    const ddbBaseRole = new iam.Role (this, 'DynamoBaseRole',{
      assumedBy: new iam.ArnPrincipal(lambdaExecSTSRole.roleArn),
      managedPolicies: [ iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole") ] ,
      inlinePolicies: { CustomPolicyDDB },
    })

    //DynamoDBへのPUT用Lambda(POST)
    const postToDynamo = new lambda.Function(this, 'postToDynamo', {
      code: lambda.Code.fromAsset(`./lambda/post`),
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'index.handler',
      environment: {
        'DYNAMODB_NAME' : table.tableName,
        'DYNAMODB_ARN' : table.tableArn,
        'DYNAMIC_POLICY_ROLE_ARN' : ddbBaseRole.roleArn,
      },
      role: lambdaExecSTSRole
    });

    //dynamo-lambda(GET)
    const getFromDynamo = new lambda.Function(this, 'getFromDynamo', {
      code: lambda.Code.fromAsset(`./lambda/get`),
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'index.handler',
      environment: {
        'DYNAMODB_NAME' : table.tableName,
        'DYNAMODB_ARN' : table.tableArn,
        'DYNAMIC_POLICY_ROLE_ARN' : ddbBaseRole.roleArn,
      },
      role: lambdaExecSTSRole
    });

    //dynamo-lambda(PUT(update))
    const updateToDynamo = new lambda.Function(this, 'updateToDynamo', {
      code: lambda.Code.fromAsset(`./lambda/update`),
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'index.handler',
      environment: {
        'DYNAMODB_NAME' : table.tableName,
        'DYNAMODB_ARN' : table.tableArn,
        'DYNAMIC_POLICY_ROLE_ARN' : ddbBaseRole.roleArn,
      },
      role: lambdaExecSTSRole
    });

    //dynamo-lambda(DELETE)
    const deleteFromDynamo = new lambda.Function(this, 'deleteFromDynamo', {
      code: lambda.Code.fromAsset(`./lambda/delete`),
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'index.handler',
      environment: {
        'DYNAMODB_NAME' : table.tableName,
        'DYNAMODB_ARN' : table.tableArn,
        'DYNAMIC_POLICY_ROLE_ARN' : ddbBaseRole.roleArn,
      },
      role: lambdaExecSTSRole
    });

    // The code that defines your stack goes here
    const constCAL = new CognitoToApiGatewayToLambda(this, 'cognito-apigateway-lambda', {
      existingLambdaObj: getFromDynamo,
      apiGatewayProps: {
        proxy: false,
        defaultCorsPreflightOptions: {
          allowOrigins: apigateway.Cors.ALL_ORIGINS,
          allowMethods: apigateway.Cors.ALL_METHODS
        },
        deployOptions: {
          stageName: apiVersion,
        },
      }
  });

    //Add a resource to the API gateway 
    const resource = constCAL.apiGateway.root.addResource('todo');

    //Add a method to the Resource(todo):POST
//    const postIntegration = new apigateway.LambdaIntegration(postToDynamo.lambdaFunction);
//    resource.addMethod("POST", postIntegration, {
//      authorizationType: apigateway.AuthorizationType.COGNITO
//    });

    const postIntegration = new apigateway.LambdaIntegration(postToDynamo);
    resource.addMethod("POST", postIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO
    });

    

    //Add a method to the Resource(todo):GET
    const getIntegration = new apigateway.LambdaIntegration(getFromDynamo);
    resource.addMethod("GET", getIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO
    });

    //Add a method to the Resource(todo):PUT
    const updateIntegration = new apigateway.LambdaIntegration(updateToDynamo);
    resource.addMethod("PUT", updateIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO
    });

    //Add a method to the Resource(todo):DELETE
    const deleteIntegration = new apigateway.LambdaIntegration(deleteFromDynamo);
    resource.addMethod("DELETE", deleteIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO
    });

    constCAL.addAuthorizers();

  }

}
