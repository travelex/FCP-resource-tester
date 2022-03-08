const RequestHandler = require('../adapter-utils/RequestHandler');
const {
    logger
} = require('./index');

let requestHandler = new RequestHandler();

module.exports = class Engine {
    /**
     * Handles screening request
     * @param {XMLDocument} event Request from client wiht XML body 
     */
    async run(event) {
        try {
            return await requestHandler.process(event.body);
        } catch (error) {
            logger.error( error);
            return error;
        }
    }
};