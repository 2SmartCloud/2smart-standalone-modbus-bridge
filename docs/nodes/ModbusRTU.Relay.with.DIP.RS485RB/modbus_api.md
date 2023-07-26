1. Command command
- Request:
  - function: 0x06/'writeSingleRegister'
  - address: 0x01-0x08            - relay port number
  - value:
    - Buffer(<0x01, 0x00>)        - enable relay port
    - Buffer(<0x02, 0x00>)        - disable relay port
    - Buffer(<0x03, 0x00>)        - toggle relay port
    - Buffer(<0x04, 0x00>)        - (hz?)Latch inter-locking
    - Buffer(<0x05, 0x00>)        - (hz?)Momentary (Non-locking)
    - Buffer(<0x05, 0x00-0ff>)    - (hz?)enable for  some time Delay
- Response is mirror.
2. 
- Request
  - function: 0x03/'readHoldingRegisters'
  - address: 0x01-0x08            - relay port number
  - quantity: 1-8
- Response:
  - data: array of 2byte registers