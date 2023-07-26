1. Winner sku662285 (Black sensor with moisture and temperature):
     1. Pinout
         - yellow ---- "+" power
         - black ---- "-" power supply
         - red ---- "485-A"
         - green ---- "485-B"

     2. Write Slave ID - we write a new Slave ID using the write register function (06) to address 0 on Slave ID = 0 (Broadcast)
    
     3. Receiving data - read 2 records from address = 0 by function 03 (Read register)


2. WellPro WP8025ADAM (Blue box for 8 relays)
     1. Write Slave ID - software is used to configure devices from the vendor
     2. Receiving data - read 8 records from address = 0 by function 01 (Read coils)
     3. Clicking the relay - we write the coil at the address equal to the port number


3. WellPro WP3084ADAM (Blue box for measuring voltage indicators)
     1. Write Slave ID - software is used to configure devices from the vendor
     2. Receiving data - read 8 records from address = 0 by function 03 (Read registers)

4. Noname TH10S-B (Humidity and Temperature Sensor (Umbrella))
     1. Pinout
         - red ---- "+" power
         - black ---- "-" power supply
         - green ---- "485-A"
         - white ---- "485-B"

     2. Write Slave ID - we write a new Slave ID using the write register function (06) to address 0 on Slave ID = 0 (Broadcast)
     3. Receiving data - read 2 records from address = 0 by function 03 (Read register)

5. Noname T10S-B (Shrink Temperature Sensor)
     1. Pinout
         - red ---- "+" power
         - black ---- "-" power supply
         - yellow ---- "485-A"
         - green ---- "485-B"

     2. Write Slave ID - we write a new Slave ID using the register write function (06) to address 100, default 1
     3. Receiving data - read 1 record from address = 0 by function 03 (Read register)

6. Noname PD3060E-6 (PT100)
      1. Customization
         To configure, immediately after turning on the power, without reading, send request 06 to register 16.
         The value must be the decimal representation of the string $ID A4 (without space), where instead of $ID there is a hexadecimal representation of the future slave id of the device.
         For ID = 11, the string would be 0BA4, which would be 2980 in decimal.
         The request should be sent to the current slave id (not to broadcast)
         If the device shows a value other than -100 on disabled contacts, then send the value -1000 to register 18
    
     2. Receiving data - read 8 records from address = 32 by function 03 (Read registers)

6. Noname RS485RB-1 / RS485RB-2 / RS485RB-4 / RS485RB-8 / RS485RB-16 / RS485RB-32 - relay box
     1. Setting - Slave ID is set by converting the number to binary format with the addition of a leading zero
     2. Receiving data - we read N records from address = 1 by function 03 (Reading registers), instead of N there is the number of ports
     3. Relay clicking - write a single register at the address equal to the port number. Value 512 - disable, 256 - enable
     6 is always 1
     6 is 1 modbus
     0 atm teams
     10 010101
     15 111101