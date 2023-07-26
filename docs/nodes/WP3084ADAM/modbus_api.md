1. Get state of analog input(s)
- Request:
  - function: 0x03/'readHoldingRegisters'
  - address: 0x00-0x07, 100, 101            - 0x00-0x07 - voltage inputs, 100 - slaveId, 101 - baud rate
  - quantity: 1-8
- Response:
  - data: array of corresponding values
```
Voltage input example: Register value: 0x05AF = 1455.
Then current: I = 1455*10/4095 = 3.55V
```
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
  - value: 1-8                   - (1:4800.N.8.1, 2:9600.N.8.1, 3:19200.N.8.1, 4:38400.N.8.1,
                                    1:4800.E.8.1, 2:9600.E.8.1, 3:19200.E.8.1, 4:38400.E.8.1)
- Response is mirror.