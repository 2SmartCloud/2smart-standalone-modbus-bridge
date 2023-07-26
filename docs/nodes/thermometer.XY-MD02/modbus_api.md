1. Command command
- Request:
  - function: 0x04/'readInputRegister'
  - address: 0x01-0x02            - 0x01 - themperature, 0x02 - humidity
  - quantity: 1-2
- Response:
  - data: array of corresponding values
```
Temperature example: Register value: 0x0131 = 305.
Then temperature: t = 30.5°C.
Or temperature example: Register value: 0xff33 = -205.
Then temperature: t = -20.5°C.
Humidity example: Register value: 0x0222 = 546.
Then humidity: t = 54.6%rh.
```
2. Command command
- Request:
  - function: 0x04/'readHoldingRegister'
  - address: 0x0101-0x0104            - 0x0101 - slave Id, 0x0102 - baud rate, 0x0103 - temperature correction, 0x0104 - humidity correction
  - quantity: 1-4
- Response:
  - data: array of corresponding values
3. Set slaveID
- Request
  - function: 0x06/'writeSingleRegister'
  - address: 0x0101
  - value: 'new slave id'
- Response is mirror.
4. Set Baud rate 
- Request
  - function: 0x06/'writeSingleRegister'
  - address: 0x0102            - to change baud rate(0:9600, 1:14400, 2:19200)
  - value: 0-2                   - (0:9600, 1:14400, 2:19200)
- Response is mirror.
5. Set temperature correction
- Request
  - function: 0x06/'writeSingleRegister'
  - address: 0x0103
  - value: correction value
- Response is mirror.
6. Set humidity correction
- Request
  - function: 0x06/'writeSingleRegister'
  - address: 0x0104
  - value: correction value
- Response is mirror.
7. You can also you writeMultipleRegisters function for 3-6 operations