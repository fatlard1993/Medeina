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




## Webserver
The main webserver needs to provide easy access to the current status and manual control over the entire system.


## Modules
The brain and hub modules are not placed by the user. They are instead generated based on the devices, sensors and logical groups the user has defined.

### Brain
The brain is the main logging, and web server for the whole system. It connects to the intranet via wired or wireless. A site may be comprised of multiple brains each controlling their own island.

### Slave Brain
Just like the brain, except dumber. All it does is act as a point of contact for an otherwise isolated island.

### Touchscreen Brain
Just like the brain, except with a touch screen with dedicated access to the main webserver.

### Power Hub
The power hubs provide control over almost any 3rd party devices. They come in a variety of sizes and types:

* Voltage type: 5V DC / 12V DC / 120V AC / 120V AC Dimmable
* Channel count: 2 / 4 / 8

### Sensor Hub
The sensor hubs provide generic access to a myriad of different sensors. Like the power hubs, they come in a variety of sizes: 2 / 4 / 8

### Status LED
The status LED is meant to provide a quick glance status of a particular group. It supports full RGB and blinking configuration, and can be assigned to any trigger(s)

### Status Display
The status display is mush like the status LED. Instead of configurable colors this supports configurable strings. It is just a 16x2 char lcd so can only provide 2 lines of 16 char text at a time.

### Group
A group is a logical set of modules typically based on physical location limitations. Treated as its own entity a group has a configurable color and name. Any module may be a member of any number of groups.


## Devices
Device blocks are connected to power hub ports. All devices can be assigned a custom name, color, and voltage. Each device has a set function which accepts a value from 0 to 1 which sets its output power. Each device also has a state value which retains its current power state. These are the device types:

### Light
Light bulb icon.

### Fan
Fan icon.

### Heat
Sun icon.

### Cool
Snowflake icon.

### Splitter
A special device that allows connecting multiple other devices into one device. Eg. Multiple lights that turn on and off together.

### Custom
No icon. Can save as new type with a custom default name, color, and voltage.


## Sensors
Sensors are blocks that are connected to a sensor hub and provide a set of triggers that can be assigned to certain actions. Each sensor records its readings for graphing purposes. A change event will be fired if the reading has changed. These are the sensor types:

### Temp
A waterproof temperature probe. Provides temp level.

### Temp and Humidity
An open air temp and humidity sensor. Provides temp and humidity levels.

### Light Intensity
A waterproof light intensity probe. Provides light intensity level.

### C02
A C02 sensor. Provides C02 level.

### Soil Moisture
A soil moisture probe, ~3 inch stake. Provides soil moisture level.

### Reservoir Level
Provides reservoir level.

### Flood
A small flat sensor designed to detect if there is water on the floor. Provides flooded/not-flooded.

### Motion
A PIR motion sensor. Provides motion trigger.

### Door
A magnetic door sensor. Provides open/closed.

### Button
A momentary button. Provides on/off.

### Switch
A toggle switch. Provides on/off.

### Time
A soft sensor that requires no hub. Provides relative and absolute timing/scheduling.


## Rules
Rules are essentially little scripts that run when the associated sensor changes. An example rule set for a temp sensor might look like this:

``` this.updateSec = 120
if(this.val < this.low && !Groups[this.groupName].heat.state){
	Groups[this.groupName].heat.set(1)
	this.updateSec = 30
}
else if(this.val > this.high && Groups[this.groupName].heat.state){
	Groups[this.groupName].heat.set(0)
	this.updateSec = 120
}

Groups[this.groupName].statusLED.status[this.name] = this.val < this.extraLow ? 'red:blink' : 'green'
```

And one for a humidity sensor might look like this:

``` this.updateSec = 60
if(this.val < this.low && !Groups[this.groupName].mister.state){
	Groups[this.groupName].mister.set(1)
	this.updateSec = 120 // ensure the mister runs for at least 2 min
}
else if(this.val > this.high && Groups[this.groupName].mister.state){
	Groups[this.groupName].mister.set(0)
	this.updateSec = 60
}

Groups[this.groupName].statusLED.status[this.name] = this.val < this.extraLow ? 'blue:blink' : 'green'
```