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
*   precision               - precision value
* }
*
* */

class LayerPrecision extends BaseParser {
    constructor(conf) {
        conf = (conf === undefined) ? {} : (typeof conf === 'string') ? { type: conf } : conf;
        super(_.defaults(_.clone(conf), {
            homieDataType : 'float',
            type          : 'layerPrecision'
        }));
        this.dataTypeBridge = createParser(conf.dataTypeBridge);
        this.precision = conf.precision || 0;
    }
    fromHomie(data) {
        return this.dataTypeBridge.fromHomie(data);
    }
    toHomie(data) {
        return `${parseFloat(this.dataTypeBridge.toHomie(data)).toFixed(this.precision)}`;
    }
}

module.exports = LayerPrecision;
