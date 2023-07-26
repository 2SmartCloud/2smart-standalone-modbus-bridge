const Promise = require('bluebird');
// eslint-disable-next-line import/no-extraneous-dependencies
const _ = require('underscore');
const BasePropertyTransport = require('homie-sdk/lib/Bridge/BasePropertyTransport');


class ModbusTransport extends BasePropertyTransport {
    constructor(config) {
        super(config);

        if (this.debug) this.debug('ModbusTransport.constructor');
        this.pollInterval = (config.checkInterval === undefined) ? (parseInt(process.env.POLL_INTERVAL, 10) || 5000) : config.checkInterval;
        this.pollErrorTimeout = config.pollErrorTimeout || this.pollInterval;
        this.bridge = config.bridge;
        this.node = config.node;

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

        this._handlerNewData = this._handlerNewData.bind(this);
    }
    async get() {
        if (this.debug) this.debug('ModbusTransport.get');
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
            const extra = { unitId: this.node.slaveId };

            if (f === 'coils') connection.readCoils({ address, quantity, extra }, handler);
            else if (f === 'discrete-inputs') connection.readDiscreteInputs({ address, quantity, extra }, handler);
            else if (f === 'holding-registers') connection.readHoldingRegisters({ address, quantity, extra }, handler);
            else if (f === 'input-registers') connection.readInputRegisters({ address, quantity, extra }, handler);
        }) */
        return Promise.resolve().then(() => {
            const extra = { unitId: this.node.slaveId };

            if (f === 'coils') return connection.readCoils({ address, quantity, extra });
            else if (f === 'discrete-inputs') return connection.readDiscreteInputs({ address, quantity, extra });
            else if (f === 'holding-registers') return connection.readHoldingRegisters({ address, quantity, extra });
            else if (f === 'input-registers') return connection.readInputRegisters({ address, quantity, extra });
        }).then((result) => {
            return result.response.data;
        }).then((resData) => {
            this.emit('connected');
            this.emit('afterGet', resData);

            return resData;
        }, (error) => {
            this.emit('disconnected');
            throw error;
        });
    }
    async set(commandData, address_offset, realData) {
        if (this.debug) this.debug('ModbusTransport.set');
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

            const extra = { unitId: this.node.slaveId };

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
            if (this.debug) this.debug('ModbusTransport.set.handlePoll.1');
            if (way!==null) return;
            way = 'forcedPoll';
            clearTimeout(timeout);
            this.off('afterPoll', handlePoll);

            if (this.debug) this.debug('ModbusTransport.set.handlePoll.2');
            resolve(pollledDta);
        };

        Promise.resolve().then(() => {
            if (this.debug) this.debug('ModbusTransport.set.commmon.1');
            const extra = { unitId: this.node.slaveId };

            if (quantity === 1) {
                if (f === 'discrete-inputs') return connection.writeSingleCoil({ address, value: commandData[0], extra });
                else if (f === 'input-registers') return connection.writeSingleRegister({ address, value: commandData[0], extra });
            } else {
                if (f === 'discrete-inputs') return connection.writeMultipleCoils({ address, values: commandData, extra });
                else if (f === 'input-registers') return connection.writeMultipleRegisters({ address, values: commandData, extra });
            }
        }).then((result) => {
            if (this.debug) this.debug('ModbusTransport.set.commmon.2');
            return result.response;
        }).then(() => {
            if (this.debug) this.debug('ModbusTransport.set.commmon.3');
            if (way!==null) return;
            way = 'commmon';
            clearTimeout(timeout);
            this.off('afterPoll', handlePoll);
            if (this.debug) this.debug('ModbusTransport.set.commmon.4');

            const newDate = _.clone(this.data) || [];

            realData.forEach((v, i) => {
                newDate[address_offset + i] = v;
            });
            this.emit('connected');
            this.emit('afterSet', newDate);
            resolve(newDate);
        }, (error) => {
            if (this.debug) this.debug('ModbusTransport.set.commmon.5');
            if (way!==null) return;
            way = 'commmon';
            clearTimeout(timeout);
            this.off('afterPoll', handlePoll);

            if (this.debug) this.debug('ModbusTransport.set.commmon.6');
            this.emit('disconnected');
            reject(error);
        });

        timeout = setTimeout(async () => {
            if (this.debug) this.debug('ModbusTransport.set.setTimeout.1');
            if (!this.polling) {
                if (this.debug) this.debug('ModbusTransport.set.setTimeout.2');
                this.doPoll(0);
            }
            if (this.debug) this.debug('ModbusTransport.set.setTimeout.3');
            this.once('afterPoll', handlePoll);
        }, 1000);
        return promise;
    }
    async start() {
        if (this.debug) this.debug('ModbusTransport.start');
        this.on('afterGet', this._handlerNewData);
        this.on('afterSet', this._handlerNewData);
        this.startPolling();
    }
    async stop() {
        if (this.debug) this.debug('ModbusTransport.stop');
        this.off('afterGet', this._handlerNewData);
        this.off('afterSet', this._handlerNewData);
        this.stopPolling();
    }

    startPolling() {
        if (this.debug) this.debug('ModbusTransport.startPolling');
        this.doPoll();
    }
    doPoll(forceTimeout) {
        if (this.debug) this.debug('ModbusTransport.doPoll', { forceTimeout });
        clearTimeout(this.pollTimeout);
        if (this.pollInterval === null) return;
        if (this.pollInterval === 0 && this.data !== null) return;
        this.pollTimeout = setTimeout(async () => {
            if (this.debug) this.debug('ModbusTransport.doPoll.func.1');
            let errorOccured = false;

            this.polling = true;
            try {
                if (this.debug) this.debug('ModbusTransport.doPoll.func.2');
                const data = await this.get();

                this.polling = false;
                this.emit('afterPoll', data);
            } catch (e) {
                if (this.debug) this.debug('ModbusTransport.doPoll.func.3');
                errorOccured = true;
                this.emit('error', e);
            }
            if (this.debug) this.debug('ModbusTransport.doPoll.func.4');
            this.doPoll((errorOccured)?this.pollErrorTimeout:null);
        }, (forceTimeout!==undefined && forceTimeout!==null) ? forceTimeout : (this.data === null) ? 0 : this.pollInterval);
    }
    stopPolling() {
        if (this.debug) this.debug('ModbusTransport.stopPolling');
        clearTimeout(this.pollTimeout);
    }
    _handlerNewData(data) {
        if (this.isDataChanged(data)) {
            if (this.debug) this.debug('ModbusTransport._handlerNewData', { data, changed: this.isDataChanged(data), previousData: this.data });
            this.data = data;
            this.emit('dataChanged', data);
        }
    }
}

module.exports = ModbusTransport;
