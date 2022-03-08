var HashMap = require('hashmap');
var MultiHashMap = require('multi-hashmap').MultiHashMap;

var clients = new HashMap();
var xsdSchema = new HashMap();

var businessUnits = new MultiHashMap('transactionCountry', 'dept', 'businessUnit');
var searchDetail = new MultiHashMap('applicationName', 'applicationId', 'partIdPrefix', 'generateTicket', 'transformDoB');
var screeningType = new MultiHashMap('fileimage', 'screeningType');

const logger = require('../adapter-log/Logger');
const errorHandler = require('../adapter-exception/ErrorHandler');
const errConst = require('../adapter-utils/errorConstants.json');

module.exports = {
    clients: clients,
    xsdSchema: xsdSchema,
    businessUnits: businessUnits,
    searchDetail: searchDetail,
    screeningType: screeningType,
    logger: logger,
    errorHandler: errorHandler,
    errConst: errConst
};