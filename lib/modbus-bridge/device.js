const BaseDeviceBridge = require('homie-sdk/lib/Bridge/BaseDevice');
const BaseNodeBridge = require('homie-sdk/lib/Bridge/BaseNode');
const BasePropertyBridge = require('homie-sdk/lib/Bridge/BaseProperty');
const BasePropertyTransport = require('homie-sdk/lib/Bridge/BasePropertyTransport');
const { create : createTransport } = require('./property/transport');
const { create : createNode } = require('./node');
const PropertyBridge = require('./property');


class DeviceBridge extends BaseDeviceBridge {
    constructor(config, { debug } = {}) {
        super({ ...config, transports: null, options: null, telemetry: null, nodes: null }, { debug });
        // bindind handlers~
        this.handleModbusConnect = this.handleModbusConnect.bind(this);
        this.handleModbusDisconnect = this.handleModbusDisconnect.bind(this);
        // ~bindind handlers

        this.addTelemetry(new PropertyBridge({
            'dataTypeBridge' : {
                type          : 'raw',
                homieDataType : 'string'
            },
            'id'       : 'ip',
            'unit'     : '',
            'retained' : 'true',
            'settable' : 'false',
            'name'     : 'Ip address'
        }, {
            type      : 'telemetry',
            transport : createTransport({
                type : 'static',
                // eslint-disable-next-line more/no-duplicated-chains
                data : config.modbusConnectionIp
            })
        }));

        if (config.transports) {
            for (let transport of config.transports) {
                if (!(transport instanceof BasePropertyTransport)) transport = createTransport({ ...transport, debug });
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
                            this.addPropertyTransport(createTransport({ ...option.transport, debug })),
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
                            this.addPropertyTransport(createTransport({ ...telemetry.transport, debug })),
                        debug
                    });
                }
                this.addTelemetry(telemetry);
            }
        }
        if (config.nodes) {
            for (let node of config.nodes) {
                if (!(node instanceof BaseNodeBridge)) {
                    node = createNode({ ...node }, { debug });
                }
                this.addNode(node);
            }
        }
    }
    // sync
    attachBridge(bridge) {
        super.attachBridge(bridge);
        this.bridge.modbusConnection.on('connect', this.handleModbusConnect);
        this.bridge.modbusConnection.on('close', this.handleModbusDisconnect);
        this.bridge.modbusConnection.on('timeout', this.handleModbusDisconnect);
    }
    detachBridge() {
        this.bridge.modbusConnection.off('connect', this.handleModbusConnect);
        this.bridge.modbusConnection.off('close', this.handleModbusDisconnect);
        this.bridge.modbusConnection.off('timeout', this.handleModbusDisconnect);
        super.detachBridge();
    }
    // async
    // handlers~
    async handleModbusConnect() {
        if (this.debug) this.debug.info('DeviceBridge.handleModbusConnect');
        this.connected = true;
    }
    async handleModbusDisconnect() {
        if (this.debug) this.debug.info('DeviceBridge.handleModbusDisconnect');
        this.connected = false;
    }
    // ~handlers
}

module.exports = DeviceBridge;
