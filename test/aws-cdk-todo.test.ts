import { App } from 'aws-cdk-lib';
import { Template, Match, Capture } from 'aws-cdk-lib/assertions';
import { AwsCdkTodoStack } from '../lib/aws-cdk-todo-stack';


test('Fine grained: AwsCdkTodo', () => {
    const app = new App()
    const targetStack = new AwsCdkTodoStack(app, 'stack')
    const template = Template.fromStack(targetStack)

    // Functionが6つ作られていることを確認する
    template.resourceCountIs('AWS::Lambda::Function', 7)


    // DynamoDBのパーティションキー、ソートキーが正しいことを確認する。
    template.hasResourceProperties('AWS::DynamoDB::Table', {
        "AttributeDefinitions": [
            {
                "AttributeName": "userid",
                "AttributeType": "S",
            },
            {
                "AttributeName": "todoid",
                "AttributeType": "S",
            }
        ]
    })


    // API Gateway（REST API）が１つ作成されていることを確認する。
    template.resourceCountIs("AWS::ApiGateway::RestApi", 1);

    // Resource「todos」が作成されていることを確認する。
    template.hasResourceProperties("AWS::ApiGateway::Resource", {
        PathPart: "todos",
    });

    // API GatewayのMethodが6つ作成されていることを確認する。
    template.resourceCountIs("AWS::ApiGateway::Method", 7);



});
