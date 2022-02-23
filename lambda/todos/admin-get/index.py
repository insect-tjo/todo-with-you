# -*- coding: utf-8 -*-
import os
import base64
import json
import boto3
from boto3.dynamodb.conditions import Key

def get_items_DDB():
    table_name=os.environ['DYNAMODB_NAME']

    dynamodb = boto3.resource('dynamodb')

    dynamo_table = dynamodb.Table(table_name)

    try:

        res = dynamo_table.scan()
        return res

    except Exception as e:
        return e


def handler(event, context):
    
    # get data from DynamoDB
    res = get_items_DDB()

 
    return {
        'statusCode': res['ResponseMetadata']['HTTPStatusCode'],
        'headers': {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
        },
        'body': json.dumps(res.get('Items'))
    }

    
    