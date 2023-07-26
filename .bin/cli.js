#!/usr/bin/env node
const yargs = require('yargs');

const Promise = require('bluebird');
const _ = require('underscore');
const path = require('path');
const fs = require('fs-extra');
const cliProgress = require('cli-progress');
require('console.table');


const errorHandler = (error, showStack=false) => {
    console.error('\x1b[31mFatal error: '+'\x1b[0m'+error.message);
    if (true) console.log(error.stack);
    process.exit(1);
};

function loadConfigs(hardware) {
    const arr = hardware.split('.');
    const params = [];

    while (arr.length) {
        try {
            console.log(`../etc/config.nodes/${arr.join('.')}`);
            let config = require(path.join('../etc/config.nodes/', arr.join('.')));

            console.log(`../etc/hardware-maintain/${arr.join('.')}`);
            let helpers = require(path.join('../etc/hardware-maintain', arr.join('.')));
            
            if (typeof config === 'function') {
                config = config(...params);
                helpers = { ...helpers, ...helpers.variations[params.join('.')] }
            }

            console.log('\x1b[32mMODULE_FOUND\x1b[0m');
            return { helpers, config, params };
        } catch (e) {
            if (e.code!=='MODULE_NOT_FOUND') throw e;
            console.log('\x1b[33mMODULE_NOT_FOUND\x1b[0m');
            params.unshift(arr.pop());
        }
    }
    throw new Error(`Cannot load node module(${hardware})`);
}
async function showSupportedDeviceList (yarv) {
    const data = {};
    let modules = _.uniq([
        ...fs.readdirSync(path.resolve(__dirname, '../etc/hardware-maintain')),
        ...fs.readdirSync(path.resolve(__dirname, '../etc/config.nodes')).map(filename => {
            const { name } = path.parse(filename);
            return name;
        })
    ]);
    for (const module of modules) {
        let config = require(path.join('../etc/config.nodes', module));
        const helpers = require(path.join('../etc/hardware-maintain', module));

        if (typeof config === 'function') {
            if (!helpers.variations) throw new Error(`variations field is not defined in module ${path.join('etc/hardware-maintain', module)}`);
            if (!Object.keys(helpers.variations).length) throw new Error(`variations object is not empty in module ${path.join('etc/hardware-maintain', module)}`);
            
            for(const [params, v] of Object.entries(helpers.variations)) {
                const hardware = `${module}.${params}`;

                lconfig = config(...params.split('.'));
                lhelpers = { ...helpers, ...v}
                if(!lhelpers.description) console.warn(`description field is not defined in template-module ${path.join('etc/hardware-maintain', module)}(.${params})`);
                if(!lhelpers.tags) console.warn(`description field is not defined in template-module ${path.join('etc/hardware-maintain', module)}(.${params})`);
                if(!lhelpers.set_slave_id) console.warn(`set_slave_id function is not defined in template-module ${path.join('etc/hardware-maintain', module)}(.${params})`);

                data[hardware] = {
                    type:'js-export-template-function',
                    params,
                    module,
                    hardware,
                    description: lhelpers.description,
                    tags: lhelpers.tags
                };
            }
        } else {
            if(!helpers.description) console.warn(`description field is not defined in module ${path.join('etc/hardware-maintain', module)}`);
            if(!helpers.tags) console.warn(`description field is not defined in module ${path.join('etc/hardware-maintain', module)}`);
            if(!helpers.set_slave_id) console.warn(`set_slave_id function is not defined in module ${path.join('etc/hardware-maintain', module)}`);

            const hardware = module;
            
            data[hardware] = {
                type:'json/js-export-json',
                module,
                hardware,
                description: helpers.description,
                tags: helpers.tags
            };
        }
    }
    const list = [];
    for(const [hardware, {tags, description, type, module }] of Object.entries(data)){
        list.push({ hardware, description, type, tags, module});
    }
    console.table(list);
}
async function scanDeviceSlaveId (yarv) {
    let modbusConnectionConfig = {
        type                    : yarv.protocol,
        ip                      : yarv.host,
        port                    : yarv.port,
        reconnect               : false,
        retryConnectionInterval : 0
    };
    const { from, to, timeout } = yarv;
    let checkObj = null;
    if (yarv.hardware){
        const { config, helpers } = loadConfigs(yarv.hardware);
        const transport = [
            ...config.extensions.transports,
            ...Object.values(config.extensions.mapping).map(({ transport }) => transport)
        ].find(transport => {
            if (transport.advanced && !transport.advanced.get) return false;

            return true;
        });

        if (!transport) throw new Error(`Cannot find transport for hardware ${yarv.hardware}`);

        comParams = { ..._.pick(transport, 'function', 'address', 'quantity'), ...[transport.advanced && transport.advanced.get] };
        checkObj = _.pick(comParams, 'address', 'quantity');


        if (comParams.function !== 'coils') checkObj.function = 'readCoils';
        else if (comParams.function !== 'discrete-inputs') checkObj.function = 'readDiscreteInputs';
        else if (comParams.function !== 'holding-registers') checkObj.function = 'readHoldingRegisters';
        else if (comParams.function !== 'input-registers') checkObj.function = 'readInputRegisters';
    } else {
        checkObj =_.pick(yarv, 'function', 'address');
        if(yarv.function===undefined) throw new Error('function is required.') ;
        if(yarv.address===undefined) throw new Error('address is required.') ;
        if(yarv.function === 'writeSingleCoil') {
            if(yarv.data===undefined) throw new Error('data is required.') ;
            checkObj.value = yarv.data==='1';
        }
        else if(yarv.function === 'writeSingleRegister') {
            if(yarv.data===undefined) throw new Error('data is required.') ;
            checkObj.value = Buffer.from(yarv.data);
        }
        else if(yarv.function === 'writeMultipleCoils') {
            if(yarv.data===undefined) throw new Error('data is required.') ;
            checkObj.values = yarv.data.split('').map((c)=>c==='1');
        }
        else if(yarv.function === 'writeMultipleRegisters') {
            if(yarv.data===undefined) throw new Error('data is required.') ;
            checkObj.values = yarv.data.match(/.{1,4}/g).map((r)=>Buffer.from(r));
        }
        else {
            if(yarv.quantity===undefined) throw new Error('quantity is required.') ;
            checkObj.quantity = yarv.quantity;
        }
    }

    const ModbusConnection = require(path.resolve(__dirname, '../lib/modbus-bridge/modbus_connection'));

    const modbusConnection = new ModbusConnection({ ...modbusConnectionConfig, debug: null });
    const connectHandler = () => {
        console.log('\x1b[32mConnected\x1b[0m');
    };
    const closeHandler = () => {
        console.log('\x1b[33mConnection closed\x1b[0m');
    };
    modbusConnection.on('connect', connectHandler);
    modbusConnection.on('close', closeHandler);
    modbusConnection.on('error', errorHandler);
    await modbusConnection.connect();
    if (!modbusConnection.connected) errorHandler(Error('Connection is not established'));

    let checkFunc = null;
    if (checkObj.function === 'readCoils'
        || checkObj.function === 'readDiscreteInputs'
        || checkObj.function === 'readHoldingRegisters'
        || checkObj.function === 'readInputRegisters'){
        if(checkObj.address===undefined) errorHandler(new Error('address is not provided.'), true) ;
        if(checkObj.quantity===undefined) errorHandler(new Error('quantity is not provided.'), true) ;
        checkFunc = async (unitId)=>{
            return await modbusConnection[checkObj.function]({..._.pick(checkObj, 'address', 'quantity'), extra: { unitId }});
        }
    }
    else if (checkObj.function==='writeSingleCoil' || checkObj.function==='writeSingleRegister'){
        if(checkObj.address===undefined) errorHandler(new Error('address is not provided.'), true) ;
        if(checkObj.value===undefined) errorHandler(new Error('value is not provided.'), true) ;
        checkFunc = async (unitId)=>{
            return await modbusConnection[checkObj.function]({..._.pick(checkObj, 'address', 'value'), extra: { unitId }});
        }
    }
    else if (checkObj.function==='writeMultipleCoils' || checkObj.function==='writeMultipleRegisters'){
        if(checkObj.address===undefined) errorHandler(new Error('address is not provided.'), true) ;
        if(checkObj.value===undefined) errorHandler(new Error('values is not provided.'), true) ;
        checkFunc = async (unitId)=>{
            return await modbusConnection[checkObj.function]({..._.pick(checkObj, 'address', 'values'), extra: { unitId }});
        }
    }
    else  errorHandler(new Error(`Unsupported function '${checkObj.function}'.`));

    const multibar = new cliProgress.MultiBar({}, cliProgress.Presets.shades_grey);
    const size = to -from +1;
    const btry = multibar.create(size, 0);
    const bresult = multibar.create(size, 0);

    const promises = [];

    let currentSlaveId = from;
    let pendingAmount = 0;
    let finished = false;

    if(timeout<2) console.warn(`\x1b[33mTimeout is too low. The result may be wrong.`);
    let intervalTimeout = setInterval(async ()=>{
        const slaveId = currentSlaveId;
        btry.increment();
        currentSlaveId++;
        pendingAmount++;
        promises.push(checkFunc(slaveId).then(() => {
            bresult.increment();
            multibar.stop();
            clearInterval(intervalTimeout);
            finished = true;
            console.log('\x1b[33mSlave id found:\x1b[0m '+slaveId);
            modbusConnection.off('connect', connectHandler);
            modbusConnection.off('close', closeHandler);
            modbusConnection.on('error', ()=>{});
            modbusConnection.off('error', errorHandler);
            modbusConnection.close();
        }, () => {
            bresult.increment();
        }).then(function(){
            pendingAmount--;
            if(finished && pendingAmount===0){
                console.log('\x1b[31mCannot find slaveId.\x1b[0m');
                process.exit(1);
            }
        }));
        if (slaveId>=to) {
            clearInterval(intervalTimeout);
            finished = true;
        }
    }, timeout*1000);
}
async function setDeviceSlaveId (yarv) {
    let modbusConnectionConfig = {
        type                    : yarv.protocol,
        ip                      : yarv.host,
        port                    : yarv.port,
        reconnect               : false,
        retryConnectionInterval : 0
    };
    
    const { helpers : { set_slave_id }, params } = loadConfigs(yarv.hardware);
    if (!set_slave_id) errorHandler(new Error(`Cannot find helper config for hardware ${yarv.hardware}`));


    const ModbusConnection = require(path.resolve(__dirname, '../lib/modbus-bridge/modbus_connection'));

    const modbusConnection = new ModbusConnection({ ...modbusConnectionConfig, debug: null });
    const connectHandler = () => {
        console.log('\x1b[32mConnected\x1b[0m');
    };
    const closeHandler = () => {
        console.log('\x1b[33mConnection closed\x1b[0m');
    };
    modbusConnection.on('connect', connectHandler);
    modbusConnection.on('close', closeHandler);
    modbusConnection.on('error', errorHandler);
    await modbusConnection.connect();
    if (!modbusConnection.connected) errorHandler(new Error('Connection is not established'));


    var res = await set_slave_id({modbusConnection, currentSlaveId: yarv['current-slave-id'], newSlaveId: yarv['new-slave-id'], params });
    console.log('\x1b[32mOK: \x1b[0m old slave id - '+yarv['current-slave-id']);
    console.log('\x1b[32mOK: \x1b[0m new slave id - '+yarv['new-slave-id']);

    modbusConnection.off('connect', connectHandler);
    modbusConnection.off('close', closeHandler);
    modbusConnection.on('error', ()=>{});
    modbusConnection.off('error', errorHandler);
    modbusConnection.close();
}


