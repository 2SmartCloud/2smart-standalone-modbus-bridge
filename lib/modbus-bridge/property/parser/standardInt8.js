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
*   signed                  - true/false
* }
*
* */

class StandardInt8 extends BaseParser {
    constructor(conf) {
        conf = (conf === undefined) ? {} : (typeof conf === 'string') ? { type: conf } : conf;
        super(_.defaults(_.clone(conf), {
            homieDataType : 'integer',
            type          : 'standardInt8'
        }));
        this.shift = conf.shift || 0;
        this.lowbyte = !!(conf.highlow === 'low' || conf.highlow === undefined);
        this.signed = conf.signed || false;
    }
    fromHomie(data) {
        const buf = new Buffer.alloc(2);

        buf[`write${this.signed ? '' : 'U'}Int8`](data, this.lowbyte ? 1 : 0);

        return [ [ buf ], this.shift ];
    }
    toHomie(data) {
        const buf = Buffer.concat(data.slice(this.shift, this.shift+1));

        return `${buf[`read${this.signed ? '' : 'U'}Int8`](this.lowbyte ? 1 : 0)}`;
    }
}

module.exports = StandardInt8;
