var fs = require('fs');
var path = require('path');
var serviceConfig = require('./adapter-config/service-config');

var {
    errConst,
    logger,
    errorHandler
} = require('./adapter-engine');

var HashMap = require('hashmap');
var MultiHashMap = require('multi-hashmap').MultiHashMap;
var clients = new HashMap();
let clientCredentials = new HashMap();
var xsdSchema = new HashMap();

var businessUnits = new MultiHashMap('transactionCountry', 'dept', 'businessUnit');

var searchDetail = new MultiHashMap('applicationName', 'applicationId', 'partIdPrefix', 'generateTicket', 'transformDoB', 'defaultDateFormat', 'isHyphen');

var screeningType = new MultiHashMap('fileimage', 'screeningType');
var clientCredentialMultiHashMap = new MultiHashMap(['source', 'country'], ['username', 'password']);


var rootPath = serviceConfig.clientFolderRootPath;
var lookupFolderPath = serviceConfig.lookupFolderRootPath;
var xsdSchemaPath = serviceConfig.xsdFolderPath;

let environment = process.env.ENVIRONMENT;

var PropertyLoader = require('./adapter-engine/PropertyLoader');

let propertyLoader = new PropertyLoader(environment);
var lookups = {
    businessUnits: null,
    searchDetails: null,
    screeningTypes: null
};

process.on('uncaughtException', (err) => {
    logger.error(err);
    throw errorHandler.generateError(errConst.WEBSERVICE_ERROR, err);
}).on('unhandledRejection', (err) => {
    logger.error(err);
    throw errorHandler.generateError(errConst.WEBSERVICE_ERROR, err);
});

/**
 * Loads all the static data and aws ssm parameters in Hashmap
 */
function SingletonLoader() {
    try {
        (function () {
            logger.info('Loading clients folder');
            var clientsFolders = fs.readdirSync(rootPath);
            clientsFolders.forEach(clientFolder => { //Salt, FOxWeb, ACE etc
                clients.set(clientFolder, new HashMap()); //FoxWeb

                if (fs.statSync(path.join(rootPath, clientFolder)).isDirectory()) {
                    let folderPath = path.join(rootPath, clientFolder);
                    fs.readdirSync(folderPath).forEach(subFolder => { //  transfeormers folder
                        let fromPath = path.join(folderPath, subFolder);
                        if (fs.statSync(fromPath).isDirectory()) {
                            clients.get(clientFolder).set(subFolder, new HashMap());
                            let filePath = path.join(folderPath, subFolder);
                            fs.readdirSync(filePath).forEach(file => { //files
                                let fromPath = path.join(filePath, file);
                                if (fs.statSync(fromPath).isFile()) {
                                    clients.get(clientFolder).get(subFolder).set(file, fromPath);
                                }
                            });
                        }
                    });
                }
            });
        })();

        (function () {
            logger.info('Loading lookup folders....');
            try {
                let lookupFolder = fs.readdirSync(lookupFolderPath);
                lookupFolder.forEach(function (file) { // lookup, transfeormers folder
                    var fromPath = path.join(lookupFolderPath, file);
                    var stat = fs.statSync(fromPath);
                    if (stat.isFile()) {
                        if (file == 'search-details.json') {
                            let searchDetails = require(path.join(__dirname, fromPath));
                            for (let i = 0; i < searchDetails.length; i++) {

                                searchDetail.insert(searchDetails[i].applicationName.toUpperCase(), searchDetails[i].applicationId, searchDetails[i].partIdPrefix, searchDetails[i].generateTicket, searchDetails[i].transformDoB, searchDetails[i].defaultDateFormat, searchDetails[i].isHyphen);

                            }
                        } else if (file == 'business-units.json') {
                            let businessUnit = require(path.join(__dirname, fromPath));
                            if (businessUnit) {
                                businessUnit.forEach(credential => {
                                    businessUnits.insert(credential.trancationCountry.toUpperCase(), credential.dept.toUpperCase(), credential.businessUnit);
                                });
                            }
                        } else if (file == 'screen-type.json') {
                            let screeningTypes = require(path.join(__dirname, fromPath));
                            for (let i = 0; i < screeningTypes.length; i++) {
                                screeningType.insert(screeningTypes[i].FILEIMG.toUpperCase(), screeningTypes[i].screeningType);
                            }
                        }
                    }
                });

                lookups = {
                    businessUnits: businessUnits,
                    searchDetails: searchDetail,
                    screeningTypes: screeningType
                };
                return lookups;

            } catch (error) {
                logger.error(error);
                throw errorHandler.generateError(errConst.WEBSERVICE_ERROR, error);
            }
        })();

        (function () {
            try {
                let lookupFolder = fs.readdirSync(xsdSchemaPath);
                xsdSchema.set('xsd', new HashMap());
                lookupFolder.forEach(function (file) { // lookup, transfeormers folder
                    var fromPath = path.join(xsdSchemaPath, file);
                    if (fs.statSync(fromPath).isFile())
                        xsdSchema.get('xsd').set(file, fs.readFileSync(fromPath));

                });
                return xsdSchema;
            } catch (error) {
                logger.error(error);
                throw errorHandler.generateError(errConst.WEBSERVICE_ERROR, error);
            }
        })();

        global.clients = clients;
        global.lookups = lookups;
        global.xsdSchema = xsdSchema;

        /**
         * Gets the AWS SSM Parameters(clientcert, privatekey, usersetup)
         */
        let ssmParameters = function () {
            logger.info('Loading SSM parameters....');
            try {
                return new Promise(async (resolve, reject) => {
                    let clients = global.clients.keys();
                    let params = {
                        Names: [process.env.API_CERT, process.env.API_KEY],
                        WithDecryption: true
                    };
                    clients.forEach(client => {
                        params.Names.push(`${environment}.${client}.usersetup`);
                    });
                    let ssmParameteres = await propertyLoader.loadAllKeys(params);

                    if (ssmParameteres) {
                        for (let j = 0; j < ssmParameteres.Parameters.length; j++) {
                            if (ssmParameteres.Parameters[j].Name.match('usersetup')) {
                                logger.debug('SSM Parameters', ssmParameteres);
                                let countryWiseCredentials = (ssmParameteres.Parameters[j].Value.split(','));
                                if (countryWiseCredentials) {
                                    countryWiseCredentials.forEach(credential => {
                                        let countryWiseCredential = credential.split(':');
                                        clientCredentialMultiHashMap.insert(countryWiseCredential[0], countryWiseCredential[1], countryWiseCredential[2], countryWiseCredential[3]);
                                    });
                                }
                            } else clientCredentials.set(ssmParameteres.Parameters[j].Name, ssmParameteres.Parameters[j].Value);
                        }
                        resolve(clientCredentialMultiHashMap);
                    } else reject(errorHandler.webServiceError('SSM Parameter not found'));
                });
            } catch (error) {
                logger.error(error);
                throw errorHandler.generateError(errConst.WEBSERVICE_ERROR, error);
            }
        };
        global.ssmParameters = ssmParameters;
        global.clientCredentials = clientCredentials;
        global.clientCredentialMultiHashMap = clientCredentialMultiHashMap;
        global.isLoadCompleted = true;

    } catch (error) {
        logger.error(error);
        throw errorHandler.generateError(errConst.WEBSERVICE_ERROR, error);
    }
}
module.exports = new SingletonLoader();