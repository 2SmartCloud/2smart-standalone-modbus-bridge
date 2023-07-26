1. Get state of digital output(s)
- Request:
  - function: 0x01/'readCoils'
  - address: 0x00-0x0F                      - 0x00-ox0F - digital outputs states
  - quantity: 1-16
- Response:
  - data: array of corresponding values
2. Set digital output state
- Request
  - function: 0x05/'writeSingleCoil'
  - address: 0-16                - digital output address
  - value: true/false            - digital output state, true - enabled, false - disabled
- Response is mirror.
3. Get communication settings and slaveId
- Request:
  - function: 0x03/'readHoldingRegister'
  - address: 100, 101                         - 100 - slaveId, 101 - baud rate
  - quantity: 1-2
- Response:
  - data: array of corresponding values
4. Set slaveID
- Request
  - function: 0x06/'writeSingleRegister'
  - address: 100
  - value: 'new slave id'
- Response is mirror.
5. Set Baud rate 
- Request
  - function: 0x06/'writeSingleRegister'
  - address: 101            - to change baud rate(0:1200, 1:2400, 2:4800, 3:9600)
  - value: 1-8                   - (1:4800.N.8.1, 2:9600.N.8.1, 3:19200.N.8.1, 4:38400.N.8.1,
                                    1:4800.E.8.1, 2:9600.E.8.1, 3:19200.E.8.1, 4:38400.E.8.1)
- Response is mirror.