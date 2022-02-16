# -*- coding: utf-8 -*-
import os
import base64
import json
import boto3

def delete_item_DDB(item, sts):
    table_name=os.environ['DYNAMODB_NAME']

    dynamodb = boto3.resource(
        'dynamodb',
        aws_access_key_id=sts["Credentials"]["AccessKeyId"],
        aws_secret_access_key=sts["Credentials"]["SecretAccessKey"],
        aws_session_token=sts["Credentials"]["SessionToken"],
        )

    dynamo_table = dynamodb.Table(table_name)
    delete_key = { "userid" : item['userid'], "todoid" : item['todoid'] }
    try:
        res = dynamo_table.delete_item(
            Key=delete_key,
            ReturnValues="ALL_OLD"
            )
        return res
        
    except Exception as e:
        return e

def get_sts(user_id):

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
                    "dynamodb:DeleteItem"
                ],
                "Resource": ddb_resource, 
                "Condition": {
                    "ForAllValues:StringEquals": {
                        "dynamodb: LeadingKeys": [ user_id ]
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
    
    # decode jwt
    tmp = event["headers"]["Authorization"].split('.')
    jwt = json.loads(base64.urlsafe_b64decode(tmp[1] + '=' * (-len(tmp[1] ) % 4)).decode(encoding='utf-8'))


    # sts
    user_id = jwt["sub"]
    sts = get_sts(user_id)
    
    # assenble Item
    try:
        item = {
                    'userid': user_id,
                    'todoid': event['pathParameters']['todo-id'],
        }
    except Exception as e:
        # Attribute Error
        error_text = {
            'type': "Input Error",
            'detail': "request is invalid."
        }
        return {
            'statusCode': 400,
            'headers': {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
            },
            'body': json.dumps(error_text)
        }
    
    # delete item
    res = delete_item_DDB(item, sts)
    
    return {
        'statusCode': res['ResponseMetadata']['HTTPStatusCode'],
        'headers': {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
        },
        'body': json.dumps(res.get('Attributes'))
    }