var PropertyReader = require('../adapter-utils/PropertyReader');

module.exports = class PropertyLoader {
    constructor(environment) {
        this.propertyReader = new PropertyReader();
        this.environment = environment;
    }

    async loadSingleKey(key) {
        return await this.propertyReader.getKey(key);
    }

    async loadAllKeys(params) {
        return await this.propertyReader.getKeys(params);
    }
};