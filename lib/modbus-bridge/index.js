const _ = require('underscore');

const BaseBridge = require('homie-sdk/lib/Bridge/Base');
const BaseDeviceBridge = require('homie-sdk/lib/Bridge/BaseDevice');
const DeviceBridge = require('./device');
const ModbusConnection = require('./modbus_connection');

class ModbusBridge extends BaseBridge {
    constructor(config) {
        super({ ...config, device: null });

        this.modbusConnection = new ModbusConnection({ ...config.modbusConnection, debug: config.debug });
        this.modbusConnection.on('error', this.handleErrorPropagate);

        if (config.device) {
            let deviceBridge = config.device;

            if (!(deviceBridge instanceof BaseDeviceBridge)) deviceBridge = new DeviceBridge({ ...deviceBridge, modbusConnectionIp: this.modbusConnection.connectionConfig.ip }, { debug: config.debug });
            this.setDeviceBridge(deviceBridge);
        }

        // DEBUG
        this.debug = config.debug || null;
        // DEBUG END
    }
    // sync
    init() {
        super.init();
        this.modbusConnection.connect();
    }
    destroy() {
        super.destroy();
        this.modbusConnection.close();
    }
    setDeviceBridge(deviceBridge) {
        super.setDeviceBridge(deviceBridge);

        // modbusConnectionTimeoutsOptimization here
        const calcTransportqueries = (memo, propertyTransport) => {
            const commset = propertyTransport.communication.set;

            return memo + (commset && commset.quantity || 0);
        };
        const totalSetQueries = _.reduce(this.deviceBridge.propertyTransports.filter((t) => t.constructor.name === 'ModbusTransport'), calcTransportqueries, 0)
        + _.reduce(this.deviceBridge.nodes, (memo, node) => {
            return memo + _.reduce(node.propertyTransports.filter((t) => t.constructor.name === 'ModbusTransport'), calcTransportqueries, 0);
        }, 0);
        const totalTransports = this.deviceBridge.propertyTransports.filter((t) => t.constructor.name === 'ModbusTransport').length
            + _.reduce(this.deviceBridge.nodes, (memo, node) => {
                return memo + node.propertyTransports.filter((t) => t.constructor.name === 'ModbusTransport').length;
            }, 0);
        const totalUniqUnitIds = _.uniq([
            ... this.deviceBridge.propertyTransports.filter((t) => t.constructor.name === 'ModbusTransport').map((t) => t.slaveId),
            ... _.flatten(this.deviceBridge.nodes.map((node) => {
                return node.propertyTransports.filter((t) => t.constructor.name === 'ModbusTransport').map((t) => t.slaveId);
            }))
        ]).length;

        const retryConnectionInterval = this.modbusConnection.connectionConfig.retryConnectionInterval;
        const sendGap = this.modbusConnection.sendGap;
        const offlineSendGap = this.modbusConnection.offlineSendGap;
        // eslint-disable-next-line no-unused-vars
        const retriesAmount = this.modbusConnection.retriesAmount;

        const minPollInterval = Math.ceil((totalTransports + totalSetQueries) * Math.max(sendGap, 120));
        const minConnectionTimeout = Math.ceil((totalTransports + totalSetQueries) * offlineSendGap);

        // eslint-disable-next-line more/no-duplicated-chains
        if (process.env.POLL_INTERVAL && process.env.POLL_INTERVAL < minPollInterval) {
            this.debug.warning('ModbusBridge.setDeviceBridge', `process.env.POLL_INTERVAL=${process.env.POLL_INTERVAL} is too small, minimal pollInterval is ${minPollInterval}`);
            // process.exit(1);
        }
        this.deviceBridge.propertyTransports.forEach((t) => {
            t.pollInterval = Math.max(minPollInterval, t.pollInterval);
            t.pollErrorTimeout = Math.max(minPollInterval, t.pollErrorTimeout);
        });
        this.deviceBridge.nodes.forEach((node) => {
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
    }
    // async
}

ModbusBridge.create = function (config) {
    return new ModbusBridge(config);
};

module.exports = ModbusBridge;
