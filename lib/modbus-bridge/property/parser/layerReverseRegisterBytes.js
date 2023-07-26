const _ = require('underscore');
const BaseParser = require('homie-sdk/lib/Bridge/BaseParser');
const { create: createParser } = require('.');

/*
* conf - string, type - class type(filename)
* or
* conf = {
*   homieDataType,          - has default, optional
*   type,                   - default filename, optional, class type(filename)
*   dataTypeBridge          - object parser
* }
*
* */

class LayerReverseRegistersBytes extends BaseParser {
    constructor(conf) {
        conf = (conf === undefined) ? {} : (typeof conf === 'string') ? { type: conf } : conf;
        const dataTypeBridge = createParser(conf.dataTypeBridge);

        super(_.defaults(_.clone(conf), {
            homieDataType : dataTypeBridge.homieDataType,
            type          : 'layerReverseRegistersBytes'
        }));
        this.dataTypeBridge = dataTypeBridge;
        this.shift = conf.shift || 0;
        this.quantity = conf.quantity || null;
    }
    fromHomie(data) {
        const res = this.dataTypeBridge.fromHomie(data);
        const shift = res[1] || 0;

        const f = Math.max(this.shift - shift, 0);
        const t = Math.min(res[0].length, (this.quantity === null) ? Infinity : (this.quantity + f));

        // eslint-disable-next-line more/no-c-like-loops
        for (let i=f; i<t; ++i) res[0][i].reverse();

        return res;
    }
    toHomie(data) {
        const newData = data.slice().map(buf => Buffer.from(buf));


        const t = (this.quantity === null) ? data.length : (this.quantity + this.shift);

        // eslint-disable-next-line more/no-c-like-loops
        for (let i=this.shift; i<t; ++i) newData[i].reverse();

        return this.dataTypeBridge.toHomie(newData);
    }
}

module.exports = LayerReverseRegistersBytes;
