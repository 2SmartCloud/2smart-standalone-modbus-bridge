1. Command command
- Request:
  - function: 0x03/'readHoldingRegister' or 0x04/'readInputRegister'
  - address: 0x00-0x01, 100, 101            - 0x00 - themperature, 0x01 - humidity, 100 - slaveId, 101 - baud rate
  - quantity: 1-2
- Response:
  - data: array of corresponding values
2. Set slaveID
- Request
  - function: 0x06/'writeSingleRegister'
  - address: 100
  - value: 'new slave id'
- Response is mirror.
3. Set Baud rate 
- Request
  - function: 0x06/'writeSingleRegister'
  - address: 101            - to change baud rate(0:1200, 1:2400, 2:4800, 3:9600)
  - value: 0-3                   - (0:1200, 1:2400, 2:4800, 3:9600)
- Response is mirror.
4. You can also you writeMultipleRegisters function for 3-4 operations