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
*   mask                    - array of 2-bytes buffers. Example [[0xFF, 0xFF], [0xFF, 0xFF]]
* }
*
* */

class LayerRegistersXorBitMask extends BaseParser {
    constructor(conf) {
        conf = (conf === undefined) ? {} : (typeof conf === 'string') ? { type: conf } : conf;
        const dataTypeBridge = createParser(conf.dataTypeBridge);

        super(_.defaults(_.clone(conf), {
            homieDataType : dataTypeBridge.homieDataType,
            type          : 'layerRegistersXorBitMask'
        }));
        this.dataTypeBridge = dataTypeBridge;
        this.mask = conf.mask;
        this.shift = conf.shift || 0;
    }
    fromHomie(data) {
        return this.dataTypeBridge.fromHomie(data);
    }
    toHomie(data) {
        const newData = data.map(v => v.slice());

        // eslint-disable-next-line more/no-c-like-loops
        for (let i=0; i < this.mask.length && (this.shift+i) < newData.length; i++) {
            newData[this.shift+i][0] ^= this.mask[i][0];
            newData[this.shift+i][1] ^= this.mask[i][1];
        }
        return this.dataTypeBridge.toHomie(newData);
    }
}

module.exports = LayerRegistersXorBitMask;
