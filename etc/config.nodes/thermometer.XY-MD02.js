module.exports = {
    //id from env.DEVICE_NODES
    //hardware from env.DEVICE_NODES
    //slaveId from env.DEVICE_NODES
    extensions : {
        transports: [
            {
                id: 'sensors-state',
                type: 'modbus',

                'function' : 'input-registers',
                'address'  : 1,
                'quantity' : 2
            }
        ],
        mapping : {
            'temperature' : {
                transportId :'sensors-state',
                //bridge
                dataTypeBridge      : {
                    type:'floatToRegisterArray',
                    precision:2,
                    divider:10,
                    shift:0,
                    signed:true
                }
            },
            'humidity' : {
                transportId :'sensors-state',
                //bridge
                dataTypeBridge      : {
                    type:'floatToRegisterArray',
                    precision:2,
                    divider:10,
                    shift:1
                }
            }
        }
    },
    name : 'Thermometer XY-MD02',
    sensors   : [
        {
            'id'       : 'temperature',
            'unit'     : '°C',
            'retained' : true,
            'settable' : false,
            'name'     : 'Temperature'
        },
        {

            // homie
            'id'       : 'humidity',
            'unit'     : '%rh',
            'retained' : true,
            'settable' : false,
            'name'     : 'Humidity'
        },
    ],
    options   : [],
    telemetry : []
};
