1. Command command
- Request:
  - function: 0x04/'readInputRegister'
  - address: 0x7534 - themperature,
  - quantity: 1
- Response:
  - data: int16
```
Temperature example: Register value: 0x7534 = 305.
Then temperature: t = 30.5°C.
```
2. Command command
- Request:
  - function: 0x04/'readInputRegister'
  - address: 0x7534 - themperature,
  - quantity: 1
- Response:
  - data: int16
3. Set slaveID
- Request 1
  - function: 0x06/'writeSingleRegister'
  - address: 0x9C40
  - value: 'new slave id'
- Request 2
  - function: 0x06/'writeSingleRegister'
  - address: 0x9C41
    - value: <Buffer 0x02>
- Response is mirror.
4. Set Baud rate 
- Request 1
  - function: 0x06/'writeSingleRegister'
  - address: 0x9C40
  - value: 1-7                   - (1:1200, 2:2400, 3:9600, 4:19200, 5:38400, 6:57600, 7:115200)
- Request 2
  - function: 0x06/'writeSingleRegister'
  - address: 0x9C41
    - value: <Buffer 0x03>
- Response is mirror.