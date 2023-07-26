# Documentation for the `.bin/cli.js` script
The script allows you to scan the modbus bus to determine the slaveid of the device and change it. To do this, use the `scan` and `set-slave-id` commands.

**Data for filling `options` should be looked in `modbus/docs/nodes/[deviceName]/modbus_api.md` and `modbus/docs/nodes/[deviceName]/set_slave_id.md`**

---
#### Options for the device slaveid search command - `scan`:
1. `protocol` - protocol for communicating with modbus. Our default is **tcp**.
2. `host` - host or ip-address of the modbus bus (for example - **elfin**).
3. `port` - port of the modbus bus (for example - **elfin**).
4. `hardware` - the name of the device to load the test function.
5. `function` - a function for checking registers (depends on the device). Options: **readCoils**, **readDiscreteInputs**, **readHoldingRegisters**, **readInputRegisters**, **writeSingleCoil**, **writeSingleRegister**, **writeMultipleCoils**, **writeMultipleRegisters**.
6. `quantity` - Modbus parameter for read operations, number of required registers.
7. `data` - Modbus parameter for write operations. Hexadecimal representation of data in the case of registers, or a string of bits (0 or 1). The length should be 4 characters (i.e. 1 register) if the function operates on a single register, or 1 character if the value type is discrete.
8. `address` - address of the first register in hex.
9. `from` - slaveid from which scan start (0 by default).
10. `to` - slaveid of the end of the scan (default 247).
11. `timeout` - timeout before starting scanning for the next slaveid (default 2s).

Required arguments: `protocol`, `host`, `port`, `from`, `to`.

---
#### Options for the command to change the device's slaveid - `set-slave-id`:
1. `protocol` - protocol for communicating with modbus. Our default is **tcp**.
2. `host` - host or ip-address of the modbus bus (for example - **elfin**).
3. `port` - port of the modbus bus (for example - **elfin**).
4. `hardware` - the name of the device to load the test function.
5. `current-slave-id` - current slaveid of the device.
6. `new-slave-id` - new slaveid of the device.
 
Required arguments: `protocol`, `host`, `port`, `hardware`.

# Examples:
---
##WP8025ADAM:

#### Scan slaveid:
```bash
node cli.js scan --host=192.168.1.132 --port=512 --from=16 --to=17
```

#### Change slaveid:
```bash
node cli.js set-slave-id --host=192.168.1.132 --port=512 --hardware=WP8025ADAM --current-slave-id=16 --new-slave-id=1
```
---
## WP3082ADAM:

#### Scan slaveid:
```bash
node cli.js scan --host=192.168.1.132 --port=512 --from=17 --to=18 --function=readInputRegisters
```

#### Change slaveid:
```bash
node cli.js set-slave-id --host=192.168.1.132 --port=512 --hardware=WP3082ADAM --current-slave-id=17 --new-slave-id=1
```
---
## thermometer.XY-MD02:

#### Scan slaveid:
```bash
node cli.js scan --host=192.168.1.132 --port=512 --from=11 --to=12 --address=257 --quantity=4 --function=readHoldingRegisters
```

#### Change slaveid:
```bash
node cli.js set-slave-id --host=192.168.1.132 --port=512 --hardware=thermometer.XY-MD02 --current-slave-id=11 --new-slave-id=1
```
---