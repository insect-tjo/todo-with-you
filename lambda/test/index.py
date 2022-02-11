# -*- coding: utf-8 -*-
import base64
import json
import boto3
import psycopg2
import psycopg2.extras

table = "UserInfo"
bucket = "road-image"

def get_from_RDS(id,tenant_id,sts):
    ENDPOINT="proxy-raws-rls.proxy-ckx9kq1sg8n6.us-east-1.rds.amazonaws.com"
    PORT="5432"
    USR=tenant_id
    REGION="us-east-1"
    DATABASE="postgres"
    
    #client = boto3.client('rds')
    client = boto3.client(
        'rds',
        aws_access_key_id=sts["Credentials"]["AccessKeyId"],
        aws_secret_access_key=sts["Credentials"]["SecretAccessKey"],
        aws_session_token=sts["Credentials"]["SessionToken"],
        )
        
    token = client.generate_db_auth_token(DBHostname=ENDPOINT, Port=PORT, DBUsername=USR, Region=REGION)
    print(token)
    connection = psycopg2.connect(host=ENDPOINT, database=DATABASE, user=USR, password=token, sslmode='require')
    #cur = connection.cursor()
    cur = connection.cursor(cursor_factory=psycopg2.extras.NamedTupleCursor)
    
    #q = "select * from raws where id = " + id + ";"
    
    q = "select * from raws;"
    cur.execute(q)
    
    #cur.execute('SELECT * FROM raws;')
    results = cur.fetchall()
    
    dict_result = []
    ## コンソールへ出力
    for row in results:
        #print(r)
        dict_result.append(row._asdict())
        
    connection.commit()
    connection.close()
    print(json.dumps(dict_result))
    return json.dumps(dict_result)
    
def get_tenant_id(table_name, user_id):
    dynamodb = boto3.resource('dynamodb') 
    dynamotable = dynamodb.Table(table_name)
    primary_key = {"user_id": user_id }

    res = dynamotable.get_item(Key=primary_key)
    tenant_id = res["Item"]["tenant_id"]

    return tenant_id

def get_sts(tenant_id):
    arn = "arn:aws:iam::327376710857:role/Lambda-Data-Collect-tsujio"
    
    rds_resource = "arn:aws:rds-db:us-east-1:327376710857:dbuser:prx-0273c3d47afd5a13a/" + tenant_id
    s3_resource = "arn:aws:s3:::" + bucket + "/" + tenant_id + "/*"
    session_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {"Effect": "Allow", "Action": "rds-db:connect", "Resource": rds_resource},
            {"Effect": "Allow", "Action": "s3:*", "Resource":s3_resource}
        ]
    }
    # gets the credentials from .aws/credentials
    client_sts = boto3.client('sts', region_name='us-east-1', endpoint_url='https://sts.us-east-1.amazonaws.com')

    sts_response = client_sts.assume_role(
        RoleArn=arn, RoleSessionName="test", Policy=json.dumps(session_policy)
    )
    return sts_response

def lambda_handler(event, context):
    
    #print(event)
    #print(event["headers"])
    #print(event["headers"]["Authorization"])
    
    tmp = event["headers"]["Authorization"].split('.')
    #jwt = base64.b64decode(tmp[0]).decode('utf-8')
    jwt = json.loads(base64.urlsafe_b64decode(tmp[1] + '=' * (-len(tmp[1] ) % 4)).decode(encoding='utf-8'))

    print(jwt["custom:tenant_id"])
    tenant_id = jwt["custom:tenant_id"] 
    
    # sts
    sts = get_sts(tenant_id)
    
    id = event["queryStringParameters"]["id"]
    print(id)
    res = get_from_RDS(id,tenant_id,sts)
    
    
    
    return {
        'statusCode': 200,
        'headers': {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
        },
        'body': res
    }