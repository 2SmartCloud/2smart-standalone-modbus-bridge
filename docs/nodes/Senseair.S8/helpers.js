// eslint-disable-next-line no-unused-vars
async function set_slave_id({ modbusConnection, currentSlaveId, newSlaveId, params }) {
    console.log(`Can't change slave id of this device!`);
    return false;
}

module.exports = {
    'description' : 'Senseair S8',
    check         : {
        'function' : 'readInputRegisters',
        'address'  : 3,
        'quantity' : 1
    },
    set_slave_id
};
