// eslint-disable-next-line import/no-extraneous-dependencies
const EventEmitter = require('events');
const _ = require('underscore');
const Promise = require('bluebird');
const Deferred = require('./../Deferred/Deferred');

const OFFLINE_UNITS_DELAY = 30000;
const ONLINE_UNITS_DELAY = 120;


class ModbusConnection extends EventEmitter {
    constructor(config) {
        super();
        // bindind handlers~
        this._handleConnectError = this._handleConnectError.bind(this);
        this._handleConnect = this._handleConnect.bind(this);
        this._retryConnection = this._retryConnection.bind(this);
        // ~bindind handlers

        config = _.defaults(_.clone(config), {
            type      : 'tcp',
            reconnect : true
        });

        if (config.type === 'tcp') {
            _.defaults(config, {
                ip                      : 'localhost',
                port                    : 502,
                retryConnectionInterval : 10000,
                connectionTimeout       : 600000,
                maxParallelRequests     : 10,
                retriesAmount           : 2
            });
        } else {
            throw new Error(`Unsupported modbus connection type(${config.type})`);
        }
        this.connectionConfig = config;
        this.client = null;
        this.connected = false;
        this.sendGap = Math.max(config.sendGap || 0, ONLINE_UNITS_DELAY); // ms between requests
        this.offlineSendGap = Math.max(config.offlineSendGap || OFFLINE_UNITS_DELAY, ONLINE_UNITS_DELAY); // ms between requests
        this.lastTimeSend = new Date(0);
        this.lastTimeSendOfflineUnit = new Date(0);
        this.onlineUnits = {};
        this.offlineUnits = {};
        this.totalUniqUnitIds = 0;

        // DEBUG
        this.debug = config.debug || null;
        // DEBUG END

        this._requests = [];
        [ 'readCoils', 'readDiscreteInputs', 'readHoldingRegisters', 'readInputRegisters',
            'writeSingleCoil', 'writeSingleRegister', 'readExceptionStatus', 'getCommEventCounter',
            'getCommEventLog', 'writeMultipleCoils', 'writeMultipleRegisters', 'readFileRecord',
            'writeFileRecord', 'maskWriteRegister', 'readWriteMultipleRegisters', 'readFifoQueue',
            'readDeviceIdentification' ].forEach(async (name) => {
            this[name] = async (data) => {
                const request = {
                    deferred : new Deferred(),
                    sent     : false,
                    unitId   : data.extra.unitId,
                    retries  : this.connectionConfig.retriesAmount
                };

                const after = () => {
                    this._requests = this._requests.filter((_request) => request !==  _request);
                    this._dispatchNextRequest();
                };
                const send = () => {
                    if (this.debug) this.debug.info('ModbusConnection.send');
                    request.deferred._clearTimeout();
                    if (!this.connected) {
                        request.deferred.reject(Error('Modbus connection is not established.'));
                        return;
                    }
                    this.client[name](data, (err, results) => {
                        if (request.deleted) {
                            request.deferred.reject(new Error('Deleted.'));
                            return;
                        }
                        if (err) {
                            if (err.message==='GatewayTargetDeviceFailedToRespond' && request.retries>0) {
                                request.retries--;
                                request.sent=false;
                                this._dispatchNextRequest();
                            } else {
                                this._handleUnitOffline(request.unitId);
                                request.deferred.reject(err);
                            }
                        }
                        else {
                            this._handleUnitOnline(request.unitId);
                            request.deferred.resolve(results);
                        }
                    });
                };


                request.deferred.registerTimeout(this.connectionConfig.connectionTimeout, () => {
                    request.deferred.reject(new Error('Timeout.'));
                });
                request.send = send;
                this._requests.push(request);
                this._dispatchNextRequest();

                return request.deferred._promise.tap(after).tapCatch(after);
            };
        });
        this._dispatchNextRequest = this._dispatchNextRequest.bind(this);
    }
    isConnected() {
        // return Object.keys(this.onlineUnits).length > 0;
        return Object.keys(this.onlineUnits).length > 0
            && (Object.keys(this.onlineUnits).length + Object.keys(this.offlineUnits).length >= this.totalUniqUnitIds);
    }
    onDeleteUnit(unitId) {
        this.totalUniqUnitIds--;
        this._requests.forEach((request) => {
            if (request.unitId !== unitId) return;
            if (request.sent) request.deleted = true;
            else request.deffeted.reject(new Error('Deleted.'));
        });
        this._handleUnitOffline(unitId);
    }
    _handleUnitOffline(unitId) {
        if (this.debug) this.debug.info('ModbusConnection._handleUnitOffline', { unitId });
        const before = this.isConnected();

        delete this.onlineUnits[unitId];
        this.offlineUnits[unitId] = true;
        const after = this.isConnected();

        if (this.debug) this.debug.info('ModbusConnection._handleUnitOffline', { before, after });

        if (before && !after) {
            if (this.debug) this.debug.info('ModbusConnection._handleUnitOffline', 'here 1');

            if (this.connected) {
                this._destroyConnection();
                this.emit('timeout');
                if (this.connectionConfig.reconnect) this._retryConnection(true);
            }
        } else if (!before && after) {
            if (this.debug) this.debug.info('ModbusConnection._handleUnitOffline', 'here 2');

            this.emit('connect', this.client);
        }
    }
    _handleUnitOnline(unitId) {
        if (this.debug) this.debug.info('ModbusConnection._handleUnitOnline', { unitId, off: this.offlineUnits, on: this.onlineUnits });
        const before = this.isConnected();

        this.onlineUnits[unitId] = true;
        delete this.offlineUnits[unitId];
        const after = this.isConnected();

        if (this.debug) this.debug.info('ModbusConnection._handleUnitOnline', { before, after });
        if (!before) {
            this._resetConnectionTimeout(false);
        }
        if (!before && after) {
            this.emit('connect', this.client);
        }
    }
    _dispatchNextRequest() {
        if (this._requests.filter((_request) => _request.sent).length >= 10) return;
        const connected = this.isConnected();
        const requests = this._requests.filter((_request) => {
            return !_request.sent
                && this._requests.filter((__request) => __request.unitId === _request.unitId && __request.sent).length < this.connectionConfig.maxParallelRequests;
        });

        if (this.debug) {this.debug.info('ModbusConnection._dispatchNextRequest', {
            connected,
            requests_length         : requests.length,
            onlineUnits             : this.onlineUnits,
            offlineUnits            : this.offlineUnits,
            lastTimeSendOfflineUnit : this.lastTimeSendOfflineUnit
        });}
        if (!requests.length) return;

        const offlineDelay = this.offlineSendGap - (new Date() - this.lastTimeSendOfflineUnit);

        const request = requests.find((_request) => {
            return (!connected || offlineDelay <= 0 || !this.offlineUnits[_request.unitId]);
        });

        if (!request) {
            setTimeout(this._dispatchNextRequest.bind(this), offlineDelay);
            return;
        }
        if (this.debug) {this.debug.info('ModbusConnection._dispatchNextRequest', {
            offlineDelay,
            unitId              : request.unitId,
            total               : this._requests.length,
            maxParallelRequests : this.connectionConfig.maxParallelRequests,
            all                 : _.values(_.groupBy(this._requests, (r) => r.unitId)).map((m) => { return { unitId: m[0].unitId, a: m.length, s: m.filter((r) => r.sent).length, p: m.filter((r) => !r.sent).length }; }),
            sent                : this._requests.filter((_request) => _request.unitId === request.unitId && _request.sent).length,
            pending             : this._requests.filter((_request) => _request.unitId === request.unitId && !_request.sent).length
        });}

        // if (this._requests.filter((_request) => _request.unitId === request.unitId && _request.sent).length >= this.connectionConfig.maxParallelRequests) return;

        if (request) {
            const delay = this.sendGap - (new Date() - this.lastTimeSend);

            if (this.debug) this.debug.info('ModbusConnection._dispatchNextRequest', { delay, sendGap: this.sendGap, lastTimeSend: this.lastTimeSend });
            if (delay>0) {
                setTimeout(this._dispatchNextRequest.bind(this), delay);
            } else {
                this.lastTimeSend = new Date();
                if (this.offlineUnits[request.unitId]) this.lastTimeSendOfflineUnit = this.lastTimeSend;
                request.sent = true;
                process.nextTick(request.send);
            }
        }
    }
    /* readCoils() { if (!this.connected) throw new Error('Modbus connection is not established.'); return this.client.readCoils(...arguments); }
    readDiscreteInputs() { if (!this.connected) throw new Error('Modbus connection is not established.'); return this.client.readDiscreteInputs(...arguments); }
    readHoldingRegisters() { if (!this.connected) throw new Error('Modbus connection is not established.'); return this.client.readHoldingRegisters(...arguments); }
    readInputRegisters() { if (!this.connected) throw new Error('Modbus connection is not established.'); return this.client.readInputRegisters(...arguments); }
    writeSingleCoil() { if (!this.connected) throw new Error('Modbus connection is not established.'); return this.client.writeSingleCoil(...arguments); }
    writeSingleRegister() { if (!this.connected) throw new Error('Modbus connection is not established.'); return this.client.writeSingleRegister(...arguments); }
    readExceptionStatus() { if (!this.connected) throw new Error('Modbus connection is not established.'); return this.client.readExceptionStatus(...arguments); }
    getCommEventCounter() { if (!this.connected) throw new Error('Modbus connection is not established.'); return this.client.getCommEventCounter(...arguments); }
    getCommEventLog() { if (!this.connected) throw new Error('Modbus connection is not established.'); return this.client.getCommEventLog(...arguments); }
    writeMultipleCoils() { if (!this.connected) throw new Error('Modbus connection is not established.'); return this.client.writeMultipleCoils(...arguments); }
    writeMultipleRegisters() { if (!this.connected) throw new Error('Modbus connection is not established.'); return this.client.writeMultipleRegisters(...arguments); }
    readFileRecord() { if (!this.connected) throw new Error('Modbus connection is not established.'); return this.client.readFileRecord(...arguments); }
    writeFileRecord() { if (!this.connected) throw new Error('Modbus connection is not established.'); return this.client.writeFileRecord(...arguments); }
    maskWriteRegister() { if (!this.connected) throw new Error('Modbus connection is not established.'); return this.client.maskWriteRegister(...arguments); }
    readWriteMultipleRegisters() { if (!this.connected) throw new Error('Modbus connection is not established.'); return this.client.readWriteMultipleRegisters(...arguments); }
    readFifoQueue() { if (!this.connected) throw new Error('Modbus connection is not established.'); return this.client.readFifoQueue(...arguments); }
    readDeviceIdentification() { if (!this.connected) throw new Error('Modbus connection is not established.'); return this.client.readDeviceIdentification(...arguments); } */
    async connect() {
        if (this.debug) this.debug.info('ModbusConnection.connect');
        await this.close();
        const { connect } = require('../modbus-stream')[this.connectionConfig.type];

        return new Promise((resolve, reject) => {
            function handle(err, client) {
                if (err) return reject(err);
                resolve(client);
            }

            if (this.connectionConfig.type === 'tcp') {
                connect(this.connectionConfig.port, this.connectionConfig.ip, { retries: 0, retry: 16000, debug: this.debug || null }, handle);
            }
            else reject(new Error('Unsupported connection type.'));
        }).then(this._handleConnect, (error) => {
            this._handleConnectError(error);
            if (this.connectionConfig.reconnect) this._retryConnection();
        });
    }
    async reconnect() {
        if (this.debug) this.debug.info('ModbusConnection.reconnect');
        await this.close();
        await this.connect();
    }
    async close() {
        if (this.debug) this.debug.info('ModbusConnection.close');
        this._destroyConnection();
        clearTimeout(this._retryConnectionTimeout);
    }

