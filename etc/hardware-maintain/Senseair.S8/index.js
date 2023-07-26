// eslint-disable-next-line no-unused-vars
async function set_slave_id({ modbusConnection, currentSlaveId, newSlaveId, params }) {
    console.log('\x1b[33mCant\'t change slave if of this device!\x1b[0m');
}
module.exports = {
    name: 'Senseair S8',
    description: 'Senseair S8',
    vendor: null,
    tags: 'Senseair S8',
    set_slave_id
}

