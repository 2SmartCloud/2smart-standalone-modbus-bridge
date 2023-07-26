// eslint-disable-next-line import/no-extraneous-dependencies
const EventEmitter = require('events');
const _ = require('underscore');
// const Promise = require('bluebird');
const BaseBridge = require('homie-sdk/lib/Bridge');
const MQTTTransport = require('homie-sdk/lib/Broker/mqtt');
const Homie = require('homie-sdk/lib/homie/Homie');
const ModbusConnection = require('./modbus_connection');
const DeviceBridge = require('./device');

class ModbusBridge extends BaseBridge {
    constructor(config) {
        const mqttConnectionConfig = _.defaults(_.clone(config.mqttConnection || {}), {
            username : '',
            password : '',
            uri      : 'mqtt://localhost:1883'
        });
        const transport = new MQTTTransport({
            ...mqttConnectionConfig,
            tls : { enable: true, selfSigned: true }
        });

        const homie = new Homie({ transport });

        super({ homie });
        this.mqttConnectionConfig = mqttConnectionConfig;
        this.homieConnected = false;

        /* const modbusConnectionConfig = _.defaults(_.clone(config.modbusConnection || {}), {
            type : 'tcp'
        }); */

        this.modbusConnection = new ModbusConnection({ ...config.modbusConnection, debug: config.debug });
        /* if (modbusConnectionConfig.type === 'tcp') {
            _.defaults(modbusConnectionConfig, {
                ip                      : 'localhost',
                port                    : 502,
                retryConnectionInterval : 10000,
                connectionTimeout       : 10000
            });
        } else {
            throw new Error(`Unsupported modbus connection type(${modbusConnectionConfig.type})`);
        }

        this.modbusConnectionConfig = modbusConnectionConfig;
        this.modbusConnection = null; */

        this.modbusDeviceBridge = new DeviceBridge({
            ...config.device,
            bridge : this,
            debug  : config.debug
        });

        // modbusConnectionTimeoutsOptimization here
        const calcTransportqueries = (memo, propertyTransport) => {
            const commset = propertyTransport.communication.set;

            return memo + (commset && commset.quantity || 0);
        };
        const totalSetQueries = _.reduce(this.modbusDeviceBridge.propertyTransports.filter((t) => t.constructor.name === 'ModbusTransport'), calcTransportqueries, 0)
        + _.reduce(this.modbusDeviceBridge.nodes, (memo, node) => {
            return memo + _.reduce(node.propertyTransports.filter((t) => t.constructor.name === 'ModbusTransport'), calcTransportqueries, 0);
        }, 0);
        const totalTransports = this.modbusDeviceBridge.propertyTransports.filter((t) => t.constructor.name === 'ModbusTransport').length
            + _.reduce(this.modbusDeviceBridge.nodes, (memo, node) => {
                return memo + node.propertyTransports.filter((t) => t.constructor.name === 'ModbusTransport').length;
            }, 0);
        const totalUniqUnitIds = _.uniq([
            ... this.modbusDeviceBridge.propertyTransports.filter((t) => t.constructor.name === 'ModbusTransport').map((t) => t.node.slaveId),
            ... _.flatten(this.modbusDeviceBridge.nodes.map((node) => {
                return node.propertyTransports.filter((t) => t.constructor.name === 'ModbusTransport').map((t) => t.node.slaveId);
            }))
        ]).length;

        const retryConnectionInterval = this.modbusConnection.connectionConfig.retryConnectionInterval;
        const sendGap = this.modbusConnection.sendGap;
        const offlineSendGap = this.modbusConnection.offlineSendGap;

        const minPollInterval = Math.ceil((totalTransports + totalSetQueries) * Math.max(sendGap, 100));
        const minConnectionTimeout = Math.ceil((totalTransports + totalSetQueries) * offlineSendGap);

        // eslint-disable-next-line more/no-duplicated-chains
        if (process.env.POLL_INTERVAL && process.env.POLL_INTERVAL < minPollInterval) {
            console.warn(`process.env.POLL_INTERVAL=${process.env.POLL_INTERVAL} is too small, minimal pollInterval is ${minPollInterval}`);
            // process.exit(1);
        }
        this.modbusDeviceBridge.propertyTransports.forEach((t) => {
            t.pollInterval = Math.max(minPollInterval, t.pollInterval);
            t.pollErrorTimeout = Math.max(minPollInterval, t.pollErrorTimeout);
        });
        this.modbusDeviceBridge.nodes.forEach((node) => {
            node.propertyTransports.forEach((t) => {
                t.pollInterval = Math.max(minPollInterval, t.pollInterval);
                t.pollErrorTimeout = Math.max(minPollInterval, t.pollErrorTimeout);
            });
        });

        // eslint-disable-next-line more/no-duplicated-chains
        this.modbusConnection.connectionConfig.retryConnectionInterval = Math.max(retryConnectionInterval || 0, Math.ceil((totalTransports+1)*16000/10));
        this.modbusConnection.connectionConfig.connectionTimeout = Math.max(this.modbusConnection.connectionConfig.connectionTimeout || 0, minConnectionTimeout);
        this.modbusConnection.totalUniqUnitIds = totalUniqUnitIds;
        // modbusConnectionTimeoutsOptimization end

        this._events = new EventEmitter();

        this._handleHomieConnect = this._handleHomieConnect.bind(this);

        // this._handleModbusConnectError = this._handleModbusConnectError.bind(this);
        this._handleModbusConnectionReady = this._handleModbusConnectionReady.bind(this);
        this._handleModbusConnect = this._handleModbusConnect.bind(this);
        this._handleModbusClose = this._handleModbusClose.bind(this);
        this._handleModbusTimeout = this._handleModbusTimeout.bind(this);
        this.handleErrorPropagate = this.handleErrorPropagate.bind(this);


        // DEBUG
        this.debug = config.debug || null;
        // DEBUG END
    }
    async init() {
        if (this.debug) this.debug('ModbusBridge.init');
        this.modbusConnection.on('connection.ready', this._handleModbusConnectionReady);
        this.modbusConnection.on('connect', this._handleModbusConnect);
        this.modbusConnection.on('close', this._handleModbusClose);
        this.modbusConnection.on('timeout', this._handleModbusTimeout);
        this.modbusConnection.on('error', this.handleErrorPropagate);
        this.modbusConnection.connect();
        // this.connecModbus();
        this.homie.transport._ee.on('emqx_connect', this._handleHomieConnect);
        this.modbusDeviceBridge.on('error', this.handleErrorPropagate);
        await this.modbusDeviceBridge.start();
    }
    _handleHomieConnect() {
        if (this.debug) this.debug('ModbusBridge.homie._handleHomieConnect');
        this.homieConnected = true;
        this.emit('homie.connect');
    }
    _handleModbusConnectionReady() {
        if (this.debug) this.debug('ModbusBridge.homie._handleModbusConnectionReady');
        this.emit('modbus.connection.ready');
    }
    _handleModbusConnect() {
        if (this.debug) this.debug('ModbusBridge.homie._handleModbusConnect');
        this.emit('modbus.connect');
    }
    _handleModbusClose() {
        if (this.debug) this.debug('ModbusBridge.homie._handleModbusClose');
        this.emit('modbus.close');
    }
    _handleModbusTimeout() {
        if (this.debug) this.debug('ModbusBridge.homie._handleModbusTimeout');
        this.emit('modbus.timeout');
    }

