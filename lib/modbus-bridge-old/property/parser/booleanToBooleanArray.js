const _ = require('underscore');
const BaseParser = require('./index');
/*
* conf - string, type - class type(filename)
* or
* conf = {
*   homieDataType,          - optional
*   type,                   - optional, class type(filename),
*   shift,                  - position of bit
* }
* */

class BooleanToBooleanArray extends BaseParser {
    constructor(conf) {
        conf = (conf === undefined) ? {} : (typeof conf === 'string') ? { type: conf } : conf;
        super(_.defaults(_.clone(conf), {
            homieDataType : 'boolean',
            type          : 'booleanToBooleanArray'
        }));
        this.shift = conf.shift || 0;
        this.quantity = conf.quantity || 1;
    }
    // eslint-disable-next-line no-unused-vars
    fromHomie(data, previousData) {
        if (data !== 'true' && data !== 'false') throw new Error(`Wrong homie data=${data}`);
        // if (!previousData && (this.shift > 0 || this.quantity>1)) throw new Error('Data is not initialized yet. Relax. It is okey =)');
        // if (!previousData) previousData = [ 0 ];
        // const previousDataClone = previousData.map((v) => v);

        // previousDataClone[this.shift] = (data === 'true') ? 1 : 0;
        return [ [ (data === 'true') ? 1 : 0 ], this.shift ];
    }
    toHomie(data) {
        const shift = this.shift;

        return `${!!(data[shift])}`;
    }
}

module.exports = BooleanToBooleanArray;
