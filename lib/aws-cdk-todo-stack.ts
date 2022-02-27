import { RemovalPolicy, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
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
    //domainPrefixは重複することがあるため、ランダム値を生成
    let cognitoDomainPrefix: string = "todo-app-" + Math.random().toString(32).substring(2);


    let callBackUrl: string = "https://www.sampleapp-todo-dummy.com/";

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

    //Lambdaが関数内で引き受けるロール(scope:Admin用)
    const ddbBaseRoleforAdmin = new iam.Role (this, 'DynamoBaseRoleforAdmin',{
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
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

    //dynamo-lambda(GET Admin)
    const getFromDynamoAdmin = new lambda.Function(this, 'getFromDynamoAdmin', {
      code: lambda.Code.fromAsset(`./lambda/todos/admin-get`),
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'index.handler',
      environment: {
        'DYNAMODB_NAME' : table.tableName,
        'DYNAMODB_ARN' : table.tableArn,
        'DYNAMIC_POLICY_ROLE_ARN' : ddbBaseRole.roleArn,
      },
      role: ddbBaseRoleforAdmin
    });

    // cognito userpool for rest API user
    const userPool = new cognito.UserPool(this, 'UserPool', {
      removalPolicy: RemovalPolicy.DESTROY,
    });
    
    // Resource Server Scope for user
    const userScope = new cognito.ResourceServerScope({ scopeName: 'user', scopeDescription: 'Read-only access' });

    // Resource Server Scope for admin
    const adminScope = new cognito.ResourceServerScope({ scopeName: 'admin', scopeDescription: 'Full access' }); 

    // Resource Server
    const resourceServer = userPool.addResourceServer('ResourceServer', {
      identifier: 'role',
      scopes: [ userScope, adminScope ],
    });

    // userpool app client 
    const userClient = userPool.addClient('todoUserClient',{
      oAuth: {
        flows: {
          implicitCodeGrant: true,
        },
        callbackUrls: [
          callBackUrl,
        ],
        scopes: [ cognito.OAuthScope.resourceServer(resourceServer, userScope) ],
      },
    });

    // userpool app client 
    const adminClient = userPool.addClient('todoAdminClient',{
      generateSecret: true,
      oAuth: {
        flows: {
          clientCredentials: true,
        },
        callbackUrls: [
          callBackUrl,
        ],
        scopes: [ cognito.OAuthScope.resourceServer(resourceServer, adminScope) ],
      },
    });

    // signin domain
    const signInDomain = userPool.addDomain('SignInDomain', {
      cognitoDomain: {
        domainPrefix: cognitoDomainPrefix,
      },
    });
    
    // redirect URL
    const redirectUrl = signInDomain.signInUrl(userClient, {
      redirectUri: callBackUrl, // must be a URL configured under 'callbackUrls' with the client
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
    const resourceAdmin = this.todoApiGateway.root.addResource('admintodos');

    // /// resource collection 
    //Add a method to the Resource(todo):POST
    resource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(postToDynamo),
      {
        authorizer: auth,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizationScopes: 
          [
            cognito.OAuthScope.resourceServer(resourceServer, userScope).scopeName,
          ],
      }
    );
 
    // //Add a method to the Resource(todo):GET
    resource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getFromDynamo),
      {
        authorizer: auth,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizationScopes: 
          [
            cognito.OAuthScope.resourceServer(resourceServer, userScope).scopeName,
          ],
      }
    );

    // /// resource_id 
    // //Add a method to the Resource(todo):PUT
     resource_id.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(updateToDynamo),
      {
        authorizer: auth,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizationScopes: 
          [
            cognito.OAuthScope.resourceServer(resourceServer, userScope).scopeName,
          ],
      }
    );

    // //Add a method to the Resource(todo):PUT
    resource_id.addMethod(
      "PATCH",
      new apigateway.LambdaIntegration(patchToDynamo),
      {
        authorizer: auth,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizationScopes: 
          [
            cognito.OAuthScope.resourceServer(resourceServer, userScope).scopeName,
          ],
      }
    );

    // //Add a method to the Resource(todo):DELETE
    resource_id.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(deleteFromDynamo),
      {
        authorizer: auth,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizationScopes: 
          [
            cognito.OAuthScope.resourceServer(resourceServer, userScope).scopeName,
          ],
      }
    );

    // //Add a method to the Resource(todo):GET
    resource_id.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getFromDynamoObj),
      {
        authorizer: auth,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizationScopes: 
          [
            cognito.OAuthScope.resourceServer(resourceServer, userScope).scopeName,
          ],
      }
    );

    // //Add a method to the Resource(todo):GET
    resourceAdmin.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getFromDynamoAdmin),
      {
        authorizer: auth,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizationScopes: 
          [
            cognito.OAuthScope.resourceServer(resourceServer, adminScope).scopeName
          ],
      }
    );

    //Output API Gateway ID
    new CfnOutput(this, 'ApiGatewayId', {
      value: this.todoApiGateway.restApiId,
      description: 'Api gateway ID',
      exportName: 'ApiGatewayId',
    });

    //Output Cognito domain (URL)
    new CfnOutput(this, 'CognitoUserPoolDomain', {
      value: "https://" + signInDomain.domainName + ".auth." + this.region + ".amazoncognito.com",
      description: 'CognitoUserpool Domain',
      exportName: 'CognitoUserPoolDomain',
    });

    //Output Cognito Userpool ID
    new CfnOutput(this, 'CognitoUserPoolID', {
      value: userPool.userPoolId,
      description: 'CognitoUserpool Domain',
      exportName: 'CognitoUserPoolIDn',
    });

    //Output App Client ID (for user)
    new CfnOutput(this, 'CognitoUserPoolAppIDforUser', {
      value: userClient.userPoolClientId,
      description: 'Cognito UserPool Application Client ID for User',
      exportName: 'CognitoUserPoolAppIDforUser',
    });

    //Output Callback URL (for user)
    new CfnOutput(this, 'CognitoUserPoolcallbackUrlforUser', {
      value: callBackUrl,
      description: 'Cognito UserPool callback Url for User',
      exportName: 'CognitoUserPoolCallbackforUser',
    });

    //Output App Client ID (for admin)
    new CfnOutput(this, 'CognitoUserPoolAppIDforAdmin', {
      value: adminClient.userPoolClientId,
      description: 'Cognito UserPool Application ID for Admin',
      exportName: 'CognitoUserPoolAppIDforAdmin',
    });

    //Output Callback URL (for admin)
    new CfnOutput(this, 'CognitoUserPoolCallbackUrlforAdmin', {
      value: callBackUrl,
      description: 'Cognito UserPool Callback URL for Admin',
      exportName: 'CognitoUserPoolCallbackUrlforAdmin',
    });

  }

}
