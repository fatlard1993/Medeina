# UPDATE 2017
This project is dead, though I hope to eventually continue this project I discovered along the way that i2c communication is not going to work reliably enough for the length I hoped, I explored some ideas to do with USB serial communication and I believe this is the direction this should take, and should I pick this up again that is where I will start.



# Medeina
Medeina is an automated envrioment control system(AECS). That means if you have an enviroment to control, a reptile/amphibian cage/terrarium or a grow room/tent, then Medeina is for you! Medeina can be connected to a seemingly endless number of sensors like: `temp`, `temp_humidity`, `soilMoisture`, `lightIntensity`, `reservoirLevel`, `C02`, `pH`, `flood`, `PIR`, `door`, and even other varous `HID` like a button or fader. In addition to these sensors there are power and camera modules that can be configured. Every input device can trigger an alert such as an email, sms, or even directly interact with other modules, all user configurable! Medeina will walk you through a qick and easy setup process that will create a module for each of the "hard" devices, once you've got everything configured you can set up "soft" modules such as: `light`, `fan`, `humidifier_dehumidifier`, `exhaust`, `nutrient_ph` and `heating_cooling`. From there all youve got to do is input the specific requirements and schedules for your enviroment and its done!

## Setup! *mock up
1. Make all physical connections
  1. Place sensors in apropriate places in your enviroment
  1. Connect sensors to sensor hubs
  1. Connect sensor hubs to brain
  1. Connect power moduel(s) to brain
  1. Connect camera module(s) to brain
  1. Connect ethernet, or wireless module to brain
  1. Connect power to the brain and power module(s)
1. Set up the brain
  1. Using a web browser log into your brain //This will bring you to a set up wizard to set up the connected modules
  1. Go through the set up wizard and configure all of the modules that pertain to your system //Next will be sensors
  1. Go through the wizard(s) (depending on how many sensor hubs you have configured) to configure your connected sensors/alerts
  
## Files!
### power.ino
This is a X chanel powerstrip, each of the X outlets are individually controlable via i2c.

### garduino.ino
This file is intended to serve as a small all-in-one standalone system for testing sensors and gathering data.

### nodeApp
Prerequisites: node.js(see below), "Forever" node package: `sudo npm install -g forever`<br>
This is a script to take care of starting and stopping my node application running in the background via forever. It is intended to be placed inside the `/etc/init.d/` folder and added to the boot operations with `update-rc.d`

## Reference!
#### Setting up i2c on Raspberry pi
1. `sudo nano /etc/modprobe.d/raspi-blacklist.conf` and comment out(Place a '#' before the line) the line blacklisting i2c-bcm2708 (If it exsists)
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
