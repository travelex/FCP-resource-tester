module.exports.handle = function (event, context, callback) {

    var AWS = require('aws-sdk');
    AWS.config.update({ region: 'eu-west-1' });
    var s3 = new AWS.S3();
    var SMB2 = require('smb2');
    let body, pathParam;

    console.log('Event Received');
    try {
        body = JSON.parse(event.body);
    } catch (error) {

        body = event.body;
    }

    let mode;

    if (event.path) {
        console.log("path", event.path)
        try {
            let index = event.path.lastIndexOf('/');
            mode = event.path.substring(index + 1, event.path.length);
        } catch (exception) {
            console.log("mode", event.path.mode)
            mode = event.path.mode
        }

    }

    let bucket = body.bucket;

    let username = body.username;
    let password = body.password;
    let domain = body.domain;
    let sharedDrive = body.sharedDrive;
    let port = body.port || 445;
    console.log(body[mode])
    let inputFileName = body[mode].input.fileName;
    let inputFileLocation = body[mode].input.fileLocation;

    let detinationFileName = body[mode].destination.fileName;
    let destinationFileLocation = body[mode].destination.fileLocation;

    let inputFilePath;
    let destinationFilepath;
    let response;

    if (mode === 'pull') {
        console.log('Entered Pull');
        inputFilePath = inputFileLocation + "\\" + inputFileName;
        destinationFilepath = destinationFileLocation + "/" + detinationFileName;
        console.log('Create SMB CLient');
        let smb2Client = new SMB2({
            share: sharedDrive
            , domain: domain
            , username: username
            , password: password
            , port: port
            , debug: true
        });
        console.log('SMB Client  Created');
        // smb2Client.readdir(inputFileLocation,(err,data  )=>{
        //     if(err){
        //         console.log("Error ")
        //     }else{
        //         console.log("data ",data)
        //     }
        // })
        smb2Client.readFile(inputFilePath, function (err, file) {
            if (err) {
                console.error('SMB: Error reading file ' + err);
                response = {
                    statusCode: 500,
                    body: JSON.stringify({
                        message: err
                    }),
                };
                callback(null, response);
            } else {
                console.log('SMB Read File successful');
                var params = {
                    Body: file,
                    Bucket: bucket,
                    Key: destinationFilepath
                };
                s3.putObject(params, function (err, data) {
                    if (err) {
                        console.error('S3: error uploading object' + err);
                        response = {
                            statusCode: 500,
                            body: JSON.stringify({
                                message: err
                            })
                        };
                        callback(null, response);
                    } else {
                        console.log("File Saved" + data);
                        response = {
                            statusCode: 200,
                            body: JSON.stringify({
                                message: "File Saved to S3"
                            }),
                        };
                        callback(null, response);
                    }

                });
            }

        });

    }
    else if (mode === 'push') {
        console.log('Entered push');
        inputFilePath = inputFileLocation + "/" + inputFileName;
        destinationFilepath = destinationFileLocation + "\\" + detinationFileName;
        console.log('Create SMB client ');
        let smb2Client = new SMB2({
            share: sharedDrive
            , domain: domain
            , username: username
            , password: password
            , port: port
            , debug: true
        });
        console.log('SMB client created');

        let params = {
            Bucket: bucket,
            Key: inputFilePath
        };
        s3.getObject(params, function (err, data) {
            if (err) {
                console.error('s3: Error getting object ' + err);
                response = {
                    statusCode: 500,
                    body: JSON.stringify({
                        message: err
                    })
                };
                callback(null, response);
            } else {
                console.log('Successful read from s3');
                smb2Client.writeFile(destinationFilepath, data.Body, function (err) {
                    if (err) {
                        console.error('SMB:Error writing file ' + err);
                        response = {
                            statusCode: 500,
                            body: JSON.stringify({
                                message: err
                            })
                        };
                        callback(null, response);
                    }
                    else {
                        console.log('SMB Write File successful');
                        response = {
                            statusCode: 200,
                            body: JSON.stringify({
                                message: "File Saved to on-prem"
                            })
                        };
                        callback(null, response);
                    }

                });
            }
        });
    }
}
