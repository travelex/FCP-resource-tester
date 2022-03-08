module.exports.handle = async function (event, context) {

    var AWS = require('aws-sdk');
    AWS.config.update({ region: 'eu-west-1' });
    var s3 = new AWS.S3();
    const fs = require('fs');
    let body, pathParam;
    console.log(event);
    try {
        body = JSON.parse(event.body);
    } catch (error) {
        console.error(error);
        body = event.body;
    }
    
    try {
        pathParam = event.path;
    } catch (er){
        console.error(er);   
    }  

    let bucket = body.bucket;
    let mode = pathParam.mode;
    let inputFileName = body[mode].input.fileName;
    let inputFileLocation = body[mode].input.fileLocation;
    let detinationFileName = body[mode].destination.fileName;
    let destinationFileLocation = body[mode].destination.fileLocation;

    let inputFilePath = inputFileLocation + "/" + inputFileName;
    let destinationFilepath = destinationFileLocation + "/" + detinationFileName;

    if (mode === 'pull') {
        try {

            let fileData = fs.readFileSync(inputFilePath);
            await putObject(fileData, destinationFilepath);
            return {
                statusCode: 200,
                body: "Success",
            };
        } catch (error) {
            console.error(error);
            return {
                statusCode: 400,
                body: error.message
            };
        }
    }
    else if (mode === 'push') {
        try {
            let file = await getObject(inputFilePath);
            fs.writeFileSync(destinationFilepath, file);
            return {
                statusCode: 200,
                body: "Success",
            };

        } catch (error) {
            console.error(error);
            return {
                statusCode: 400,
                body: error.message
            };
        }
    }

    async function getObject(key) {
        try {
            var params = {
                Bucket: bucket,
                Key: key
            };
            const data = await s3.getObject(params).promise();
            return data.Body;

        } catch (error) {
            console.error(error);
        }
    }

    async function putObject(data, key) {
        try {
            var params = {
                Body: data,
                Bucket: bucket,
                Key: key
            };
            return await s3.putObject(params).promise();
        } catch (error) {
            console.log(error);
        }
    }
}