    // MODBUS CONNECTION HANDLE BEGIN
    /* events:
    * 'error'
    * 'connect'
    * 'close'
    * */
    _handleConnectError(error) {
        if (this.debug) this.debug.info('ModbusConnection.error', error);
        // console.error(err);
        // this._retryConnection();
        this.emit('close');
        this.emit('error', error);
    }
    _handleConnect(client) {
        if (this.debug) this.debug.info('ModbusConnection._handleConnect');
        let timeout = null;

        const clear = () => {
            if (this.debug) this.debug.info('ModbusConnection._handleConnect.clear');
            delete this._clearConnection;
            delete this._resetConnectionTimeout;
            client.on('error', () => { });
            client.off('close', onConnClose);
            client.off('error', onConnError);
        };
        const resetTimeout = (start = true) => {
            if (this.debug) this.debug.info('ModbusConnection._handleConnect.resetTimeout');
            clearTimeout(timeout);
            const retryConnectionInterval = this.connectionConfig.retryConnectionInterval;

            if (!start || retryConnectionInterval === 0) return;
            timeout = setTimeout(() => {
                if (this.debug) this.debug.info('ModbusConnection._handleConnect.resetTimeout timeout');
                this._destroyConnection();
                this.emit('timeout');

                if (this.connectionConfig.reconnect) this._retryConnection(true);
            }, retryConnectionInterval);
        };
        const onConnClose = () => {// TOTEST. Tested. Event is not emitting.
            if (this.debug) this.debug.info('ModbusConnection._handleConnect.onConnClose');
            this._destroyConnection();
            this.emit('close');
            if (this.connectionConfig.reconnect) this._retryConnection();
        };
        const onConnError = (error) => {// TOTEST, maybe connection is still okey or not. Tested. Event is not emitting.
            if (this.debug) this.debug.info('ModbusConnection._handleConnect.onConnError');
            this._handleConnectError(error);
            this._destroyConnection();
            this.emit('close');
            if (this.connectionConfig.reconnect) this._retryConnection();
        };

        client.on('close', onConnClose);
        client.on('error', onConnError);
        this.client = client;
        this.connected = true;

        resetTimeout(true);
        this._resetConnectionTimeout = resetTimeout;
        this._clearConnection = () => {
            resetTimeout(false);
            clear();
            client.close();
        };

        this.emit('connection.ready', client);
    }
    _retryConnection(immidiatelly) {
        if (this.debug) this.debug.info('ModbusConnection._retryConnection');
        this._destroyConnection();
        clearTimeout(this._retryConnectionTimeout);// For any case
        this._retryConnectionTimeout = setTimeout(this.reconnect.bind(this), (immidiatelly) ? 0 : this.connectionConfig.retryConnectionInterval);
    }
    _destroyConnection() {
        if (this.debug) this.debug.info('ModbusConnection._destroyConnection');
        if (this.connected) {
            this.client = null;
            this.connected = false;
            this._clearConnection();
            while (this._requests.length) {
                if (this.debug) this.debug.info(`ModbusConnection._destroyConnection this._requests.length = ${this._requests.length}`);
                const request = this._requests.pop();

                this._handleUnitOffline(request.unitId);
                request.deferred.reject(new Error('Connection closed.'));
            }
            this._requests = [];
            for (const unitId of Object.keys(this.onlineUnits)) {
                this._handleUnitOffline(unitId);
            }
            this.onlineUnits = {};
            this.offlineUnits = {};
        }
    }
    // MODBUS CONNECTION HANDLE END
}

ModbusConnection.create = async function (config) {
    return new ModbusConnection(config);
};

module.exports = ModbusConnection;
