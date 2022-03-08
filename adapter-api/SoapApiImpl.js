const ScreeningInputDto = require('./../adapter-model/dto/ScreeningInputDto');
const StatusInputDto = require('../adapter-model/dto/StatusInputDto');
const adapterWithDuedilService = require('./../adapter-service/AdapterWithDuedilService');
const screeningTransformer = require('../adapter-transformer/ScreeningTransformer');
const statusTransformer = require('../adapter-transformer/StatusTransformer');

const {
  logger,
  errorHandler,
  errConst
} = require('../adapter-engine/index');

process.on('uncaughtException', (err) => {
  logger.error(err);
  throw errorHandler.generateError(errConst.WEBSERVICE_ERROR, err);
}).on('unhandledRejection', (err) => {
  logger.error(err);
  throw errorHandler.generateError(errConst.WEBSERVICE_ERROR, err);
});


module.exports = class SoapApiImpl {

  /**
   * Screening Endpoint
   * @param {*} args 
   * @param {*} startTime 
   */
  async getSearchResult(args, startTime) {
    try {
      logger.debug(`Screening request received : ${JSON.stringify(args.xmlinput)}`);
      let screeningInputDto = new ScreeningInputDto(args);

      logger.debug(`validateInput STARTED : ${new Date() - startTime}ms`);
      screeningInputDto = await screeningInputDto.validateInput(args);
      logger.debug(`validateInput COMPLETED ${new Date() - startTime}ms`);

      const screeningInputBo = await screeningTransformer.toBusinessObject(screeningInputDto.screeningInputJson);
      logger.info(`Screening request ready to be sent to duedil in ${(new Date() - startTime)}ms : ${JSON.stringify(screeningInputBo.screeningInputJson)}`);

      logger.debug(`Screening STARTED ${new Date() - startTime}ms`);
      const screeningResultBo = await adapterWithDuedilService.screening(screeningInputBo, startTime);
      logger.info(`Screening response from duedil in ${(new Date() - startTime)}ms : ${JSON.stringify(screeningResultBo)}`);

      logger.debug(`DTO conversion STARTED ${new Date() - startTime}ms`);

      const screeningResultDto = screeningTransformer.toDataTransferObjectSync(screeningResultBo);
      logger.info(`DTO conversion COMPLETED in ----${(new Date() - startTime)}ms---- : ${screeningResultDto.screeningResultXml}`);

      return screeningResultDto.screeningResultXml;

    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  /**
   * Status Endpoint
   * @param {String } args Soap Request Body 
   * @param {Function} [callback] Callback Function with data
   * @description This is the status end point, Gets the SOAP reqest and returns the statusesof all the transaction Id.
   */
  async getSearchResultsStatus(args, startTime) {
    try {
      logger.debug(`Status request received : ${JSON.stringify(args.xmlinput)}`);
      let statusInputDto = new StatusInputDto(args);

      logger.debug(`validateStatusInput STARTED : ${new Date() - startTime}ms`);
      statusInputDto = await statusInputDto.validateStatusInput(statusInputDto.statusInputXml);
      logger.debug(`validateStatusInput COMPLETED : ${new Date() - startTime}ms`);

      logger.debug(`toBusinessObject STARTED : ${new Date() - startTime}ms`);
      var statusInputBo = await statusTransformer.toBusinessObject(statusInputDto.statusInputJson);
      logger.info(`toBusinessObject COMPLETED, Status request ready to be sent to duedil : ${new Date() - startTime}ms : ${JSON.stringify(statusInputBo.statusInputJson)}`);

      return new Promise((resolve) => {
        logger.debug(`Status call to duedil STARTED : ${new Date() - startTime}ms`);
        adapterWithDuedilService.status(statusInputBo, (duedilError, duedilResponse) => {
          if (duedilError)
            resolve(duedilError); //resolve(converterUtils.convertJsonToXmlSync(errorHandler.throwError(duedilError)));
          logger.info(`Status response from duedil COMPLETED in :  ${new Date() - startTime}ms : ${JSON.stringify(duedilResponse)}`);
          resolve(statusTransformer.toDataTransferObjectSync(duedilResponse).statusResultXml);
        });
      });
    } catch (error) {
      logger.error(error);
      return error;
    }
  }
};