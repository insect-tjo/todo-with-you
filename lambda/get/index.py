# -*- coding: utf-8 -*-
import os
import base64
import json
import boto3

def get_item_DDB(tenant_id, todo_id, sts):
    table_name=os.environ['DYNAMODB_NAME']

    dynamodb = boto3.resource(
        'dynamodb',
        aws_access_key_id=sts["Credentials"]["AccessKeyId"],
        aws_secret_access_key=sts["Credentials"]["SecretAccessKey"],
        aws_session_token=sts["Credentials"]["SessionToken"],
        )

    dynamo_table = dynamodb.Table(table_name)
    primary_key = { "userid" : tenant_id, "todoid" : "testtodo-id" }
    try:
        res = dynamo_table.get_item(Key=primary_key)
        return res["Item"]
        
    except Exception as e:
        return e

def get_sts(tenant_id):

    ddb_arn = os.environ['DYNAMODB_ARN']
    ddb_baserole_arn = os.environ['DYNAMIC_POLICY_ROLE_ARN']
    region = os.environ['AWS_REGION']


    ddb_resource = ddb_arn

    session_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow", 
                "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                ],
                "Resource": ddb_resource, 
                "Condition": {
                    "ForAllValues:StringEquals": {
                        "dynamodb: LeadingKeys": [ tenant_id ]
                    }
                },
            }                
        ]
    }

    # gets the credentials from .aws/credentials
    client_sts = boto3.client('sts', region_name=region, endpoint_url='https://sts.' + region + '.amazonaws.com')

    sts_response = client_sts.assume_role(
        RoleArn=ddb_baserole_arn, RoleSessionName="db", Policy=json.dumps(session_policy)
    )
    return sts_response

def handler(event, context):
    
    #print(event)
    #print(event["headers"])
    #print(event["headers"]["Authorization"])
    
    #tmp = event["headers"]["Authorization"].split('.')
    #jwt = base64.b64decode(tmp[0]).decode('utf-8')
    #jwt = json.loads(base64.urlsafe_b64decode(tmp[1] + '=' * (-len(tmp[1] ) % 4)).decode(encoding='utf-8'))

    #print(jwt["custom:tenant_id"])
    #tenant_id = jwt["custom:tenant_id"] 
    
    # sts
    tenant_id="dummy-id-12345"
    todo_id="testtodo-id"
    sts = get_sts(tenant_id)
    
    #id = event["queryStringParameters"]["id"]
    #print(id)
    #res = get_from_RDS(id,tenant_id,sts)
    
    res = get_item_DDB(tenant_id, todo_id, sts)
    
    return {
        'statusCode': 200,
        'headers': {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
        },
        'body': res
    }