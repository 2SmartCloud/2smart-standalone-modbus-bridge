const _ = require('underscore');
const NumberToBufferArray = require('./numberToRegisterArray');

/*
* conf - string, type - class type(filename)
* or
* conf = {
*   homieDataType,          - has default, optional
*   type,                   - default filename, optional, class type(filename)
*   registersQuantity       - number of registers to use to create value, default 1. Example: registersNumber=2, resulting value: reg0<<16 + reg1
*   precision,              - default 0, optional, precision of number
*   divider                 - divider for with is pplied for conversion to Homie type, default Math.pow(10,precision);
*   min                     - min value
*   max                     - max value
* }
*
* * number has 2 registers(4 bytes), so max number is ~65k
* */

class FloatToRegisterArray extends NumberToBufferArray {
    constructor(conf) {
        conf = (conf === undefined) ? {} : (typeof conf === 'string') ? { type: conf } : conf;
        super(_.defaults(_.clone(conf), {
            homieDataType : 'float',
            type          : 'floatToBufferArray'
        }));
        this.precision = conf.precision || 0;
        // this.base = conf.base || 10;
        this.divider = conf.divider || Math.pow(10, this.precision);
        this.shift = conf.shift || 0;
        this.quantity = conf.quantity || 0;
        this.min = (conf.min!==undefined && conf.min!==null)? conf.min : null;
        this.max = (conf.max!==undefined && conf.max!==null)? conf.max : null;
    }
    fromHomie(data) {
        // return [ super.integerToBufferArray(Math.round(parseFloat(data)*Math.pow(this.base, this.precision))) ];
        return [ super.integerToRegisters(Math.round(parseFloat(data)*this.divider)), this.shift ];
    }
    toHomie(data) {
        // const number = (super.bufferArrayToInteger(data)/Math.pow(this.base, this.precision);
        const number = Math.round(super.registersToInteger(data.slice(this.shift, this.shift+this.registersQuantity))/this.divider*Math.pow(10, this.precision))/Math.pow(10, this.precision);

        if (this.min !== null && number < this.min) return '-';
        if (this.max !== null && number > this.max) return '-';

        return `${number.toFixed(this.precision)}`;
    }
}

module.exports = FloatToRegisterArray;
