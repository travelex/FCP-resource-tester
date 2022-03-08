let Engine = require('./adapter-engine/Engine');
let engine = new Engine();
let {
    logger,
    errorHandler,
    errConst
} = require('./adapter-engine/index');

process.on('uncaughtException', (error) => {
    return errorHandler.generateError(errConst.WEBSERVICE_ERROR);
});

module.exports.handleRequest = async (event, context, callback) => {
    try {
        context.callbackWaitsForEmptyEventLoop = false;
        logger.debug(`Input request ${event.body}`);
        let result = await engine.run(event);
        logger.info(`Final Response ${result}`);
        return result;
    } catch (error) {
        logger.error(error);
        return errorHandler.generateError(errConst.WEBSERVICE_ERROR);
    }
};