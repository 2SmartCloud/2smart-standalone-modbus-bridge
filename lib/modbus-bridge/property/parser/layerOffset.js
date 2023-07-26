const _ = require('underscore');
const BaseParser = require('homie-sdk/lib/Bridge/BaseParser');
const { create: createParser } = require('.');

/*
* conf - string, type - class type(filename)
* or
* conf = {
*   homieDataType,          - has default, optional
*   type,                   - default filename, optional, class type(filename)
*   dataTypeBridge          - object for interger data type
*   offset                  - offset value
* }
*
* */

class LayerOffset extends BaseParser {
    constructor(conf) {
        conf = (conf === undefined) ? {} : (typeof conf === 'string') ? { type: conf } : conf;
        super(_.defaults(_.clone(conf), {
            homieDataType : 'float',
            type          : 'layerOffset'
        }));
        this.dataTypeBridge = createParser(conf.dataTypeBridge);
        this.offset = conf.offset;
    }
    fromHomie(data) {
        return this.dataTypeBridge.fromHomie(parseFloat(data)-this.offset);
    }
    toHomie(data) {
        return `${parseFloat(this.dataTypeBridge.toHomie(data))+this.offset}`;
    }
}

module.exports = LayerOffset;
