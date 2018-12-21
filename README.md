# Medeina

Automated environment control.

Benefits may include (but are certainly not limited too):
* A normalized environment
* Less power consumption
* Ease of mind

This seems to be as close as the market can get:
[Too Expensive](https://www.spyderrobotics.com/index.php?main_page=product_info&cPath=1&products_id=46)
[Too Simple](https://www.amazon.com/Zoo-Med-HygroTherm-Temperature-Controller/dp/B0019IHK9Q)
[And this seems to be the best I can find](https://www.amazon.com/dp/B01N56KEU6/ref=sspa_dk_detail_2?pd_rd_i=B01N56KEU6&pd_rd_w=7hR2J&pf_rd_p=f0dedbe2-13c8-4136-a746-4398ed93cf0f&pd_rd_wg=g7Xrs&pf_rd_r=EQXKAVGAZ5866ARMJJZB&pd_rd_r=4abc1d0d-fdb5-11e8-b4ee-03540d6ca7fe&th=1)

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

### Reservoir Empty
A manually set bobber. Provides full/empty.

### Flood
A small flat sensor designed to detect if there is water on the floor. Provides flooded/not-flooded.

### Motion
A PIR motion sensor. Provides motion trigger.

### Tamper
A mercury switch. Provides on/off.

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


## Notes

Having a hard time getting the dht11 sensors working.. might consider doing something like [this](https://hackaday.com/2016/11/07/diy-i2c-devices-with-attiny85/)