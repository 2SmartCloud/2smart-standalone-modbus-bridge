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
*   precision,              - default 0, optional, precision of number
*   divider                 - divider for with is pplied for conversion to Homie type, default Math.pow(10,precision);
*   min                     - min value
*   max                     - max value
* }
*
* */

class LayerFloat extends BaseParser {
    constructor(conf) {
        conf = (conf === undefined) ? {} : (typeof conf === 'string') ? { type: conf } : conf;
        super(_.defaults(_.clone(conf), {
            homieDataType : 'float',
            type          : 'layerFloat'
        }));
        this.dataTypeBridge = createParser(conf.dataTypeBridge);
        this.precision = conf.precision || 0;
        // this.base = conf.base || 10;
        this.divider = conf.divider || Math.pow(10, this.precision);
        this.min = (conf.min!==undefined && conf.min!==null)? conf.min : null;
        this.max = (conf.max!==undefined && conf.max!==null)? conf.max : null;
    }
    fromHomie(data) {
        return this.dataTypeBridge.fromHomie(Math.round(parseFloat(data)*this.divider));
    }
    toHomie(data) {
        const number = Math.round(this.dataTypeBridge.toHomie(data)/this.divider*Math.pow(10, this.precision))/Math.pow(10, this.precision);

        if (this.min !== null && number < this.min) return '-';
        if (this.max !== null && number > this.max) return '-';

        return `${number.toFixed(this.precision)}`;
    }
}

module.exports = LayerFloat;
