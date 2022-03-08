const mysql = require('mysql');

class DeleteFromRds {

    static async delete(record) {
        try {

            console.log(JSON.stringify(record));
            const env = process.env.ENVIRONMENT;
            //get only the name of the file from the key
            let fullFileName = record.s3.object.key.split('/')[1].split('.')[0]; //test-delete-from-rds/DES1001PRD83YR20.DE
            let database = `eif_${env}`; //all the rts files related data is in eif_dev, eif_sit and eif_uat DBs 

            let props = {
                host: process.env.HOST,
                user: process.env.USER,
                password: process.env.PHRASE,
                port: 3306,
                database
            };
            let connection = mysql.createConnection(props);
            await this.connectToDB(connection);

            // 1st delete from eif_warehouse_event_sequencer table
            let query = `DELETE FROM eif_warehouse_event_sequencer_${env} WHERE eventName LIKE '%${fullFileName}%'`;
            console.log("Executing Query -> " + query);
            let result = await this.executeQuery(connection, query);
            console.log(`result for query executed for eif_warehouse_event_sequencer : ${JSON.stringify(result)}`);

            // 2nd delete from eif_utility_event_sequencer table
            let query2 = `DELETE FROM eif_utility_event_sequencer_${env} WHERE eventName LIKE '%${fullFileName}%'`;
            console.log("Executing Query -> " + query2);
            let result2 = await this.executeQuery(connection, query2);
            console.log(`result for query executed for eif_utility_event_sequencer : ${JSON.stringify(result2)}`);
            
            await this.closeConnection(connection);
            return true;

        } catch (error) {
            throw error;
        }
    }

    static async connectToDB(connection) {
        return new Promise((resolve, reject) => {
            connection.connect((err) => {
                if (err) {
                    console.error("Error while connecting to DB");
                    reject(err);
                } else {
                    console.log("DB connected successfuly ");
                    resolve("Connected");
                }
            });
        });
    }

    static async executeQuery(connection, query) {
        return new Promise((resolve, reject) => {
            connection.query(query, function (error, results) {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        "results": results
                    });
                }
            });
        });
    }

    static async closeConnection(connection) {
        return new Promise((resolve, reject) => {
            connection.end((err) => {
                if (err) {
                    console.error("Error while closing connection to DB");
                    reject(err);
                } else {
                    console.log("DB connection closed successfuly");
                    resolve("Closed");
                }
            });
        });
    }
}
module.exports = DeleteFromRds;