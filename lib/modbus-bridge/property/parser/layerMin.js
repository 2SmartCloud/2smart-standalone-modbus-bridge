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
*   min                     - min value
* }
*
* */

class LayerMin extends BaseParser {
    constructor(conf) {
        conf = (conf === undefined) ? {} : (typeof conf === 'string') ? { type: conf } : conf;
        super(_.defaults(_.clone(conf), {
            homieDataType : 'float',
            type          : 'layerMin'
        }));
        this.dataTypeBridge = createParser(conf.dataTypeBridge);
        this.precision = conf.precision || 0;
        this.min = (conf.min!==undefined && conf.min!==null)? conf.min : null;
    }
    fromHomie(data) {
        return this.dataTypeBridge.fromHomie(data);
    }
    toHomie(data) {
        return `${Math.max(this.dataTypeBridge.toHomie(data), this.min)}`;
    }
}

module.exports = LayerMin;
