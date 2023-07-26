async function set_slave_id({ modbusConnection, currentSlaveId, newSlaveId, params }) {
    const data = { address: 2, value: Buffer.from([ (newSlaveId>>8)&0xFF, (newSlaveId)&0xFF ]), extra: { unitId: currentSlaveId } };

    console.log('Request');
    console.log(data);

    const response = await modbusConnection.writeSingleRegister(data);

    console.log('Response');
    console.log(response.response);
}
module.exports = {
    name: 'PZEM-004T',
    description: 'PZEM-004T',
    vendor: null,
    tags: 'power, ammeter, PZEM-004T',
    set_slave_id
}