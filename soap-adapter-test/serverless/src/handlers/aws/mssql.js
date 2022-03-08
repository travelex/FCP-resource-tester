const sql = require('mssql');

const retryCount =  5;
const waitTime = 1000;

class mssqlDatabaseReader{
    constructor(userName, pwd, host, port, database, tdsVersion, pool) {
        this.username = userName;
        this.password = pwd;
        if (database != undefined)
            this.database = database;
        this.host = host;
        this.port = port;
        this.version = tdsVersion;
        this.pool = pool;
        this.connectionPool = createConnectionPool(this.username, this.password, this.host, this.port, this.database, this.version, this.pool);
    }

    /**
     * @description execute the query provided by the user and return the result
     * @param query
     * @returns {Promise<*>}
     */
    async executeQuery(query) {
        try {
            for (let count = 1; count <= retryCount; count++) {
                try {
                    console.log(`Inside executeQuery method :: executing the query ${query}`);
                    let pool = await this.connectionPool.connect();
                    const request = pool.request();
                    return await request.query(query);
                } catch (ex) {
                    if (count == retryCount) {
                        console.log(`Retry attempt exceeded to fetch records from DB with exception: ${ex}`);
                        throw ex;
                    }
                    console.log(`Retry attempt # ${count}`);
                    await sleep(waitTime);
                }
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * @description this method is used to closed the created connection
     * @returns {Promise<void>}
     */
    async closeConnection() {
        try {
            await this.connectionPool.close();
        } catch (err) {
            throw err;
        }
    }
}


/**
 * @description create a connection pool
 * @param userName
 * @param password
 * @param host
 * @param database
 * @param version
 * @param pool
 * @returns {ConnectionPool}
 */
function createConnectionPool(userName, password, host, port, database, version, pool) {
    try {
        let config = {
            user: userName,
            password: password,
            server: host,
            port: port,
            database: database,
            pool: (pool != undefined) ? pool : {
                max: 1,
                min: 1,
                idleTimeoutMillis: 30000
            }
        };

        if (version) {
            config.options = {
                tdsVersion: version
            };
        }

        return (new sql.ConnectionPool(config));

    } catch (exception) {
        throw exception;
    }

}

async function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

module.exports = mssqlDatabaseReader;