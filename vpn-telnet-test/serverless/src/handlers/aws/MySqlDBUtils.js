const mysql = require('mysql')
const AWS = require('aws-sdk')

class MySqlDBUtils {
    static mysql_create_conection(props) {
        let connectProps = {
            host: props.host,
            user: props.user,
            password: props.password
        }
        if (props.database) {
            connectProps.database = props.database
        }
        if (props.queryfile || props.query) {
            connectProps.multipleStatements = true
        }
        var connection = mysql.createConnection(connectProps);
        //connection.end()
        return connection
    }

    static async executeQuery(connection, query) {
        return new Promise((resolve, reject) => {
            connection.query(query, function (error, results, fields) {
                if (error) {
                    reject(error)
                }
                else {
                    resolve({
                        "results": results,
                        "fields": fields
                    })
                }
            });
        })

    }

    static async checkConnection(props) {
        try {
            let connection = this.mysql_create_conection(props)
            await this.connectToDB(connection)
            await this.closeConnection(connection)
        } catch (error) {
            throw error
        }
    }

    static async checkQuery(props) {
        try {
            let connection = this.mysql_create_conection(props)
            await this.connectToDB(connection)
            const S3 = new AWS.S3({
            })
            let query = props.query

            if (props.queryfile) {
                query = await S3.getObject({
                    Bucket: props.queryfile.bucket,
                    "Key": props.queryfile.filePath
                }).promise()
                query = query.Body.toString();
                console.log("Query From File = " + query)
            }
            console.log("Executing Query -> " + query)
            let result = await this.executeQuery(connection, query);
            console.log('result');
            console.log(result);
            await this.closeConnection(connection)
            return result
        } catch (error) {
            throw error
        }
    }

    static async connectToDB(connection) {
        return new Promise((resolve, reject) => {
            connection.connect((err) => {
                if (err) {
                    console.error("Error while connecting DB ")
                    reject(err)
                }
                else {
                    console.log("DB Connected Successfuly ")
                    resolve("Connected ")
                }
            })
        })
    }

    static async closeConnection(connection) {
        return new Promise((resolve, reject) => {
            connection.end((err) => {
                if (err) {
                    console.error("Error while Closing Connection  DB ")
                    reject(err)
                }
                else {
                    console.log("DB Connection Closed  Successfuly ")
                    resolve("Closed")
                }
            })
        })
    }
}
module.exports = MySqlDBUtils