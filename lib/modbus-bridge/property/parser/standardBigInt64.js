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
* }
*
* */

class StandardBigInt64 extends BaseParser {
    constructor(conf) {
        conf = (conf === undefined) ? {} : (typeof conf === 'string') ? { type: conf } : conf;
        super(_.defaults(_.clone(conf), {
            homieDataType : 'integer',
            type          : 'standardBigInt64'
        }));
        this.shift = conf.shift || 0;
        this.bigendian = !!(conf.endian === 'big' || conf.endian === undefined);
        this.signed = conf.signed || false;
    }
    fromHomie(data) {
        const buf = new Buffer.alloc(8);

        // eslint-disable-next-line no-undef
        buf[`writeBig${this.signed ? '' : 'U'}Int64${this.bigendian ? 'BE' : 'LE'}`](BigInt(data), 0);

        const arr = [];

        // eslint-disable-next-line more/no-c-like-loops
        for (let i=0; i < 4; ++i) arr.push(buf.slice(i*2, (i+1)*2));

        return [ arr, this.shift ];
    }
    toHomie(data) {
        const buf = Buffer.concat(data.slice(this.shift, this.shift+4));

        return `${buf[`readBig${this.signed ? '' : 'U'}Int64${this.bigendian ? 'BE' : 'LE'}`](0)}`;
    }
}

module.exports = StandardBigInt64;
