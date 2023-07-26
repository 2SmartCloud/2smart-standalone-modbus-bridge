const _ = require('underscore');
const Buffer = require('../../../modbus-stream/lib/buffer');
const BaseParser = require('./index');

/*
* conf - string, type - class type(filename)
* or
* conf = {
*   homieDataType,          - has default, optional
*   type,                   - default filename, optional, class type(filename)
*   endian                  - 'big'/'little', set endianess of bits of registers, default 'little'
*   registersQuantity       - number of registers to use to create value, default 1. Example: registersNumber=2, resulting value: reg0<<16 + reg1
* }
* */

class NumberToRegisterArray extends BaseParser {
    constructor(conf) {
        conf = (conf === undefined) ? {} : (typeof conf === 'string') ? { type: conf } : conf;
        super(_.defaults(_.clone(conf), {
            homieDataType : 'integer',
            type          : 'numberToBufferArray'
        }));
        if (conf.endian) if (conf.endian !== 'little' && conf.endian !== 'big') throw new Error(`Wrong endian type ${conf.edian}`);
        this.bigendian = !!(conf.endian === 'big' || conf.endian === undefined);
        this.registersQuantity = conf.registersQuantity || 1;
        this.signed = conf.signed || false;
    }
    // eslint-disable-next-line no-unused-vars
    fromHomie(data) {
        throw new Error('Abstract method NumberToBufferArrayParser.fromHomie.');
    }
    // eslint-disable-next-line no-unused-vars
    toHomie(data) {
        throw new Error('Abstract method NumberToBufferArrayParser.toHomie.');
    }
    integerToRegisters(number) {
        if (this.signed && number<0) {
            // eslint-disable-next-line no-undef
            number += Number(1n << (BigInt(this.registersQuantity)*16n));
        }
        // eslint-disable-next-line no-undef
        number = BigInt(number);
        let arr = new Array(this.registersQuantity);

        // eslint-disable-next-line more/no-c-like-loops
        for (let i=0; i<this.registersQuantity; i++) {
            // eslint-disable-next-line no-undef
            arr[i] = this.integerToRegister(Number((number>>(BigInt(i)*16n))&0xFFFFn));
        }
        arr = arr.reverse();
        return arr;
    }
    registersToInteger(registers) {
        registers = registers.reverse();
        let number = 0;

        // eslint-disable-next-line more/no-c-like-loops
        for (let i=0; i<this.registersQuantity; i++) {
            // eslint-disable-next-line no-undef
            number += Number(BigInt(this.registerToInteger(registers[i]))<<(BigInt(i)*16n));
        }
        if (this.signed && (registers[0][0]>>7)&1) {
            // eslint-disable-next-line no-undef
            number -= Number(1n << (BigInt(this.registersQuantity)*16n));
        }
        return number;
    }
    integerToRegister(number) {
        let arr = [ (number>>8)&0xFF, number&0xFF ];

        if (!this.bigendian) arr = arr.reverse();
        return Buffer.from(arr);
    }
    registerToInteger(buffer) {
        let number;

        if (this.bigendian) {
            number = (buffer[0]<<8) + buffer[1];
        } else {
            number = (buffer[1]<<8) + buffer[0];
        }
        return number;
    }
}

module.exports = NumberToRegisterArray;
