// eslint-disable-next-line no-unused-vars
async function set_slave_id({ modbusConnection, currentSlaveId, newSlaveId, params }) {
    console.warn('\x1b[33mAutomatic slave id installation is not possible. Need a manual intervention.\x1b[0m');
    const fs = require('fs-extra');
    const path = require('path');

    // eslint-disable-next-line no-sync
    const text = fs.readFileSync(path.resolve(__dirname, 'set_slave_id.md'), 'utf8');

    console.log(text);
}

module.exports = {
    'description' : 'ModbusRTU Relay with DIP RS485RB',
    check         : {
        'function' : 'readHoldingRegisters',
        'address'  : 1,
        'quantity' : 1
    },
    variations : {
        '1' : {
            description : '1 relay'
        },
        '2' : {
            description : '2 relay'
        },
        '4' : {
            description : '4 relay'
        },
        '8' : {
            description : '8 relay'
        }
    },
    set_slave_id
};