const argv = yargs
    .command('list', 'Get list of supported devices', function (yargs){
        return yargs;
    }, showSupportedDeviceList)
    .command('scan', 'Scan bus for a slave id', function (yargs){
        return yargs
            .option('protocol', {
                description : 'Protocol to use',
                choices     : ['tcp'],
                type: 'string',
                default : 'tcp',
                implies:['host', 'port']
            })
            .option('host', {
                description: 'Host or ip address',
                type: 'string'
            })
            .option('port', {
                description: 'Port number',
                type: 'number',
                default : 502
            })
            .option('hardware', {
                description: 'Name of hardware to load test function',
                type: 'string'
            })
            .option('function', {
                description: 'Function to exec to test',
                type: 'string',
                choices: ['readCoils', 'readDiscreteInputs', 'readHoldingRegisters', 'readInputRegisters', 'writeSingleCoil', 'writeSingleRegister', 'writeMultipleCoils', 'writeMultipleRegisters'],
                default:'readCoils'
            })
            .option('quantity', {
                description: 'Modbus parameter for read operations. Number of data units to read.',
                type: 'number',
                default:1
            })
            .option('data', {
                description: 'Modbus parameter for write operations. HEX representation of data in case of registers, or string of bits(0 or 1). Length should be 4 characters(i.e. 1 register) if function works with single register, or 1 character if function works with 1 coil.',
                type: 'string'
            })
            .option('address', {
                description: 'Address for modbus operations.',
                type: 'string',
                default:0
            })
            .option('from', {
                description: 'Slave id to start from',
                type: 'number',
                default:0,
            }).requiresArg(['protocol', 'host','port', 'name'])
            .option('to', {
                description: 'Slave id to end with',
                type: 'number',
                default:247,
            })
            .option('timeout', {
                description: 'Timeout(in seconds) between tries',
                type: 'number',
                default:2,
            }).requiresArg(['protocol', 'host','port', 'from', 'to']);
    }, scanDeviceSlaveId)
    .command('set-slave-id', 'Set slave id for a device', function (yargs){
        return yargs
            .option('protocol', {
                description : 'Protocol for to use',
                choices     : ['tcp'],
                type: 'string',
                default : 'tcp',
                implies:['host', 'port'],
                demandOption: true
            })
            .option('host', {
                description: 'Host or ip address',
                type: 'string'
            })
            .option('port', {
                description: 'Port number',
                type: 'number',
                default : 502
            })
            .option('hardware', {
                description: 'Name of current device',
                type: 'string',
                demandOption: true
            })
            .option('current-slave-id', {
                description: 'Current slave id',
                type: 'number',
                demandOption: true
            }).option('new-slave-id', {
                description: 'News slave id',
                type: 'number',
                demandOption: true
            }).requiresArg(['protocol', 'host','port', 'hardware']);
    }, setDeviceSlaveId)
    .demandCommand(1, 'ERROR: missing parametrs. See: -h')
    .help()
    .alias('help', 'h')
    .argv;