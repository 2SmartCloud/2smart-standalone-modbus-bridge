require('events').defaultMaxListeners = 100;
const Debugger = require('homie-sdk/lib/utils/debugger');
const ModbusBridge = require('./lib/modbus-bridge');

// NODES
let nodes = null;

if (process.env.DEVICE_NODES) {
    nodes = process.env.DEVICE_NODES.split(';').map((nodeStr) => {
        if (!nodeStr.length) return null;
        const arr = nodeStr.split(':');

        return {
            slaveId  : arr[0], // slaveId=id
            id       : parseInt(arr[0], 10),
            hardware : arr[1]
        };
    }).filter((v) => !!v);
} else {
    const nodesConfig = require('./etc/nodes.config.json');

    nodes = nodesConfig.nodes.map((obj) => {
        return {
            slaveId  : obj.id,
            id       : obj.id,
            hardware : obj.hardware,
            override : obj.override
        };
    });
}
// NODES END

const deviceBridgeConfig = {
    mqttConnection : {
        username : process.env.MQTT_USER || undefined,
        password : process.env.MQTT_PASS || undefined,
        uri      : process.env.MQTT_URI || undefined
    },
    modbusConnection : {
        type                    : process.env.MODBUS_CONNECTION_TYPE || undefined,
        ip                      : process.env.MODBUS_CONNECTION_IP || undefined,
        port                    : parseInt(process.env.MODBUS_CONNECTION_PORT, 10) || undefined,
        retryConnectionInterval : parseInt(process.env.MODBUS_CONNECTION_RETRY_INTERVAL, 10) || undefined,
        connectionTimeout       : parseInt(process.env.MODBUS_CONNECTION_TIMEOUT, 10) || undefined,
        sendGap                 : parseInt(process.env.MODBUS_SEND_GAP, 10) || undefined,
        maxParallelRequests     : parseInt(process.env.MODBUS_MAX_PARALLEL_REQUESTS, 10) || undefined
    },
    device : {
        id              : process.env.DEVICE_ID || process.env.MQTT_USER || undefined,
        name            : process.env.DEVICE_NAME || undefined,
        implementation  : process.env.DEVICE_IMPLEMENTATION || undefined,
        mac             : process.env.DEVICE_MAC || undefined,
        firmwareVersion : process.env.DEVICE_FIRMWARE_VERSION || undefined,
        firmwareName    : process.env.DEVICE_FIRMWARE_NAME || undefined,
        nodes
    }
};

const debug = new Debugger(process.env.DEBUG || '');

debug.initEvents();

try {
    const modbusBridge = ModbusBridge.create({ ...deviceBridgeConfig, debug });

    modbusBridge.on('error', (error) => {
        debug.warning('ModbusBridge.error', error);
    });
    modbusBridge.on('exit', (reason, exit_code) => {
        debug.info('ModbusBridge.exit', reason);
        process.exit(exit_code);
    });
    modbusBridge.init();
} catch (e) {
    debug.error(e);
    process.exit(1);
}
