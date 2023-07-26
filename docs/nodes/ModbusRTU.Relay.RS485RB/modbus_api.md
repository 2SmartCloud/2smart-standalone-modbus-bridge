1. Command command
- Request:
  - function: 0x05/'writeSingleCoil'
  - address: 0x01-0x08            - relay port number
  - value:
    - 1                           - enable relay port
    - 0                           - disable relay port
- Response is mirror.
2. 
- Request
  - function: 0x01/'readCoils'
  - address: 0x01-0x08            - relay port number
  - quantity: 1-8
- Response:
  - data: array of bits