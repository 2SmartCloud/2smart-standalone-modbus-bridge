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
*   max                     - max value
* }
*
* */

class LayerMin extends BaseParser {
    constructor(conf) {
        conf = (conf === undefined) ? {} : (typeof conf === 'string') ? { type: conf } : conf;
        super(_.defaults(_.clone(conf), {
            homieDataType : 'float',
            type          : 'layerMax'
        }));
        this.dataTypeBridge = createParser(conf.dataTypeBridge);
        this.precision = conf.precision || 0;
        this.max = (conf.max!==undefined && conf.max!==null)? conf.max : null;
    }
    fromHomie(data) {
        return this.dataTypeBridge.fromHomie(data);
    }
    toHomie(data) {
        return `${Math.min(this.dataTypeBridge.toHomie(data), this.max)}`;
    }
}

module.exports = LayerMin;
