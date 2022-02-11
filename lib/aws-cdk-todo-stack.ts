import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import  * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { CognitoToApiGatewayToLambda } from '@aws-solutions-constructs/aws-cognito-apigateway-lambda';
import { LambdaToDynamoDB } from '@aws-solutions-constructs/aws-lambda-dynamodb';
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AwsCdkTodoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

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

    //iamRole for Lambda(STS)
//    const CustomPolicy = new iam.PolicyDocument({
//      statements: [new iam.PolicyStatement({
//        actions: [
//          'sts:AssumeRole',
//        ],
//        principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
//        resources: ['*'],
//      })],
//    });

//    const lambdaExecRole = new iam.Role (this, 'lambdaExecRole',{
//      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
//      managedPolicies: [ iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")],
//      inlinePolicies: {['stspolicy']: CustomPolicy},
//    });


    //iamRole (Dynamic Policy)
//    const ddbBasePolicy = new iam.Role (this, 'DynamoBaseRole',{
//      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
//      managedPolicies: [ iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
//                        iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonDynamoDBFullAccess") ]
//    })

    //dynamo-lambda(POST)
//    const postToDynamo = new LambdaToDynamoDB(this, 'postToDynamo', {
//      lambdaFunctionProps: {
//        code: lambda.Code.fromAsset(`./lambda/post`),
//        runtime: lambda.Runtime.PYTHON_3_8,
//        handler: 'index.handler'
//      },
//      existingTableObj: table
//    });

    //dynamo-lambda(POST)
    const postToDynamo = new lambda.Function(this, 'postToDynamo', {
      code: lambda.Code.fromAsset(`./lambda/post`),
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'index.handler',
      environment: {
        'DYNAMODB_NAME' : table.tableName,
//        'DYNAMIC_POLICY_ROLE_ARN' : ddbBasePolicy.roleArn
      },
//      role: lambdaExecRole
    });

    //dynamo-lambda(GET)
    const getFromDynamo = new LambdaToDynamoDB(this, 'getFromDynamo', {
      lambdaFunctionProps: {
        code: lambda.Code.fromAsset(`./lambda/get`),
        runtime: lambda.Runtime.PYTHON_3_8,
        handler: 'index.handler'
      },
      existingTableObj: table
    });    

    //dynamo-lambda(PUT(update))
    const updateToDynamo = new LambdaToDynamoDB(this, 'updateToDynamo', {
      lambdaFunctionProps: {
        code: lambda.Code.fromAsset(`./lambda/update`),
        runtime: lambda.Runtime.PYTHON_3_8,
        handler: 'index.handler'
      },
      existingTableObj: table
    });  

    //dynamo-lambda(DELETE)
    const deleteFromDynamo = new LambdaToDynamoDB(this, 'deleteFromDynamo', {
      lambdaFunctionProps: {
        code: lambda.Code.fromAsset(`./lambda/delete`),
        runtime: lambda.Runtime.PYTHON_3_8,
        handler: 'index.handler'
      },
      existingTableObj: table
    });  


    // The code that defines your stack goes here
    const constCAL = new CognitoToApiGatewayToLambda(this, 'cognito-apigateway-lambda', {
      existingLambdaObj: getFromDynamo.lambdaFunction,
      apiGatewayProps: {
        proxy: false,
        defaultCorsPreflightOptions: {
          allowOrigins: apigateway.Cors.ALL_ORIGINS,
          allowMethods: apigateway.Cors.ALL_METHODS
        }
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
    const getIntegration = new apigateway.LambdaIntegration(getFromDynamo.lambdaFunction);
    resource.addMethod("GET", getIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO
    });

    //Add a method to the Resource(todo):PUT
    const updateIntegration = new apigateway.LambdaIntegration(updateToDynamo.lambdaFunction);
    resource.addMethod("PUT", updateIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO
    });

    //Add a method to the Resource(todo):DELETE
    const deleteIntegration = new apigateway.LambdaIntegration(deleteFromDynamo.lambdaFunction);
    resource.addMethod("DELETE", deleteIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO
    });

    constCAL.addAuthorizers();

  }

}
