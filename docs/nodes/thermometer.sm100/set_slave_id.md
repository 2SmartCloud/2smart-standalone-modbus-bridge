Set slaveID
- Request 1
  - function: 0x06/'writeSingleRegister'
  - address: 0x9C40
  - value: 'new slave id'
- Request 2
  - function: 0x06/'writeSingleRegister'
  - address: 0x9C41
    - value: <Buffer 0x02>
- Response is mirror.