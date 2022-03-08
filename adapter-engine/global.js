if (global.isLoadCompleted === undefined) {
    require('../Loader');
}

var xsds = global.xsdSchema;
let environment = process.env.ENVIRONMENT;

global.ssmParametersHashMap = loadParams();
let ssmParametersHashMap = global.ssmParametersHashMap;

async function loadParams() {
    if (global.ssmParametersHashMap === undefined) {
        return await global.ssmParameters();
    }
    return global.ssmParametersHashMap;
}

const serviceConfig = require('../adapter-config/service-config.json');
var getSearchResultsInputXsd = xsds.get('xsd').get('getsearchresultsinput.xsd');
var getSearchResultsOutputXsd = xsds.get('xsd').get('getsearchresultsoutput.xsd');
var getSearchResultsStatusInputXsd = xsds.get('xsd').get('getsearchresultsstatusinput.xsd');
var getSearchResultsStatusOutputXsd = xsds.get('xsd').get('getsearchresultsstatusoutput.xsd');


module.exports = {
    getSearchResultsInputXsd,
    getSearchResultsOutputXsd,
    getSearchResultsStatusInputXsd,
    getSearchResultsStatusOutputXsd,
    serviceConfig,
    environment,
    ssmParametersHashMap
};