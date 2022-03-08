import os
import boto3
import botocore
import json
import requests

api_gateway_client = boto3.client('apigateway')
api_gateway_resources = api_gateway_client.get_resources(
    restApiId = os.getenv("API_GATEWAY_ID"),
    limit = 500,
)
failed_resources = []
for resource in api_gateway_resources['items']:
    if 'resourceMethods' in resource:
        for http_method in resource['resourceMethods']:
            url = os.getenv("API_GATEWAY_URL").rstrip('/') + resource["path"]
            response = getattr(requests, http_method.lower())(url)
            print("url: " + url)
            print("method: " + http_method)
            print("request headers: " + str(response.request.headers))
            print("response headers: " + str(response.headers))
            print("http status: " + str(response.status_code))
            if response.status_code not in [401, 403]:
                failed_resources.append({
                    'url': url,
                    'method': http_method,
                    'status': response.status_code,
                })

if len(failed_resources) > 0:
    print("Failed resources:")
    print(json.dumps(failed_resources, indent=4, sort_keys=True))
    raise Exception('Some resources have failed safety checks')
