const _ = require('underscore');
const BaseParser = require('homie-sdk/lib/Bridge/BaseParser');

/*
* conf - string, type - class type(filename)
* or
* conf = {
*   homieDataType,          - has default, optional
*   type,                   - default filename, optional, class type(filename)
*   shift                   - shift in registers
*   endian                  - 'big'/'little', set endianess of bits of registers, default 'little'
*   registersQuantity       - number of registers to use to create value, default 1. Example: registersNumber=2, resulting value: reg0<<16 + reg1
*   signed                  - true/false
* }
*
* */

class StandardInt extends BaseParser {
    constructor(conf) {
        conf = (conf === undefined) ? {} : (typeof conf === 'string') ? { type: conf } : conf;
        super(_.defaults(_.clone(conf), {
            homieDataType : 'integer',
            type          : 'standardInt'
        }));
        this.shiftBytes = conf.shiftBytes || 0;
        this.bytesQuantity = conf.bytesQuantity || 1;
        if (this.bytesQuantity > 6 || this.bytesQuantity < 1) throw new Error('bytesQuantity parameter should by from 1 to 6');
        this.shift = conf.shift || 0;
        this.bigendian = !!(conf.endian === 'big' || conf.endian === undefined);
        this.signed = conf.signed || false;
    }
    fromHomie(data) {
        const registersQuantity = Math.ceil((this.shiftBytes + this.bytesQuantity)/2);

        const buf = new Buffer.alloc(registersQuantity*2);

        buf[`write${this.signed ? '' : 'U'}Int${this.bigendian ? 'BE' : 'LE'}`](data, this.shiftBytes, this.bytesQuantity);

        const arr = [];

        // eslint-disable-next-line more/no-c-like-loops
        for (let i=0; i < registersQuantity; ++i) arr.push(buf.slice(i*2, (i+1)*2));

        return [ arr, this.shift ];
    }
    toHomie(data) {
        const registersQuantity = Math.ceil((this.shiftBytes + this.bytesQuantity)/2);
        const buf = Buffer.concat(data.slice(this.shift, this.shift+registersQuantity));

        return `${buf[`read${this.signed ? '' : 'U'}Int${this.bigendian ? 'BE' : 'LE'}`](this.shiftBytes, this.bytesQuantity)}`;
    }
}

module.exports = StandardInt;
