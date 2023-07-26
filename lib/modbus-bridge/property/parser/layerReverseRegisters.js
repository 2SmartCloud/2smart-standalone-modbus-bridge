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

class LayerReverseRegisters extends BaseParser {
    constructor(conf) {
        conf = (conf === undefined) ? {} : (typeof conf === 'string') ? { type: conf } : conf;
        const dataTypeBridge = createParser(conf.dataTypeBridge);

        super(_.defaults(_.clone(conf), {
            homieDataType : dataTypeBridge.homieDataType,
            type          : 'layerReverseRegisters'
        }));
        this.dataTypeBridge = dataTypeBridge;
        this.shift = conf.shift || 0;
        this.quantity = conf.quantity || null;
    }
    fromHomie(data) {
        const res = this.dataTypeBridge.fromHomie(data);
        const shift = res[1] || 0;

        if (shift >= this.quantity + this.shift) return res; // ok nothing to reverse
        else if (shift <= this.shift) {
            const f = this.shift - shift;
            const t = (this.quantity === null) ? res[0].length : (this.quantity + f);

            // eslint-disable-next-line more/no-c-like-loops
            res[0] = [ ...res[0].slice(0, f), ...res[0].slice(f, t).reverse(), ...res[0].slice(t) ];
        } else {
            throw new Error('Cannot reverse range of registers in the middle of range.');
        }
        return res;
    }
    toHomie(data) {
        let newData = data.slice().map(buf => Buffer.from(buf));

        const f = this.shift;
        const t = (this.quantity === null) ? newData.length : (this.quantity + this.shift);

        newData = [ ...newData.slice(0, f), ...newData.slice(f, t).reverse(), ...newData.slice(t) ];

        return this.dataTypeBridge.toHomie(newData);
    }
}

module.exports = LayerReverseRegisters;
