const _ = require('underscore');
const BaseParser = require('homie-sdk/lib/Bridge/BaseParser');
const Buffer = require('../../../modbus-stream/lib/buffer');

/*
* conf - string, type - class type(filename)
* or
* conf = {
*   homieDataType,          - optional
*   type,                   - optional, class type(filename),
*   shift,                  - position of bit
*   commands = {                - optional
*       'true'  : Buffer.from([0,0])       register value to set true
*       'false' : Buffer.from([0,0])       register value to set false
*   }
* }
* */

class BooleanToBufferArray extends BaseParser {
    constructor(conf) {
        conf = (conf === undefined) ? {} : (typeof conf === 'string') ? { type: conf } : conf;
        super(_.defaults(_.clone(conf), {
            homieDataType : 'boolean',
            type          : 'booleanToBufferArray'
        }));
        this.shift = conf.shift || 0;
        this.quantity = conf.quantity || 1;
        this.commands = conf.commands || null;
    }
    fromHomie(data, previousData) {
        if (data !== 'true' && data !== 'false') throw new Error(`Wrong homie data=${data}`);
        if (!previousData && (this.shift > 0 || this.quantity>1)) throw new Error('Data is not initialized yet. Relax. It is okey =)');
        if (!previousData) previousData = [ Buffer.from([ 0, 0 ]) ];

        const previousDataClone = previousData.map((v) => Buffer.from(v));
        const shift = this.shift;

        const ri = shift>>4;
        const r = previousDataClone[ri];
        const bi = (shift>>3)&1;
        const o = (shift&7);

        r[bi] = (r[bi] & ~(1<<o)) | ((data==='true')<<o);
        return [ [ (this.commands && this.commands[data])||r ], ri, [ r ] ];
    }
    toHomie(data) {
        this.data = data;
        const shift = this.shift;

        return `${!!((data[shift>>4][(shift>>3)&1] >> (shift&7)) & 1)}`;
    }
}

module.exports = BooleanToBufferArray;
