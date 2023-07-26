module.exports = {
    //id from env.DEVICE_NODES
    //hardware from env.DEVICE_NODES
    //slaveId from env.DEVICE_NODES
    extensions : {
        transports: [
            {
                id: 'pzem-004t',
                type: 'modbus',
                'function' : 'input-registers',
                'address'  : 0,
                'quantity' : 10
            },
            {
                id: 'pzem-004t-threshold',
                type: 'modbus',
                'address'  : 0,
                'quantity' : 1,
                advanced   : {
                    get : {
                        'function' : 'holding-registers'
                    },
                    set : {
                        'function' : 'input-registers'
                    }
                }
            }
        ],
        mapping : {
            'voltage' : {
                transportId    : 'pzem-004t',
                dataTypeBridge : {
                    type      : 'floatToRegisterArray',
                    precision : 1,
                    divider   : 10,
                    shift     : 0,
                    signed    : true
                }
            },
            'current' : {
                transportId    : 'pzem-004t',
                dataTypeBridge : {
                    type      : 'standardFloat',
                    endian    : 'big',
                    precision : 4,
                    divider   : 1000,
                    shift     : 1
                }
            },
            'power' : {
                transportId    : 'pzem-004t',
                dataTypeBridge : {
                    type      : 'standardFloat',
                    endian    : 'big',
                    precision : 1,
                    divider   : 10,
                    shift     : 3
                }
            },
            'energy' : {
                transportId    : 'pzem-004t',
                dataTypeBridge : {
                    type      : 'standardFloat',
                    endian    : 'big',
                    precision : 1,
                    divider   : 10,
                    shift     : 3
                }
            },
            'frequency' : {
                transportId    : 'pzem-004t',
                dataTypeBridge : {
                    type      : 'floatToRegisterArray',
                    precision : 1,
                    divider   : 10,
                    shift     : 7
                }
            },
            'power-factor' : {
                transportId    : 'pzem-004t',
                dataTypeBridge : {
                    type      : 'floatToRegisterArray',
                    precision : 1,
                    divider   : 100,
                    shift     : 8
                }
            },
            '$options/power-threshold' : {
                transportId    : 'pzem-004t-holding',
                dataTypeBridge : {
                    type  : 'floatToRegisterArray',
                    shift : 0
                }
            }
        }
    },
    name : 'PZEM-004T',
    sensors   : [
        {
            'id'       : 'voltage',
            'unit'     : 'V',
            'retained' : true,
            'settable' : false,
            'name'     : 'Voltage'
        },
        {
            'id'       : 'current',
            'unit'     : 'A',
            'retained' : true,
            'settable' : false,
            'name'     : 'Current'
        },
        {
            'id'       : 'power',
            'unit'     : 'W',
            'retained' : true,
            'settable' : false,
            'name'     : 'Power'
        },
        {
            'id'       : 'energy',
            'unit'     : 'Wh',
            'retained' : true,
            'settable' : false,
            'name'     : 'Energy'
        },
        {
            'id'       : 'frequency',
            'unit'     : 'Hz',
            'retained' : true,
            'settable' : false,
            'name'     : 'Frequency'
        },
        {
            'id'       : 'power-factor',
            'unit'     : '#',
            'retained' : true,
            'settable' : false,
            'name'     : 'Power Factor'
        },
    ],
    options   : [
        {
            'id'       : 'power-threshold',
            'unit'     : 'W',
            'retained' : true,
            'settable' : true,
            'name'     : 'Power threshold'
        },
    ],
    telemetry : []
};
