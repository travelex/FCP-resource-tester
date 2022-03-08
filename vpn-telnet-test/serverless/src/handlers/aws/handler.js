
module.exports.telnet = function (event, context, callback) {

    console.log("telnet -> event", event)

    let connData;
    let body = undefined;
    try {
        if (event.body)
            body = JSON.parse(event.body)
    }
    catch (err) {
        body = event.body;
    }
    if (body) {
        connData = {
            port: body.port,
            host: body.host,
            timeout: 1000
        };

    }
    else {
        connData = {
            port: event.port,
            host: event.host,
            timeout: 1000
        };
    }

    // Set the default timeout to 50ms
    const timeout = typeof connData.timeout !== 'undefined' ?
        parseInt(connData.timeout) :
        50; // Fallback to 50ms
    const net = require('net');
    var message = '';

    const client = net.connect(connData, function (err, data) {
        if (err) {
            console.log("Error Occured  ", err)
            callback(err);
            client.destroy();
        }
        else {
            console.log("Data after connect ")
            message = 'Port ' + connData.port + ' on ' + connData.host + ' is open!';
            console.log(message)
            const response = {
                statusCode: 200,
                body: JSON.stringify({ message }),
            };
            client.destroy();
            callback(null, response);
            // Return some values to the caller
            //  callback(null, message);

            // We don't need it anymore

        }

    });

    // We may have host that having firewall using 'REJECT' rules
    // instead of 'DROP' packet. Amazon Security Group mostly uses the first.
    // So we need to set the timeout - if not our function will be terminated
    // by the AWS Lambda.
    // @see http://serverfault.com/questions/521359/why-do-some-connections-time-out-and-others-get-refused
    //
    // We set the timeout for 50ms (enough right?)
    client.setTimeout(timeout, function () {
        // Close it manually
        client.destroy(new Error(message), null);
    });

    client.on('error', function (err) {
        // Return error to the caller
        console.log("ERROR : ", err)
        message = 'Whoops port ' + connData.port + ' on host `' + connData.host + '` seems closed!';
        const response = {
            statusCode: 500,
            body: JSON.stringify({ message }),
        };
        client.destroy();
        callback(null, response);
    });


};

let parseEvent = (event) => {
    let request = {};
    try {
        request = JSON.parse(event);
    } catch (error) {
        request = event;
    };
    return request;
}

module.exports.mssqlExecuteQuery = async (event, context) => {
    try {
        let request = parseEvent(event);
        let MSSQLQuery = require('./MSSQLQuery');
        let result = await new MSSQLQuery(request).getConnectionAndExecute();
        return {
            statusCode: 200,
            body: JSON.stringify(result),
        };
    } catch (error) {
        console.log('Exception occurred', error);
        return {
            statusCode: 500,
            body: error.message,
        };
    }
}

module.exports.dbCheck = async (event, context) => {

    //console.log("dbconnectivity -> event", event)

    let connData;
    let data;

    if (event.body) {
        //  let body = JSON.parse(event.body);
        // connData = {
        //     server: body.host,
        //     database: body.dnName,
        //     user: body.username,
        //     password: body.passphrase,
        //     port: body.port ? body.port : 1433,
        //     options: {
        //         tdsVersion: body.tdsVersion ? body.tdsVersion : '7_1'
        //     }
        // };

        let body = JSON.parse(event.body);
        connData = body.dbConfig
        data = body;
    }
    else {
        // connData = {
        //     server: event.host,
        //     database: event.dnName,
        //     user: event.username,
        //     password: event.passphrase,
        //     port: event.port ? event.port : 1433,
        //     options: {
        //         tdsVersion: event.tdsVersion ? event.tdsVersion : '7_1'
        //     }
        // };

        connData = event.dbConfig
        data = event;
    }
    console.log("TCL: module.exports.dbCheck -> connData", connData)
    console.log("TCL: executeQuery-> connData", data.executeQuery)
    console.log("TCL: data", JSON.stringify(data))

    var sql = require('mssql');
    let response;
    try {
        //let pool = await sql.connect('mssql://' + connData.username + ':' + connData.passphrase + '@' + connData.host + '/' + connData.dnName)
        let pool = await sql.connect(connData);
        console.log("TCL: sql", pool)
        let result;
        if (data.executeQuery)
            result = await sql.query(data.query);
        else
            result = await sql.query`select getDate()`

        console.log("TCL: result", result)
        response = {
            statusCode: 200,
            body: JSON.stringify({ result }),
        };
    } catch (err) {
        console.log("TCL: err", err)
        response = {
            statusCode: 200,
            body: JSON.stringify({ err }),
        };
    } finally {
        await sql.close();
        return response;
    }


    //callback(null, response);
};

