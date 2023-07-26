1. Get state of relay ports
- Request:
  - function: 0x01/'readCoils'
  - address: 0xFF
  - quantity: 1-8                           - 0x00-ox07 - relay ports states
- Response:
  - data: array of corresponding values
2. Get state of relay ports
- Request:
  - function: 0x05/'writeSingleRegister'
  - address: 0x00-0x07                      - 0x00-ox07 - relay ports indexes
  - value: true - 0xFF00 / false - 0                        - dport state, true - closed, false - open
- Response:
  - data: array of corresponding values
3. Set slaveID
- Request
  - function: 0x06/'writeSingleRegister'
  - address: 0x4000
  - value: 'new slave id'
- Response is mirror.
4. Set Baud rate 
- Request
  - function: 0x06/'writeSingleRegister'
  - address: 0x2000
  - value: 0-7                   - 0x0000  : 4800,  0x0001  : 9600,   0x0002  : 19200,  0x0003  : 38400
                                   0x0004  : 57600, 0x0005  : 115200, 0x0006  : 128000, 0x0007  : 256000
- Response is mirror.