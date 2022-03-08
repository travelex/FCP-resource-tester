# middleware-resource-tester
This repository is for Middleware Transformation project. 
These lambdas are mainly used to test the AWS resources used in the project.

To test if database is getting connected with particular username and password on **mssql database** use **vpn-telnet-test-dbCheck** lambda with following input json structure
```{
    "dbConfig": {
        "server": "server ip",
        "database": "dbname",
        "user": "dbuser",
        "password": "dbpassword",
        "port": db port number if not specified default 1433 is considered,
        "options": {
            "tdsVersion": "7_1",
            "instanceName": "abc"
        }
    },
    "executeQuery": true,//if this set as false default query select getDate() will get execute.
    "query": "select top 1 * from site"
}
```
#   F C P - r e s o u r c e - t e s t e r  
 