    async destroy() {
        await this.modbusDeviceBridge.stop();
        this.modbusConnection.off('connection.ready', this._handleModbusConnectionReady);
        this.modbusConnection.off('connect', this._handleModbusConnect);
        this.modbusConnection.off('close', this._handleModbusClose);
        this.modbusConnection.off('timeout', this._handleModbusTimeout);
        this.modbusConnection.off('error', this.handleErrorPropagate);
        this.modbusConnection.close();
        this.modbusDeviceBridge.off('error', this.handleErrorPropagate);
        this.homie.transport._ee.off('emqx_connect', this._handleHomieConnect);
        this.homie.end();
    }

    // MODBUS CONNECTION HANDLE BEGIN
    /* events:
    * 'modbus.error'
    * 'modbus.connect'
    * 'modbus.close'
    * */

    /* connecModbus() {
        if (this.debug) this.debug('ModbusBridge.modbus.connecModbus');
        this._destroyModbusConnection();
        const { connect } = require('../modbus-stream')[this.modbusConnectionConfig.type];

        return new Promise((resolve, reject) => {
            function handle(err, connection) {
                if (err) return reject(err);
                resolve(connection);
            }

            if (this.modbusConnectionConfig.type === 'tcp') {
                connect(this.modbusConnectionConfig.port, this.modbusConnectionConfig.ip, handle);
            }
            else throw new Error('Unsupported connection type.');
        }).then(this._handleModbusConnect, (error) => {
            this._handleModbusConnectError(error);
            this._retryModbusConnection();
        });
    }
    _handleModbusConnectError(error) {
        if (this.debug) this.debug('ModbusBridge.modbus.error', error);
        // console.error(err);
        // this._retryModbusConnection();
        this.emit('modbus.error', error);
    }
    _handleModbusConnect(connection) {
        if (this.debug) this.debug('ModbusBridge.modbus._handleModbusConnect');
        let timeout = null;

        const clear = () => {
            if (this.debug) this.debug('ModbusBridge.modbus._handleModbusConnect.clear');
            connection.on('error', () => { });
            connection.off('close', onConnClose);
            connection.off('error', onConnError);
            connection.off('incoming-data', resetTimeout);
        };
        const resetTimeout = () => {
            if (this.debug) this.debug('ModbusBridge.modbus._handleModbusConnect.resetTimeout');
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                clear();
                connection.close();
                this.emit('modbus.timeout');
                this._retryModbusConnection();
            }, this.modbusConnectionConfig.retryConnectionInterval);
        };
        const onConnClose = () => {// TOTEST. Tested. Event is not emitting.
            if (this.debug) this.debug('ModbusBridge.modbus._handleModbusConnect.resetTimeout');
            clear();
            this.emit('modbus.close');
            this._retryModbusConnection();
        };
        const onConnError = (error) => {// TOTEST, maybe connection is still okey or not. Tested. Event is not emitting.
            if (this.debug) this.debug('ModbusBridge.modbus._handleModbusConnect.onConnError');
            clear();
            this._handleModbusConnectError(error);
        };

        connection.on('close', onConnClose);
        connection.on('error', onConnError);
        connection.on('incoming-data', resetTimeout);
        this.modbusConnection = connection;
        resetTimeout();
        this.emit('modbus.connect', connection);
    }
    _retryModbusConnection() {
        if (this.debug) this.debug('ModbusBridge.modbus._retryModbusConnection');
        this._destroyModbusConnection();
        clearTimeout(this._retryConnectionTimeout);// For any case
        this._retryConnectionTimeout = setTimeout(this.connecModbus.bind(this), this.modbusConnectionConfig.retryConnectionInterval);
    }
    _destroyModbusConnection() {
        if (this.debug) this.debug('ModbusBridge.modbus._destroyModbusConnection');
        if (this.modbusConnection) {
            this.modbusConnection.close();
        }
        this.modbusConnection = null;
    } */
    on() { return this._events.on(...arguments); }
    off() { return this._events.off(...arguments); }
    emit() { return this._events.emit(...arguments); }
    // MODBUS CONNECTION HANDLE END
    async handleErrorPropagate(error) {
        this.emit('error', error);
    }
}

ModbusBridge.create = async function (config) {
    return new ModbusBridge(config);
};

module.exports = ModbusBridge;
