const mssql = require('mssql');
const retryLength = 5;

class MSSQLQuery {
    constructor(event) {
        this.event = event;
    }

    async getConnectionAndExecute() {
        return new Promise(async (resolve, reject) => {
            try {
                const message = this.event;

                const sqlConfig = {
                    user: message.dbConfig.username,
                    password: message.dbConfig.password,
                    database: message.dbConfig.dbName,
                    server: message.dbConfig.host,
                    stream: true,
                    pool: {
                        max: 10,
                        min: 0,
                        idleTimeoutMillis: 30000
                    },
                    connectionTimeout: 120000,
                    requestTimeout: 120000,
                    options: {
                        tdsVersion: "7_1",
                        enableArithAbort: true
                    }
                };

                // Retry mechanism
                let pool = null;
                for (let index = 0; index <= retryLength; index++) {
                    try {
                        pool = new mssql.ConnectionPool(sqlConfig);
                        await pool.connect();
                        const request = pool.request();
                        let result = await request.query(message.query);
                        console.log('Query has been successfully executed');
                        await pool.close();
                        resolve(result);
                        break;
                    } catch (error) {
                        await pool.close();
                        console.log('Exception', error);
                        console.log('Retry attempt', index);
                        if (index === retryLength) throw new Error(error.message);
                    }
                }
            } catch (error) {
                console.log('Exception occurred while establishing connection', error.message);
                reject(error);
            }
        });
    }
}

module.exports = MSSQLQuery;