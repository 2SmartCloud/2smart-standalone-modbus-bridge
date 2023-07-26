module.exports = {
    //id from env.DEVICE_NODES
    //hardware from env.DEVICE_NODES
    //slaveId from env.DEVICE_NODES
    extensions : {
        mapping : {
            'concentration' : {
                transport  : {
                    type: 'modbus',

                    'function' : 'input-registers',
                    'address'  : 3,
                    'quantity' : 1
                },
                //bridge
                dataTypeBridge      : {
                    type:'floatToRegisterArray',
                    precision:0,
                    divider:1
                }
            }
        }
    },
    name : 'Senseair S8',
    sensors   : [
        {
            'id'       : 'concentration',
            'unit'     : 'ppm',
            'retained' : true,
            'settable' : false,
            'name'     : 'Concentration of CO2'
        },
    ],
    options   : [],
    telemetry : []
};
