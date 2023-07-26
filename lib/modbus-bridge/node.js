const BaseNodeBridge = require('homie-sdk/lib/Bridge/BaseNode');
const BasePropertyBridge = require('homie-sdk/lib/Bridge/BaseProperty');
const BasePropertyTransport = require('homie-sdk/lib/Bridge/BasePropertyTransport');
const { create : createTransport } = require('./property/transport');
const PropertyBridge = require('./property');

class NodeBridge extends BaseNodeBridge {
    constructor(config, { debug } = {}) {
        super({ ...config, transports: null, options: null, telemetry: null, sensors: null }, { debug });
        // bindind handlers~
        this.handleConnected = this.handleConnected.bind(this);
        this.handleDisconnected = this.handleDisconnected.bind(this);
        // ~bindind handlers
        const slaveId = config.slaveId || parseInt(config.id, 10);

        this.slaveId = slaveId;


        this.addTelemetry(new PropertyBridge({
            'dataTypeBridge' : {
                type          : 'raw',
                homieDataType : 'string'
            },
            'id'       : 'slaveid',
            'unit'     : '',
            'retained' : 'true',
            'settable' : 'false',
            'name'     : 'Slave Id'
        }, {
            type      : 'telemetry',
            transport : createTransport({
                type : 'static',
                data : slaveId
            })
        }));

        if (config.transports) {
            for (let transport of config.transports) {
                if (!(transport instanceof BasePropertyTransport)) transport = createTransport({ ...transport, slaveId, debug });
                this.addPropertyTransport(transport);
            }
        }
        if (config.options) {
            for (let option of config.options) {
                if (!(option instanceof BasePropertyBridge)) {
                    option = new PropertyBridge(option, {
                        type      : 'option',
                        transport : (option.transportId) ?
                            this.getPropertyTransportById(option.transportId) :
                            this.addPropertyTransport(createTransport({ ...option.transport, slaveId, debug })),
                        debug
                    });
                }
                this.addOption(option);
            }
        }
        if (config.telemetry) {
            for (let telemetry of config.telemetry) {
                if (!(telemetry instanceof BasePropertyBridge)) {
                    telemetry = new PropertyBridge(telemetry, {
                        type      : 'telemetry',
                        transport : (telemetry.transportId) ?
                            this.getPropertyTransportById(telemetry.transportId) :
                            this.addPropertyTransport(createTransport({ ...telemetry.transport, slaveId, debug })),
                        debug
                    });
                }
                this.addTelemetry(telemetry);
            }
        }
        if (config.sensors) {
            for (let sensor of config.sensors) {
                if (!(sensor instanceof BasePropertyBridge)) {
                    sensor = new PropertyBridge(sensor, {
                        type      : 'sensor',
                        transport : (sensor.transportId) ?
                            this.getPropertyTransportById(sensor.transportId) :
                            this.addPropertyTransport(createTransport({ ...sensor.transport, slaveId, debug })),
                        debug
                    });
                }
                this.addSensor(sensor);
            }
        }
    }
    // sync
    addPropertyTransport(propertyTransport) {
        if (this.propertyTransports.includes(propertyTransport)) return propertyTransport;
        super.addPropertyTransport(propertyTransport);
        propertyTransport.on('connected', this.handleConnected);
        propertyTransport.on('disconnected', this.handleDisconnected);
        return propertyTransport;
    }
    removePropertyTransport(id) {
        const propertyTransport = super.removePropertyTransport(id);

        propertyTransport.off('connected', this.handleConnected);
        propertyTransport.off('disconnected', this.handleDisconnected);

        return propertyTransport;
    }
    // async
    // handlers~
    handleConnected() {
        if (this.debug) this.debug.info('NodeBridge.handleConnected');
        this.connected = true;
    }
    handleDisconnected() {
        if (this.debug) this.debug.info('NodeBridge.handleDisconnected');
        this.connected = false;
    }
    handleDeleteEvent() {
        this.bridge.modbusConnection.onDeleteUnit(this.slaveId);
        super.handleDeleteEvent();
    }
    // ~handlers
}

