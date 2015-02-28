# Medeina
All the codes for my gardening project

## Files!
### 8ch_outlet_box_slave.ino
This file is ment to be run on an arduino nano(328). It is a 8 chanel powerstrip, each of the 8 outlets are individually controlable via i2c and Serial(for testing only).

### garduino.ino
This file is intended to serve as a small all-in-one standalone system for testing sensors and gathering data.

### nodeApp
Prerequisites: node.js(see below), "Forever" node package: `sudo npm install -g forever`<br>
This is a script to take care of starting and stopping my node application running in the background via forever. It is intended to be placed inside the `/etc/init.d/` folder and added to the boot operations with `update-rc.d`

## Reference!
#### Setting up i2c on Raspberry pi
1. `sudo nano /etc/modprobe.d/raspi-blacklist.conf` and comment out(Place a '#' before the line) the line blacklisting i2c-bcm2708
1. `sudo nano /etc/modules` and add `i2c-dev` and `i2c-bcm2708` to the end of the file
1. Add i2c tools: `sudo apt-get install i2c-tools`
1. Add the pi user to the i2c group: `sudo adduser pi i2c`
1. Enable i2c boot device tree support: `sudo nano /boot/config.txt` and add: `dtparam=i2c1=on`
1. Create 99-i2c.rules: `sudo nano /etc/udev/rules.d/99-i2c.rules` with the contents: `SUBSYSTEM=="i2c-dev", MODE="0666"`
1. Test with: `i2cdetect -y 1`

### Setting up node.js on Raspberry pi
1. Download package: `sudo wget http://node-arm.herokuapp.com/node_latest_armhf.deb`
1. Unpack and install: `sudo dpkg -i node_latest_armhf.deb`
1. Test with: `node -v`
