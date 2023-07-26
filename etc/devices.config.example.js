module.exports = {
    //mqtt
    mqttConnection:{
        username : 'username',                      // default ''
        password : 'password',                      // default ''
        uri      : 'wss://localhost:8084/mqtt'      // optional, default - 'wss://localhost:8084/mqtt'
    },

    // modbus
    modbusConnection : {                    // optional
        type      : 'tcp',                   // optional, default 'tcp'. 'tcp'. TODO: 'serial', 'udp'
        ip        : 'localhost',             // optional, defalut localhost
        port      : '502',                   // optional, default 502
        retryConnectionInterval: 10000,     // optional, default 10000 = 10s,
        reconnect : true                    // optional, default true
    },
    device: {
        id       : 'device_id',                     // optional, default - mqttConnection.username
        name     : 'Modbus Device Bridge',          // optional, default 'Modbus Device Bridge'
        implementation  : 'ModbusBridge',           // optional, default 'ModbusBridge'
        mac             : '98D863584686',           // device mac-address
        firmwareVersion : 'EW11',                   // optional, default 'EW11'
        firmwareName    : 'Elfin',                  // optional, default 'Elfin'


        telemetry: [                            // optional
            // see etc/node.config.example.js sensors, options telemetry arrays
        ],
        options: [                              // optional
            // see etc/node.config.example.js sensors, options telemetry arrays
        ],

        nodes: [
            {
                id: 'modbusnodeid',
                slaveId: 3,
                hardware: 'thermometer.sm100'      // name of node file config to load other options. These options will be set as defaults
                // see etc/node.config.example.js for more node configuration options
            }
        ]
    }
};
