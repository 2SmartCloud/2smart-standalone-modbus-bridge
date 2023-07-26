const _ = require('underscore');
const BaseParser = require('homie-sdk/lib/Bridge/BaseParser');
const { create: createParser } = require('.');

/*
* conf - string, type - class type(filename)
* or
* conf = {
*   homieDataType,          - has default, optional
*   type,                   - default filename, optional, class type(filename)
*   shift                   - shift in registers
*   registersQuantity       - shift in registers
*   endian                  - 'big'/'little', set endianess of bits of registers, default 'little'
*   signed                  - true/false
* }
*
* */

class SumFloat extends BaseParser {
    constructor(conf) {
        conf = (conf === undefined) ? {} : (typeof conf === 'string') ? { type: conf } : conf;
        super(_.defaults(_.clone(conf), {
            homieDataType : 'float',
            type          : 'sumFloat'
        }));
        this.dataTypesBridge = (conf.dataTypesBridge || []).map(createParser);
        this.precision = conf.precision || 0;
    }
    fromHomie() {
        throw new Error('Unsupported conversion');
    }
    toHomie(data) {
        let number = 0;

        this.dataTypesBridge.forEach((dataTypeBridge) => {
            number += parseFloat(dataTypeBridge.toHomie(data));
        });

        return `${number.toFixed(this.precision)}`;
    }
}

module.exports = SumFloat;
