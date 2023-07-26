const BasePropertyBridge = require('homie-sdk/lib/Bridge/BaseProperty');
const BaseParser = require('homie-sdk/lib/Bridge/BaseParser');
const { create: createParser } = require('./parser');

class PropertyBridge extends BasePropertyBridge {
    /* {
     config,
     { type, transport, parser }
    } */
    constructor(config, { type, transport, parser, debug }) {
        if (parser === undefined) parser = config.dataTypeBridge;
        if (!(parser instanceof BaseParser)) parser = createParser(parser);
        super(config, { type, transport, parser, debug });

        // handlers
    }
    // sync
    // async
    // handlers~
    // ~handlers
}

module.exports = PropertyBridge;
