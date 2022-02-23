import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import  * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';

export class AwsCdkTodoStack extends Stack {

  public readonly todoApiGateway: apigateway.RestApi;

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
      code: lambda.Code.fromAsset(`./lambda/todos/post`),
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
      code: lambda.Code.fromAsset(`./lambda/todos/get`),
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
      code: lambda.Code.fromAsset(`./lambda/todo-id/update`),
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'index.handler',
      environment: {
        'DYNAMODB_NAME' : table.tableName,
        'DYNAMODB_ARN' : table.tableArn,
        'DYNAMIC_POLICY_ROLE_ARN' : ddbBaseRole.roleArn,
      },
      role: lambdaExecSTSRole
    });
    
    //dynamo-lambda(PATCH())
    const patchToDynamo = new lambda.Function(this, 'patchToDynamo', {
      code: lambda.Code.fromAsset(`./lambda/todo-id/patch`),
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
      code: lambda.Code.fromAsset(`./lambda/todo-id/delete`),
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
    const getFromDynamoObj = new lambda.Function(this, 'getFromDynamoObj', {
      code: lambda.Code.fromAsset(`./lambda/todo-id/get`),
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'index.handler',
      environment: {
        'DYNAMODB_NAME' : table.tableName,
        'DYNAMODB_ARN' : table.tableArn,
        'DYNAMIC_POLICY_ROLE_ARN' : ddbBaseRole.roleArn,
      },
      role: lambdaExecSTSRole
    });

    // cognito userpool for rest API user
    const userPool = new cognito.UserPool(this, 'UserPool', {
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // userpool app client 
    userPool.addClient('todoUserClient',{
      authFlows: {
        userPassword: true,
      }
    });

    // API Gateway(REST API)
    this.todoApiGateway = new apigateway.RestApi(this, 'todoApi', {
      deployOptions: {
        stageName: apiVersion,
      },
    });

    // Integrate Cognito to API gateway
    const auth = new apigateway.CognitoUserPoolsAuthorizer(this, 'todoAuthorizer', {
      cognitoUserPools: [userPool]
    });

    //Add a resource to the API gateway 
    const resource = this.todoApiGateway.root.addResource('todos');
    const resource_id = resource.addResource('{todo-id}');

    // /// resource collection 
    //Add a method to the Resource(todo):POST
    resource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(postToDynamo),
      {
        authorizer: auth,
        authorizationType: apigateway.AuthorizationType.COGNITO
      }
    );
 
    // //Add a method to the Resource(todo):GET
    resource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getFromDynamo),
      {
        authorizer: auth,
        authorizationType: apigateway.AuthorizationType.COGNITO
      }
    );

    // /// resource_id 
    // //Add a method to the Resource(todo):PUT
     resource_id.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(updateToDynamo),
      {
        authorizer: auth,
        authorizationType: apigateway.AuthorizationType.COGNITO
      }
    );

    // //Add a method to the Resource(todo):PUT
    resource_id.addMethod(
      "PATCH",
      new apigateway.LambdaIntegration(patchToDynamo),
      {
        authorizer: auth,
        authorizationType: apigateway.AuthorizationType.COGNITO
      }
    );

    // //Add a method to the Resource(todo):DELETE
    resource_id.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(deleteFromDynamo),
      {
        authorizer: auth,
        authorizationType: apigateway.AuthorizationType.COGNITO
      }
    );

    // //Add a method to the Resource(todo):GET
    resource_id.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getFromDynamoObj),
      {
        authorizer: auth,
        authorizationType: apigateway.AuthorizationType.COGNITO
      }
    );

  }

}
