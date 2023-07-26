// eslint-disable-next-line no-unused-vars
async function set_slave_id({ modbusConnection, currentSlaveId, newSlaveId, params }) {
    newSlaveId = parseInt(newSlaveId, 10);
    const data = { address: 0x4000, value: Buffer.from([ (newSlaveId>>8)&0xFF, (newSlaveId)&0xFF ]), extra: { unitId: currentSlaveId  } };

    console.log('Request');
    console.log(data);
    const response = await modbusConnection.writeSingleRegister(data);

    console.log('Response');
    console.log(response.response);
}

module.exports = {
    name: 'Digital outputs Waveshare Relay',
    description: 'Digital outputs Waveshare Relay',
    vendor: 'WellPro',
    tags: 'WellPro, Waveshare Relay, Digital outputs',
    set_slave_id
}
