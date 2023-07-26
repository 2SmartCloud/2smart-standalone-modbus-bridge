const _ = require('underscore');
const NumberToBufferArray = require('./numberToRegisterArray');

/*
* conf - string, type - class type(filename)
* or
* conf = {
*   homieDataType,          - has default, optional
*   type,                   - default filename, optional, class type(filename)
*   registersQuantity       - number of registers to use to create value, default 1. Example: registersNumber=2, resulting value: reg0<<16 + reg1
* }
* */

class IntegerToRegisterArray extends NumberToBufferArray {
    constructor(conf) {
        conf = (conf === undefined) ? {} : (typeof conf === 'string') ? { type: conf } : conf;
        super(_.defaults(_.clone(conf), {
            homieDataType : 'integer',
            type          : 'integerToBufferArray'
        }));
        this.shift = conf.shift || 0;
        this.quantity = conf.quantity || 0;
    }
    fromHomie(data) {
        return [ super.integerToRegisters(parseInt(data, 10)), this.shift ];
    }
    toHomie(data) {
        return `${super.registersToInteger(data.slice(this.shift, this.registersQuantity))}`;
    }
}

module.exports = IntegerToRegisterArray;
