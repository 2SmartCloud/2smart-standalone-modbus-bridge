const Promise = require('bluebird');
// eslint-disable-next-line import/no-extraneous-dependencies
const _ = require('underscore');
const BaseTransport = require('homie-sdk/lib/Bridge/BasePropertyTransport');


class ModbusTransport extends BaseTransport {
    constructor(config) {
        super(config);
        // bindind handlers~
        this.handleModbusConnectionReady = this.handleModbusConnectionReady.bind(this);
        this.handleModbusDisconnect = this.handleModbusDisconnect.bind(this);
        // ~bindind handlers

        if (this.debug) this.debug.info('ModbusTransport.constructor');
        this.pollInterval = (config.pollInterval === undefined) ? (parseInt(process.env.POLL_INTERVAL, 10) || 5000) : config.pollInterval;
        this.pollErrorTimeout = config.pollErrorTimeout || this.pollInterval;
        this.bridge = config.bridge;
        this.slaveId = config.slaveId;

        this.communication = {
            get : null,
            set : null
        };
        this.polling = false;
        const defautlsComParams = _.pick(config, 'function', 'address', 'quantity');

        let comParams = {};

        if (config.advanced) {
            comParams = config.advanced.get;
        }
        if (comParams !== null) {
            comParams = { ...defautlsComParams, ... comParams };
            if (comParams.function !== 'coils'
                && comParams.function !== 'discrete-inputs'
                && comParams.function !== 'holding-registers'
                && comParams.function !== 'input-registers') {
                throw new Error(`ModbusTransport::constructor : Wrong get function type(${comParams.function}).`);
            }
            if (comParams.address === undefined) throw new Error('ModbusTransport::constructor : address is not specified.');
            if (comParams.quantity === undefined) comParams.quantity = 1;
        }
        this.communication.get = comParams;


        comParams = {};
        if (config.advanced) {
            comParams = config.advanced.set;
        } else {
            if (config.function !== 'discrete-inputs'
                && config.function !== 'input-registers') comParams = null;
        }

        if (comParams !== null) {
            comParams = { ...defautlsComParams, ...comParams };
            if (comParams.function !== 'discrete-inputs'
                && comParams.function !== 'input-registers') throw new Error(`ModbusTransport::constructor : Wrong set function type(${comParams.function}).`);
            if (comParams.address === undefined) throw new Error('ModbusTransport::constructor : address is not specified.');
            if (comParams.quantity === undefined) comParams.quantity = 1;
        }
        this.communication.set = comParams;

        // eslint-disable-next-line more/no-duplicated-chains
        this.settable = !!this.communication.set;
    }
    // sync
    attachBridge(bridge) {
        if (this.bridge) {
            if (bridge === this.bridge) return;
            throw new Error('Another bridge is already attached.');
        }
        super.attachBridge(bridge);
        this.bridge.modbusConnection.on('connection.ready', this.handleModbusConnectionReady);
        this.bridge.modbusConnection.on('timeout', this.handleModbusDisconnect);
        this.bridge.modbusConnection.on('close', this.handleModbusDisconnect);
    }
    detachBridge() {
        this.bridge.modbusConnection.off('connection.ready', this.handleModbusConnectionReady);
        this.bridge.modbusConnection.off('timeout', this.handleModbusDisconnect);
        this.bridge.modbusConnection.off('close', this.handleModbusDisconnect);
        super.detachBridge();
    }
    // async
    async get() {
        if (this.debug) this.debug.info('ModbusTransport.get');
        const communication = this.communication.get;

        if (!communication) throw new Error('Transport is not configured to get.');
        const { address, quantity } = communication;
        const f = communication.function;

        const connection = this.bridge.modbusConnection;

        if (!connection.connected) throw new Error('Modbus connection is not established.');

        /* return await new Promise((resolve, reject) => {
            const handler = (error, result) => {
                if (error) reject(error);
                else resolve(result.response.data);
            };
            const extra = { unitId: this.slaveId };

            if (f === 'coils') connection.readCoils({ address, quantity, extra }, handler);
            else if (f === 'discrete-inputs') connection.readDiscreteInputs({ address, quantity, extra }, handler);
            else if (f === 'holding-registers') connection.readHoldingRegisters({ address, quantity, extra }, handler);
            else if (f === 'input-registers') connection.readInputRegisters({ address, quantity, extra }, handler);
        }) */
        return Promise.resolve().then(() => {
            const extra = { unitId: this.slaveId };

            if (f === 'coils') return connection.readCoils({ address, quantity, extra });
            else if (f === 'discrete-inputs') return connection.readDiscreteInputs({ address, quantity, extra });
            else if (f === 'holding-registers') return connection.readHoldingRegisters({ address, quantity, extra });
            else if (f === 'input-registers') return connection.readInputRegisters({ address, quantity, extra });
        }).then((result) => {
            return result.response.data;
        }).then((resData) => {
            this.emit('connected');
            this.handleNewData(resData);

            return resData;
        }, (error) => {
            this.emit('disconnected');
            throw error;
        });
    }
    async set(commandData, address_offset, realData) {
        if (this.debug) this.debug.info('ModbusTransport.set');
        const communication = this.communication.set;

        if (!communication) throw new Error('Transport is not configured to set.');
        const quantity = commandData.length;
        const address = communication.address + (address_offset || 0);

        if ((address < communication.address) || ((address + quantity) > (communication.address+communication.quantity))) throw new Error('Wrong address and quantity.');
        const f = communication.function;

        if (commandData.length !== quantity) throw new Error('Wrong incoming data size,');

        const connection = this.bridge.modbusConnection;

        if (!connection.connected) throw new Error('Modbus connection is not established.');

        if (!realData) realData = commandData;
        /* return await new Promise((resolve, reject) => {
            // eslint-disable-next-line func-style
            const handler = (error, result) => {
                if (error) reject(error);
                else resolve(result.response);
            };

            const extra = { unitId: this.slaveId };

            if (quantity === 1) {
                if (f === 'discrete-inputs') connection.writeSingleCoil({ address, value: data[0], extra }, handler);
                else if (f === 'input-registers') connection.writeSingleRegister({ address, value: data[0] }, handler);
            } else {
                if (f === 'discrete-inputs') connection.writeMultipleCoils({ address, values: data, extra }, handler);
                else if (f === 'input-registers') connection.writeMultipleRegisters({ address, values: data }, handler);
            }
        }) */
        let way=null;

        let timeout = null;

        let resolve=null;

        let reject = null;

        const promise = new Promise((_resolve, _reject) => {
            resolve = _resolve;
            reject = _reject;
        });
        const handlePoll = (pollledDta) => {
            if (this.debug) this.debug.info('ModbusTransport.set.handlePoll.1');
            if (way!==null) return;
            way = 'forcedPoll';
            clearTimeout(timeout);
            this.off('afterPoll', handlePoll);

            if (this.debug) this.debug.info('ModbusTransport.set.handlePoll.2');
            resolve(pollledDta);
        };

        Promise.resolve().then(() => {
            if (this.debug) this.debug.info('ModbusTransport.set.commmon.1');
            const extra = { unitId: this.slaveId };

            if (quantity === 1) {
                if (f === 'discrete-inputs') return connection.writeSingleCoil({ address, value: commandData[0], extra });
                else if (f === 'input-registers') return connection.writeSingleRegister({ address, value: commandData[0], extra });
            } else {
                if (f === 'discrete-inputs') return connection.writeMultipleCoils({ address, values: commandData, extra });
                else if (f === 'input-registers') return connection.writeMultipleRegisters({ address, values: commandData, extra });
            }
        }).then((result) => {
            if (this.debug) this.debug.info('ModbusTransport.set.commmon.2');
            return result.response;
        }).then(() => {
            if (this.debug) this.debug.info('ModbusTransport.set.commmon.3');
            if (way!==null) return;
            way = 'commmon';
            clearTimeout(timeout);
            this.off('afterPoll', handlePoll);
            if (this.debug) this.debug.info('ModbusTransport.set.commmon.4');

            const newDate = _.clone(this.data) || [];

            realData.forEach((v, i) => {
                newDate[address_offset + i] = v;
            });
            this.emit('connected');
            this.handleNewData(newDate, true);
            resolve(newDate);
        }, (error) => {
            if (this.debug) this.debug.info('ModbusTransport.set.commmon.5');
            if (way!==null) return;
            way = 'commmon';
            clearTimeout(timeout);
            this.off('afterPoll', handlePoll);

            if (this.debug) this.debug.info('ModbusTransport.set.commmon.6');
            this.emit('disconnected');
            reject(error);
        });

        timeout = setTimeout(async () => {
            if (this.debug) this.debug.info('ModbusTransport.set.setTimeout.1');
            if (!this.polling) {
                if (this.debug) this.debug.info('ModbusTransport.set.setTimeout.2');
                this.poll(0);
            }
            if (this.debug) this.debug.info('ModbusTransport.set.setTimeout.3');
            this.once('afterPoll', handlePoll);
        }, 1000);
        return promise;
    }
    // handlers~
    async handleModbusConnectionReady() {
        this.enablePolling();
    }
    async handleModbusDisconnect() {
        this.disablePolling();
    }
    // ~handlers
}

module.exports = ModbusTransport;
