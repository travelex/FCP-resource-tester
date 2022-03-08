const soap = require('soap');
const fs = require('fs');
const prettifyXml = require('prettify-xml');
const prettifyXmlOptions = {indent: 2, newline: '\n'};
const evilDns = require('evil-dns');
const mssql = require('./mssql');
const aws = require('aws-sdk');

const interfaceConfig = require("./interfaceConfig");

let requestBodyElements = [
    {
        "OrderUpdateItemList": {
            "Order_ID": "GB92770353",
            "Order_InternalID": 36150876,
            "Order_Status": 'C'
        }
    }]

const SOAP_ENDPOINT = "https://<host>/VaultNotificationService.svc"

async function getSecret(param) {
    var ssm = new aws.SSM({
        endpoint: process.env.VPC_SSM_ENDPOINT,
        region: "eu-west-1"
    });
    let request = await ssm.getParameter({
        Name: param,
        WithDecryption: true
    }).promise();
    return request.Parameter.Value;
}


async function getKeys(obj) {
    let keys = {};
    //iterating all keys present in the object i.e certificates
    for (let key in obj) {
        let keyValue = '';
        let keyValueArray = [];
        //iterating the  key value as it is an array and can have multiple value
        for (let item of obj[key]) {
            // checking if key value is Array or string
            if (Array.isArray(item)) {
                let mulCertKey = '';
                for (let mulCert of item) {
                    let certValue = await getSecret(mulCert);
                    mulCertKey += certValue;
                }
                keyValueArray.push(mulCertKey);
            } else if (typeof item === 'string') {
                let certValue = await getSecret(item);
                keyValue += certValue;
            }
        }
        keys[key] = keyValue ? keyValue : keyValueArray;
    }
    return keys;
}


function deepCopy(inObject) {
    let outObject, value, key

    if (typeof inObject !== "object" || inObject === null) {
        return inObject // Return the value if inObject is not an object
    }

    // Create an array or object to hold the values
    outObject = Array.isArray(inObject) ? [] : {}

    for (key in inObject) {
        value = inObject[key]

        // Recursively (deep) copy for nested objects, including arrays
        outObject[key] = deepCopy(value)
    }
    return outObject
}

async function invokeSoapEndpoint(event) {
    try {

        let certificates = await getKeys(event.certificates)
        let wsdl_options = deepCopy(certificates);

        let endpoint = SOAP_ENDPOINT.replace("<host>", event.host);
        console.log(`Endpoint Value :: ${endpoint}`)

        let wsdl;
        if (event.env.toLowerCase() === "prod" || event.env.toLowerCase() === "production") {
            wsdl = `${endpoint}/mex?wsdl`
        } else {
            wsdl = `${endpoint}?wsdl`
        }

        console.log(`WSDL :: ${wsdl}`);


        interfaceConfig.soap[0].operations[0].request.options.wsdl_options = wsdl_options;
        interfaceConfig.soap[0].operations[0].request.options.endpoint = endpoint;


        console.log(` $$$$$$$$$$$ Inside invokeSoapEndpoint function`)
        let response;


        //console.log(`Options :: ${JSON.stringify(interfaceConfig.soap[0].operations[0].request.options)}`)
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
        evilDns.add(event.host, event.ip);

        await soap.createClientAsync(wsdl, interfaceConfig.soap[0].operations[0].request.options).then((client) => {
            console.log("**********************************************");
            let soapClient = client;
            console.log(`@@@@@@@@@@@@@@@@ ${soapClient}`);
            soapClient.on("request", function (xml, eid) {
                console.log("@@@@@@@@@@@@@@@@@@@@@@@@");
                console.log(xml)
                console.log("@@@@@@@@@@@@@@@@@@@@@@@@");

            });
            return soapClient[interfaceConfig.soap[0].operations[0].name.concat("Async")](requestBodyElements);
        }).then((result) => {
            let formattedRequest = prettifyXml(result[3], prettifyXmlOptions);
            console.log("============= Request ===============");
            console.log(formattedRequest);
            console.log("************* Respone *************");
            let formattedResponse = prettifyXml(result[1], prettifyXmlOptions);
            console.log(formattedResponse);
            response = formattedResponse;
        });
        return response;
    } catch (err) {
        console.log(`inside catch block error :: ${err}`);
    }
}


exports.handler = async (event) => {
    console.log(`Test Event: ${JSON.stringify(event)}`)

    try {
        if (event.type && event.type.toLowerCase() == "database") {
            console.log("Creating database object")
            let db = new mssql(event.user, event.password, event.server, event.port, event.database, event.options.tdsVersion);
            console.log("executing the query ::" + event.query)
            let result = await db.executeQuery(event.query);
            console.log(`Db result :: ${JSON.stringify(result)}`);
        } else {
            return await invokeSoapEndpoint(event);
        }

    } catch (err) {
        console.log(err);
        throw err;
    }

};