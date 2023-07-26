var modbus = require("modbus-stream");

modbus.tcp.connect(512, "192.168.2.161", { debug: "automaton-2454" }, (err, connection) => {
    if (err) throw err;

    // connection.writeSingleRegister({ address: 16384, value: Buffer.from([0x02]), extra: { unitId: 1 } }, (err, res) => {
    //     if (err) throw err;

    //     console.log(res); // response
    //     // console.log(parseInt(res.response.data[0], 16) * 0.0001, '%');
    // })

    // connection.writeSingleCoil({ address: 7, value: 0xff00, extra: { unitId: 1 } }, (err, res) => {
    //     if (err) throw err;

    //     console.log(res); // response
    //     // console.log(parseInt(res.response.data[0], 16) * 0.0001, '%');
    // })


    connection.readCoils({ address: 0xff, quantity: 1, extra: { unitId: 1 } }, (err, res) => {
        if (err) throw err;

        console.log(res); // response
        console.log(res.response.data[0]);
        // console.log(parseInt(res.response.data[0], 16) * 0.0001, '%');
    });
});