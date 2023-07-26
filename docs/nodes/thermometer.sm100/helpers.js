// eslint-disable-next-line no-unused-vars
async function set_slave_id({ modbusConnection, currentSlaveId, newSlaveId, params }) {
    const commandChangeSlaveId = 2;

    newSlaveId = parseInt(newSlaveId, 10);
    const dataArgs = { 
        address: 0x9C40, 
        value: Buffer.from([ (newSlaveId>>8)&0xFF, (newSlaveId)&0xFF ]), 
        extra: { unitId: currentSlaveId  } 
    };

    const dataCommand = { 
        address: 0x9c41, 
        value: Buffer.from([ (commandChangeSlaveId>>8)&0xFF, (commandChangeSlaveId)&0xFF ]), 
        extra: { unitId: currentSlaveId  } 
    };

    // write new slave into id to 40000 address
    console.log('Request to change args register');
    console.log(dataArgs);
    const responseArgs = await modbusConnection.writeSingleRegister(dataArgs);

    console.log('Response from args register');
    console.log(responseArgs.response);

    // set command to change slave id from args register
    console.log('Request to command register');
    console.log(dataCommand);
    const responseCommand = await modbusConnection.writeSingleRegister(dataCommand);

    console.log('Response from command register');
    console.log(responseCommand.response);

    console.log('\x1b[33mPlease, reset the device in order changes to be applied.\x1b[0m');
    return { resetIsRequired: true };
}
module.exports = {
    'description' : 'Thermometr SM-100',
    check         : {
        'function' : 'readInputRegisters',
        'address'  : 30004,
        'quantity' : 1
    },
    set_slave_id
};