module.exports.mysqlExecuteQuery = async (event, context) => {
    try {
        console.log("mysql -> event", event)
        const mySqlDBUtils = require('./MySqlDBUtils')
        let props = {}
        if (event.body) {
            let body = JSON.parse(event.body);
            props = {
                host: body.host,
                user: body.user,
                password: body.password,
                database: body.database,
                query: body.query,
                // queryfile:{
                //     "bucket":body.queryfile.bucket,
                //     "filePath":body.queryfile.filePath
                // }
            };
            if (body.queryfile) {
                props.queryfile = body.queryfile
            }
        }
        else {
            props = {
                host: event.host,
                user: event.user,
                password: event.password,
                database: event.database,
                query: event.query,
                // queryfile:{
                //     "bucket":event.queryfile.bucket,
                //     "filePath":event.queryfile.filePath
                // }

            };
            if (event.queryfile) {
                props.queryfile = event.queryfile
            }
        }
        let response = undefined
        if (props.query || props.queryfile) {
            let result = await mySqlDBUtils.checkQuery(props)
            response = {
                statusCode: 200,
                body: JSON.stringify({ result }),
            };
        }
        else {
            let result = await mySqlDBUtils.checkConnection(props)
            response = {
                statusCode: 200,
                body: JSON.stringify({ result }),
            };
        }
        return response
    } catch (error) {
        console.error("Error while executing query", error)
        throw error
    }
};

module.exports.mssqlInstanceCheck = async (event, context) => {

    //console.log("dbconnectivity -> event", event)

    let config;

    if (event.body) {
        console.log("in if");
        let body = JSON.parse(event.body);
        config = {
            server: body.host,
            database: body.dbName,
            user: body.username,
            password: body.password,
            pool: {
                max: 1,
                min: 1
            },
            options: {
                instanceName: 'BCC_TAS',
                tdsVersion: '7_1'
            }
        };
    }
    else {
        console.log("in else");
        if (event.port) {
            console.log("in port");
            config = {
                server: event.host,
                database: event.dbName,
                user: event.username,
                password: event.password,
                connectionTimeout: 70000,
                port: event.port,
                pool: {
                    max: 1,
                    min: 1
                },
                options: {
                    instanceName: 'BCC_TAS',
                    tdsVersion: '7_1'
                }
            };
        }
        else if (event.instace) {
            console.log("in instance");
            config = {
                server: event.host,
                database: event.dbName,
                user: event.username,
                password: event.password,
                connectionTimeout: 70000,
                pool: {
                    max: 1,
                    min: 1
                },
                options: {
                    instanceName: event.instace,
                    tdsVersion: '7_1'
                }
            };
        }
        else {
            config = {
                server: event.host,
                database: event.dbName,
                user: event.username,
                password: event.password,
                connectionTimeout: 70000,
                pool: {
                    max: 1,
                    min: 1
                },
                options: {
                    tdsVersion: '7_1'
                }
            };
        }
    }
    console.log("config : ", JSON.stringify(config));

    var sql = require('mssql');
    const evilDns = require('evil-dns');

    var pool2;

    let response;
    try {
        evilDns.add('UKPBDRMDEV2', '10.234.3.59');
        pool2 = new sql.ConnectionPool(config);
        console.log("pool : ", JSON.stringify(pool2));
        const pool2Connect = pool2.connect();
        await pool2Connect;

        const result = await pool2.query`select * from shifts where shiftId = 1 and dayendyear = 2014 and tillid = 21`
        console.log("result : ", JSON.stringify(result));
        response = {
            statusCode: 200,
            body: JSON.stringify({ result }),
        };
    } catch (err) {
        console.log("error : ", err)
        response = {
            statusCode: 200,
            body: JSON.stringify({ err }),
        };
    }
    finally {
        console.log("In finally block");
        if (pool2)
            pool2.close();
    }
    return response;
}

//this new lambda function is used to help delete specific RTS event data from the RDS
//this was needed as during testing some times we needed to clear the alreay present data for the same file that was been processed 
module.exports.deleteFromRDS = async (event, context) => {
    try {
        console.log("deleteFromRds -> event", event)
        let record;
        if (event && event.Records) {
            record = event.Records[0];
        }
        const deleteFromRds = require('./deleteFromRds');
        let result = await deleteFromRds.delete(record)
        return {
            statusCode: 200,
            body: JSON.stringify({ result }),
        };
    } catch (error) {
        console.error("Error while executing query", error)
        throw error
    }
};



module.exports.restAPICall = async (event, context) => {
    try {

        process.on('uncaughtException', function(err) {
            console.log('###################')
        console.log(err)
        })


        const RestAPI = require('./RestAPI')
        let options = null;
        if (event.body) {
            const body = JSON.parse(event.body);
            options = body.options
        } else {
            options = event.options
        }
        console.log(`type of Option : ${ typeof options}`)
        console.log(` Options : ${  options}`)
        console.log(` Options : ${ JSON.stringify( options)}`)
        const response = await RestAPI.execute(options);
        console.log('response response')
        console.log(response);
        console.log('response type')
        console.log(typeof response);

        return {
            statusCode: 200,
            body: typeof (response) == 'object'? JSON.stringify({ response }) : response
        };
    } catch (error) {
        console.log('Exception occurred', error);
        return {
            statusCode: 500,
            body: error.message,
        };
    }
}

