// eslint-disable-next-line no-unused-vars
async function set_slave_id({ modbusConnection, currentSlaveId, newSlaveId, params }) {
    newSlaveId = parseInt(newSlaveId, 10);
    const data = { address: 0x0101, value: Buffer.from([ (newSlaveId>>8)&0xFF, (newSlaveId)&0xFF ]), extra: { unitId: currentSlaveId  } };

    console.log('Request');
    console.log(data);
    const response = await modbusConnection.writeSingleRegister(data);

    console.log('Response');
    console.log(response.response);
    return { resetIsRequired: true };
}
module.exports = {
    'description' : 'Thermometr XY-MD02',
    check         : {
        'function' : 'readInputRegisters',
        'address'  : 1,
        'quantity' : 1
    },
    set_slave_id
};
