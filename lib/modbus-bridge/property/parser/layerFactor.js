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
*   factor                  - factor value
* }
*
* */

class LayerFactor extends BaseParser {
    constructor(conf) {
        conf = (conf === undefined) ? {} : (typeof conf === 'string') ? { type: conf } : conf;
        super(_.defaults(_.clone(conf), {
            homieDataType : 'float',
            type          : 'layerFactor'
        }));
        this.dataTypeBridge = createParser(conf.dataTypeBridge);
        this.factor = conf.factor;
    }
    fromHomie(data) {
        return this.dataTypeBridge.fromHomie(data/this.factor);
    }
    toHomie(data) {
        return `${this.dataTypeBridge.toHomie(data)*this.factor}`;
    }
}

module.exports = LayerFactor;
