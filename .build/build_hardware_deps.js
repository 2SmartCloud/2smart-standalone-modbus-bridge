#!/usr/bin/env node
const _ = require('underscore');
const path = require('path');
const fs = require('fs-extra');

function loadConfigs(hardware) {
    const arr = hardware.split('.');
    const params = [];

    while (arr.length) {
        try {
            console.log(`../etc/config.nodes/${arr.join('.')}`);
            let config = require(path.join('../hardware/', arr.join('.')));

            console.log(`../etc/hardware-maintain/${arr.join('.')}`);
            let helpers = require(path.join('../hardware-maintain', arr.join('.')));
            
            if (typeof config === 'function') {
                config = config(...params);
                helpers = { ...helpers, ...helpers.variations[params.join('.')] }
            }

            console.log('\x1b[32mMODULE_FOUND\x1b[0m');
            return { helpers, config };
        } catch (e) {
            if (e.code!=='MODULE_NOT_FOUND') throw e;
            console.log('\x1b[33mMODULE_NOT_FOUND\x1b[0m');
            params.unshift(arr.pop());
        }
    }
    throw new Error(`Cannot load node module(${yarv.hardware})`);
}


function create_deps () {
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
                    name: lconfig.name,
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
                name: config.name,
                type:'json/js-export-json',
                module,
                hardware,
                description: helpers.description,
                tags: helpers.tags
            };
        }
    }
    var stream = fs.createWriteStream(path.resolve(__dirname, '../README.md'));
    stream.once('open', function(fd) {
        stream.write(fs.readFileSync(path.join(__dirname, 'README.template.md'), 'utf8'));
        for(const [hardware, { name, tags, description, type, module }] of Object.entries(data)){
            stream.write(`###  ${name}\r\n`+
                `| Hardware | Description | tags |\r\n`+
                `| --- | --- | --- |\r\n`+
                `| ${hardware} | ${description} | ${tags}) |\r\n`+
                `---\r\n`+
                `<br/>\r\n`+
                `<br/>\r\n`+
                `<br/>\r\n`+
            `\r\n`);
        }
        stream.end();
    });
    const modbus_hardwares = Object.keys(data);
    const bridgeType = {
        title         : 'Modbus Bridge',
        type          : 'modbus-bridge',
        registry      : 'registry.gitlab.webbylab.com/smarthome/modbus-bridge',
        configuration : {
          fields: [
            {
              label:'Device name',
              name:'DEVICE_NAME',
              type : 'string',
              validation: [],
              default: 'Modbus Bridge'
            },
            {
              label:'Connection IP*',
              name:'MODBUS_CONNECTION_IP',
              type : 'string',
              validation: ['required', 'string'],
            },
            {
              label:'Connection port*',
              name:'MODBUS_CONNECTION_PORT',
              type : 'integer',
              validation: ['required', 'positive_integer'],
              default: 502
            },
            {
              label:'Poll interval*',
              name:'POLL_INTERVAL',
              type : 'integer',
              validation: ['required', 'positive_integer'],
              default: 5000
            },
            {
              label : 'Debug',
              name : 'DEBUG',
              type : 'string',
              default : null
            },
            {
              label : 'Nodes Configuration*',
              name : 'nodes.config',
              type : 'modbus-config',
              validation: [ 'required', {
                'nested_object': {
                  nodes:[ 'required', {
                    'list_of_objects': {
                      id:['required', 'positive_integer', {min_number:1}, {max_number:255}],
                      hardware:['required', {'one_of':modbus_hardwares}]
                    }
                  }, { 'list_unique_by' : 'id' }, { 'list_min_length' : 1 }]
                }
              } ],
              default : {
                "nodes": [{ id: '', hardware: '' }]
              },
              hardwares: modbus_hardwares
            }
          ]
        },
        icon: 'favicon.svg'
    };
    fs.writeFileSync(path.resolve(__dirname, '../2smart.configuration.json'), JSON.stringify(bridgeType, null, 4));
}
create_deps();
