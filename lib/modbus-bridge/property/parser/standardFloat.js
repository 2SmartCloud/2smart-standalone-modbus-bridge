const _ = require('underscore');
const BaseParser = require('homie-sdk/lib/Bridge/BaseParser');

/*
* conf - string, type - class type(filename)
* or
* conf = {
*   homieDataType,          - has default, optional
*   type,                   - default filename, optional, class type(filename)
*   shift                   - shift in registers
*   signed                  - true/false
*   endian                  - 'big'/'little', set endianess of bits of registers, default 'little'
* }
*
* */

class StandardFloat extends BaseParser {
    constructor(conf) {
        conf = (conf === undefined) ? {} : (typeof conf === 'string') ? { type: conf } : conf;
        super(_.defaults(_.clone(conf), {
            homieDataType : 'float',
            type          : 'standardFloat'
        }));
        this.precision = conf.precision || 0;
        this.shift = conf.shift || 0;
        this.bigendian = !!(conf.endian === 'big' || conf.endian === undefined);
    }
    fromHomie(data) {
        const buf = new Buffer.alloc(4);

        buf[`writeFloat${this.bigendian ? 'BE' : 'LE'}`](data, 0);

        const arr = [];

        // eslint-disable-next-line more/no-c-like-loops
        for (let i=0; i < 2; ++i) arr.push(buf.slice(i*2, (i+1)*2));

        return [ arr, this.shift ];
    }
    toHomie(data) {
        const buf = Buffer.concat(data.slice(this.shift, this.shift+2));

        return `${buf[`readFloat${this.bigendian ? 'BE' : 'LE'}`](0).toFixed(this.precision)}`;
    }
}

module.exports = StandardFloat;
