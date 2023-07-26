module.exports = {
    id: 'modbus_node_id',                   // from env.DEVICE_NODES, required
    hardware: undefined,                    // from env.DEVICE_NODES, optional, default undefined
    slaveId: 1,                             // from env.DEVICE_NODES, optional, default 1
    name : 'Modbus Node Bridge',            // optional, default 'ModbusNodeName'

    transports:[                        //optional, default []
        {
            id : 'transport_id',                // required here, id for transport identification
            type : 'modbus',                        // required, transport file name

            // modbusValueTransport
            'function' : 'coils',                   // 'coils', 'discrete-inputs', 'holding-registers', 'input-registers'
            'address'  : 0,                         // 0-49999 address, default 0
            'quantity' : 1,                         // default 1,
            advanced:{                          // if some options are different for set and get methods comparing to ones specified above
                get: {                                      // set null, if get method should be disabled. is not used if checkInterval=null
                    'function' : 'coils',                   // 'coils', 'discrete-inputs', 'holding-registers', 'input-registers'
                    'address'  : 0,                         // 0-49999 address
                    'quantity' : 1                          // default 1,
                },
                set: {                                      // set null, if set method should be disabled. is not used if checkInterval=null
                    'function' : 'coils',                   // 'discrete-inputs', 'input-registers'
                    'address'  : 0,                         // 0-49999 address
                    'quantity' : 1                          // default 1,
                }
            },
            checkInterval  : 1000,                   // default 1000 = 1s, 0 - only check one time to initialize, null - not checks at all
        }
    ],
    sensors   : [
        {
            transportId : 'transport_id',           // set if object should use transport with specified id from list defined above.
            transport  : {                          // Or do not set and specify tranport object here
                // the same object as one before, but without id
            },

            //bridge
            // dataTypeBridge can be object or string. If dataTypeBridge is string, it will go as type property
            // dataTypeBridge exaples next
            dataTypeBridge      : {
                type:'floatToBufferArray',          // float to buffer array. should be contained in 2 bytes
                homieDataType:'float',                  // optional, default 'float'. One of homie dataTypes
                endian:'big',                           // optional, default 'big'. Specify big-endian or little-endian bytes order
                precision:2,                            // optional, default 0, number of,
                base:10                                 // optonal, default 10. // TODO, TOREVIEW, now only supported 10 value

            },
            dataTypeBridge      : {
                type:'integerToBufferArray',        // integer to buffer array. should be contained in 2 bytes
                homieDataType:'integer',                  // optional, default 'integer'. One of homie dataTypes
                endian:'big',                           // optional, default 'big'. Specify big-endian or little-endian bytes order
            },
            dataTypeBridge      : {
                type:'booleanToBufferArray',        // stretch out boolean from buffer array
                homieDataType:'boolean',                // optional, default 'boolean'. One of homie dataTypes
                shift:0,                                // optional, default 0. index of bit which should be stretched out
            },
            dataTypeBridge      : {
                type:'booleanToBooleanArray',       // stretch out boolean from boolean array(to be more precise 0-1 array)
                homieDataType:'boolean',                // optional, default 'boolean'. One of homie dataTypes
                shift:0,                                // optional, default 0. index of bit which should be stretched out
            },
            dataTypeBridge      : {
                type:'raw',                         // return data as it is
                homieDataType:'string',                 // optional, default 'string'. One of homie dataTypes
            },


            //restoreHomieValue: false,                 // TODO, TOREVIEW maybe will be realised in future
                                                        // default false, [ if true received from Homie must be synced to device ]
                                                        // [ if false will sync value from device to Homie ]
            // homie
            'id'       : 'sensor_id',
            'unit'     : '°C',
            'retained' : true,                      // optional, default true
            'settable' : false,                     // optional, default false [ if transport is settable ], true [ if transport is not settable ]
            'name'     : 'Sensor Name'              // optional, default 'Sensor Name'
        },
    ],
    options   : [
        // the same as sensors
    ],
    telemetry : [
        // the same as sensors
    ]
};
