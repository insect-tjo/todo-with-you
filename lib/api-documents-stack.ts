import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

// properties for the apiDocumentsStack
export interface apiDocmentsStackProps {
    readonly todoApi: apigateway.RestApi;
}

export class apiDocumentsStack extends Stack {
    constructor(scope: Construct, id: string, props: apiDocmentsStackProps) {
      super(scope, id);

    //
    //  Documentation 
    // ////////////////////


    // API
    /////////
    new apigateway.CfnDocumentationPart(this, 'DocApi', {
      location: {
        type: 'API',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "description": "ToDoリストを作成するためのAPIです。" +
        "ToDoリストの作成、取得、更新、削除を行えます。" +
        "また、ToDoリストへのアクセスは認証・認可を実施した上でユーザ単位のアクセスに限定します。"
      })
    });

    // RESOURCE
    /////////
    
    const todos_resource = props.todoApi.root.getResource("todos")
    const todos_path = todos_resource?.path
    const todoid_path = todos_resource?.getResource('{todo-id}')?.path

    // RESOURCE：todos
    //////////////////
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodos', {
      location: {
        path: todos_path,
        type: 'RESOURCE',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "description": "ToDoリストのコレクションを指します。" +
        "アクセスしたユーザが持つ全てのToDoリストです。"
      })
    });

    // METHOD:todos
    /////////

    // todos:POST
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodosPost', {
      location: {
        method: 'POST',
        path: todos_path,
        type: 'METHOD',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "description": "新しいToDoを作成します。作成された直後のToDoのstatus（ToDoが持つ状態）はtodoです。" + 
        "レスポンスボディには、生成されたToDoのuserid, todoid, title, content, statusが含まれます。"
      })
    });

    //todos:POST:REQUEST_HEADER
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodosPostRequestHeader', {
      location: {
        method: 'POST',
        path: todos_path,
        type: 'REQUEST_HEADER',
        name: 'Authorization',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "description": "オーソライザーで払い出された認証トークン" 
      })
    });

    //todos:POST:REQUEST_BODY
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodosPostRequestBody', {
      location: {
        method: 'POST',
        path: todos_path,
        type: 'REQUEST_BODY',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "title": "ToDoのタイトル" ,
        "content": "ToDoの内容"
      })
    });

    //todos:POST:RESPONSE_HEADER
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodosPostResponseHeader', {
      location: {
        method: 'POST',
        path: todos_path,
        type: 'RESPONSE_HEADER',
        name: 'Authorization',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "description": "オーソライザーで払い出された認証トークン" 
      })
    });

    //todos:POST:RESPONSE
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodosPostResponse', {
      location: {
        method: 'POST',
        path: todos_path,
        statusCode: "201",
        type: 'RESPONSE',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "description": "todosへのPOSTリクエストが成功し、リソースを生成したことを示しています。" 
      })
    });

    //todos:POST:RESPONSE_BODY
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodosPostResponseBody', {
      location: {
        method: 'POST',
        path: todos_path,
        type: 'RESPONSE_BODY',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "userid": "ToDoを生成したユーザのID",
        "todoid": "生成したToDoのID",
        "title": "生成したToDoのタイトル",
        "content": "生成したToDoの内容",
        "status": "生成したToDoのステータス(初期値は、文字列のtodo)"
      })
    });


    //////
    // todos:GET
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodosGet', {
      location: {
        method: 'GET',
        path: todos_path,
        type: 'METHOD',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "description": "リクエストしたユーザが作成した全てのToDoを取得します。" + 
        "レスポンスボディには、各ToDoのuserid, todoid, title, content, statusが含まれます。" + 
        "また、返却される最大データ数は30です。"
      })
    });

    //todos:GET:REQUEST_HEADER
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodosGetRequestHeader', {
      location: {
        method: 'GET',
        path: todos_path,
        type: 'REQUEST_HEADER',
        name: 'Authorization',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "description": "オーソライザーで払い出された認証トークン" 
      })
    });

    //todos:GET:RESPONSE
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodosGetResponse', {
      location: {
        method: 'GET',
        path: todos_path,
        statusCode: "200",
        type: 'RESPONSE',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "description": "todosへのGETリクエストが成功したことを示しています。" 
      })
    });

    //todos:GET:RESPONSE_BODY
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodosGetResponseBody', {
      location: {
        method: 'GET',
        path: todos_path,
        type: 'RESPONSE_BODY',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "userid": "ToDoを所有するユーザのID",
        "todoid": "ToDoのID",
        "title": "ToDoのタイトル",
        "content": "ToDoの内容",
        "status": "ToDoのステータス"
      })
    });

    //////////////////
    // RESOURCE：todo-id
    //////////////////

    new apigateway.CfnDocumentationPart(this, 'DocResourceTodoId', {
      location: {
        path: todoid_path,
        type: 'RESOURCE',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "description": "単体のToDoを指します。" +
        "ToDoの更新、削除、詳細の取得に使用できます。" + 
        "ToDoの指定には、パスパラメータを使用します。"
      })
    });


    //////
    // todos-id:GET
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodoIdGet', {
      location: {
        method: 'GET',
        path: todoid_path,
        type: 'METHOD',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "description": "特定のToDoを取得します。" + 
        "レスポンスボディには、各ToDoのuserid, todoid, title, content, statusが含まれます。" + 
        "todoidは、パスパラメータで指定します。"
      })
    });

    //todos-id:GET:REQUEST_HEADER
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodoIdGetRequestHeader', {
      location: {
        method: 'GET',
        path: todoid_path,
        type: 'REQUEST_HEADER',
        name: 'Authorization',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "description": "オーソライザーで払い出された認証トークン" 
      })
    });

    //todos-id:GET:PATH_PARAMETER 
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodoIdGetPathParameter', {
      location: {
        method: 'GET',
        path: todoid_path,
        type: 'PATH_PARAMETER',
        name: "todo-id"
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "description": "取得対象のToDoのID" 
      })
    });

    //todos-id:GET:RESPONSE
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodoIdGetResponse', {
      location: {
        method: 'GET',
        path: todoid_path,
        statusCode: "200",
        type: 'RESPONSE',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "description": "todos-idへのGETリクエストが成功したことを示しています。" 
      })
    });

    //todos-id:GET:RESPONSE_BODY
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodoIdGetResponseBody', {
      location: {
        method: 'GET',
        path: todoid_path,
        type: 'RESPONSE_BODY',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "userid": "ToDoを所有するユーザのID",
        "todoid": "ToDoのID",
        "title": "ToDoのタイトル",
        "content": "ToDoの内容",
        "status": "ToDoのステータス"
      })
    });


    //////
    // todos-id:PATCH
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodoIdPatch', {
      location: {
        method: 'PATCH',
        path: todoid_path,
        type: 'METHOD',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "description": "特定のToDoの属性statusを更新します。" + 
        "更新対象はリクエスト時のパスパラメータtodo-idで指定します。" +
        "リクエストボディには、更新するstatusの値を指定します。" + 
        "レスポンスボディには、更新後のToDoのuserid, todoid, title, content, statusが含まれます。" 
      })
    });

    //todos-id:PATCH:REQUEST_HEADER
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodoIdPatchRequestHeader', {
      location: {
        method: 'PATCH',
        path: todoid_path,
        type: 'REQUEST_HEADER',
        name: 'Authorization',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "description": "オーソライザーで払い出された認証トークン" 
      })
    });

    //todos-id:PATCH:PATH_PARAMETER 
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodoIdPatchPathParameter', {
      location: {
        method: 'PATCH',
        path: todoid_path,
        type: 'PATH_PARAMETER',
        name: "todo-id"
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "description": "更新対象のToDoのID" 
      })
    });

    //todos:PATCH:REQUEST_BODY
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodosPatchRequestBody', {
      location: {
        method: 'PATCH',
        path: todoid_path,
        type: 'REQUEST_BODY',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "status": "更新後のToDoのステータス" 
      })
    });

    //todos-id:PATCH:RESPONSE
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodoIdPatchResponse', {
      location: {
        method: 'PATCH',
        path: todoid_path,
        statusCode: "200",
        type: 'RESPONSE',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "description": "todos-idへのPATCHリクエストが成功したことを示しています。" 
      })
    });

    //todos-id:PATCH:RESPONSE_BODY
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodoIdPatchResponseBody', {
      location: {
        method: 'PATCH',
        path: todoid_path,
        type: 'RESPONSE_BODY',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "userid": "ToDoを所有するユーザのID",
        "todoid": "ToDoのID",
        "title": "ToDoのタイトル",
        "content": "ToDoの内容",
        "status": "更新後のToDoのステータス"
      })
    });

    //////
    // todos-id:PUT
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodoIdPut', {
      location: {
        method: 'PUT',
        path: todoid_path,
        type: 'METHOD',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "description": "特定のToDoの属性title, content, statusを更新します。" + 
        "更新対象は、リクエスト時のパスパラメータで指定します。" +
        "リクエストボディには、更新するtitle, content, statusの値を指定します。" + 
        "レスポンスボディには、更新後のToDoのuserid, todoid, title, content, statusが含まれます。" 
      })
    });

    //todos-id:PUT:REQUEST_HEADER
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodoIdPutRequestHeader', {
      location: {
        method: 'PUT',
        path: todoid_path,
        type: 'REQUEST_HEADER',
        name: 'Authorization',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "description": "オーソライザーで払い出された認証トークン" 
      })
    });

    //todos-id:PUT:PATH_PARAMETER 
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodoIdPutPathParameter', {
      location: {
        method: 'PUT',
        path: todoid_path,
        type: 'PATH_PARAMETER',
        name: "todo-id"
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "description": "更新対象のToDoのID" 
      })
    });

    //todos:PUT:REQUEST_BODY
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodosPutRequestBody', {
      location: {
        method: 'PUT',
        path: todoid_path,
        type: 'REQUEST_BODY',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "title": "更新後のToDoタイトル" ,
        "content": "更新後のToDoの内容" ,
        "status": "更新後のToDoステータス"
      })
    });

    //todos-id:PUT:RESPONSE
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodoIdPutResponse', {
      location: {
        method: 'PUT',
        path: todoid_path,
        statusCode: "200",
        type: 'RESPONSE',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "description": "todos-idへのPUTリクエストが成功したことを示しています。" 
      })
    });

    //todos-id:PUT:RESPONSE_BODY
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodoIdPutResponseBody', {
      location: {
        method: 'PUT',
        path: todoid_path,
        type: 'RESPONSE_BODY',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "userid": "ToDoを所有するユーザのID",
        "todoid": "ToDoのID",
        "title": "更新後のToDoのタイトル",
        "content": "更新後のToDoの内容",
        "status": "更新後のToDoのステータス"
      })
    });

   //////
    // todos-id:DELETE
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodoIdDelete', {
      location: {
        method: 'DELETE',
        path: todoid_path,
        type: 'METHOD',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "description": "特定のToDoを削除します。" + 
        "削除対象は、リクエスト時のパスパラメータtodo-idで指定します。" +
        "レスポンスボディには、削除したToDoのuserid, todoid, title, content, statusが含まれます。" 
      })
    });

    //todos-id:DELETE:REQUEST_HEADER
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodoIdDeleteRequestHeader', {
      location: {
        method: 'DELETE',
        path: todoid_path,
        type: 'REQUEST_HEADER',
        name: 'Authorization',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "description": "オーソライザーで払い出された認証トークン" 
      })
    });

    //todos-id:DELETE:PATH_PARAMETER 
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodoIdDeletePathParameter', {
      location: {
        method: 'DELETE',
        path: todoid_path,
        type: 'PATH_PARAMETER',
        name: "todo-id"
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "description": "削除対象のToDoのID" 
      })
    });

    //todos-id:DELETE:RESPONSE
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodoIdDeleteResponse', {
      location: {
        method: 'DELETE',
        path: todoid_path,
        statusCode: "200",
        type: 'RESPONSE',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "description": "todos-idへのDELETEリクエストが成功したことを示しています。" 
      })
    });

    //todos-id:DELETE:RESPONSE_BODY
    new apigateway.CfnDocumentationPart(this, 'DocResourceTodoIdDeleteResponseBody', {
      location: {
        method: 'DELETE',
        path: todoid_path,
        type: 'RESPONSE_BODY',
      },
      restApiId: props.todoApi.restApiId,
      properties: JSON.stringify({
        "userid": "削除したToDoを所有するユーザのID",
        "todoid": "削除したToDoのID",
        "title": "削除したToDoのタイトル",
        "content": "削除したToDoの内容",
        "status": "削除したToDoのステータス"
      })
    });



    //// Document publish
    const cfnDocumentationVersion = new apigateway.CfnDocumentationVersion(this, 'DocumentVersion', {
      documentationVersion: 'v1',
      restApiId: props.todoApi.restApiId,
    
      // the properties below are optional
      description: 'ToDo list API v1',
    });

  }
}