NodeBridge.create = function (config, options) {
    let fullNodeBridgeConfig = {};

    const params = [];

    if (config.hardware) {
        const arr = config.hardware.split('.');

        fullNodeBridgeConfig = null;
        while (arr.length) {
            try {
                if (options.debug) options.debug.info('NodeBridge.create', `../../etc/config.nodes/${arr.join('.')}`);
                fullNodeBridgeConfig = require(`../../etc/config.nodes/${arr.join('.')}`);
            } catch (e) {
                if (e.code!=='MODULE_NOT_FOUND') throw e;
                if (options.debug) options.debug.error(e);
                params.unshift(arr.pop());
            }
            if (fullNodeBridgeConfig) break;
        }
        if (fullNodeBridgeConfig === null) throw new Error(`Cannot load node module(${config.hardware})`);
    }
    if (typeof fullNodeBridgeConfig === 'function') fullNodeBridgeConfig = fullNodeBridgeConfig(...params);

    const mapping = (fullNodeBridgeConfig.extensions && fullNodeBridgeConfig.extensions.mapping) || {};

    fullNodeBridgeConfig.transports = fullNodeBridgeConfig.extensions && fullNodeBridgeConfig.extensions.transports || [];

    // eslint-disable-next-line guard-for-in
    for (const key in mapping) {
        const keys = key.split('/');

        let property = null;

        if (keys[0] === '$options') {
            property = fullNodeBridgeConfig.options.find((p) => p.id === keys[1]);
            if (!property) throw new Error(`Cannot find option with id ${keys[1]}`);
        } else if (keys[0] === '$telemetry') {
            property = fullNodeBridgeConfig.telemetry.find((p) => p.id === keys[1]);
            if (!property) throw new Error(`Cannot find telemetry with id ${keys[1]}`);
        } else {
            property = fullNodeBridgeConfig.sensors.find((p) => p.id === keys[0]);
            if (!property) throw new Error(`Cannot find sensor with id ${keys[0]}`);
        }
        Object.assign(property, mapping[key]);
    }
    if (config.override) {
        (config.override.options || []).forEach(({ id, dataTypeBridge, ... args }) => {
            const property = fullNodeBridgeConfig.options.find((p) => p.id === id);

            if (!property) throw new Error(`Cannot find option with id ${id}`);
            Object.assign(property, args);
            let dataTypeBridgeLast = dataTypeBridge;

            while (dataTypeBridgeLast.dataTypeBridge) dataTypeBridgeLast = dataTypeBridgeLast.dataTypeBridge;
            dataTypeBridgeLast.dataTypeBridge = property.dataTypeBridge;
            property.dataTypeBridge = dataTypeBridge;
        });
        (config.override.telemetry || []).forEach(({ id, dataTypeBridge, ... args }) => {
            const property = fullNodeBridgeConfig.telemetry.find((p) => p.id === id);

            if (!property) throw new Error(`Cannot find option with id ${id}`);
            Object.assign(property, args);
            let dataTypeBridgeLast = dataTypeBridge;

            while (dataTypeBridgeLast.dataTypeBridge) dataTypeBridgeLast = dataTypeBridgeLast.dataTypeBridge;
            dataTypeBridgeLast.dataTypeBridge = property.dataTypeBridge;
            property.dataTypeBridge = dataTypeBridge;
        });
        (config.override.sensors || []).forEach(({ id, dataTypeBridge, ... args }) => {
            const property = fullNodeBridgeConfig.sensors.find((p) => p.id === id);

            if (!property) throw new Error(`Cannot find option with id ${id}`);
            Object.assign(property, args);
            let dataTypeBridgeLast = dataTypeBridge;

            while (dataTypeBridgeLast.dataTypeBridge) dataTypeBridgeLast = dataTypeBridgeLast.dataTypeBridge;
            dataTypeBridgeLast.dataTypeBridge = property.dataTypeBridge;
            property.dataTypeBridge = dataTypeBridge;
        });
    }

    return new NodeBridge({
        ...fullNodeBridgeConfig,
        ...config
    }, options);
};

module.exports = NodeBridge;
