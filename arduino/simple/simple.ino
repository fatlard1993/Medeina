#include <OneWire.h>
#include <DallasTemperature.h>

#define ONE_WIRE_BUS 2
#define OUTLET_1 3
#define OUTLET_2 4
#define OUTLET_3 5
#define OUTLET_4 6
#define TEMPERATURE_PRECISION 9

OneWire oneWire(ONE_WIRE_BUS);

DallasTemperature sensors(&oneWire);

DeviceAddress temp1, temp2, temp3;

// DeviceAddress temp1 = { 0x28, 0x1D, 0x39, 0x31, 0x2, 0x0, 0x0, 0xF0 };
// DeviceAddress temp2   = { 0x28, 0x3F, 0x1C, 0x31, 0x2, 0x0, 0x0, 0x2 };
// DeviceAddress temp3   = { 0x28, 0x3F, 0x1C, 0x31, 0x2, 0x0, 0x0, 0x2 };

void setup(void)
{
  Serial.begin(9600);

  pinMode(OUTLET_1, OUTPUT);
  pinMode(OUTLET_2, OUTPUT);
  pinMode(OUTLET_3, OUTPUT);
  pinMode(OUTLET_4, OUTPUT);

  sensors.begin();

  Serial.println();
  Serial.print("Found ");
  Serial.print(sensors.getDeviceCount(), DEC);
  Serial.println(" devices");
  Serial.print("Parasite power is ");

  if(sensors.isParasitePowerMode()) Serial.println("ON");
  else Serial.println("OFF");

  if(!sensors.getAddress(temp1, 0)) Serial.println("Unable to find address for Device 1");
  if(!sensors.getAddress(temp2, 1)) Serial.println("Unable to find address for Device 2");
  if(!sensors.getAddress(temp3, 1)) Serial.println("Unable to find address for Device 3");

  sensors.setResolution(temp1, TEMPERATURE_PRECISION);
  sensors.setResolution(temp2, TEMPERATURE_PRECISION);
  sensors.setResolution(temp3, TEMPERATURE_PRECISION);
}

void printAddress(DeviceAddress deviceAddress){
  for(uint8_t i = 0; i < 8; i++){
    if(deviceAddress[i] < 16) Serial.print("0");

    Serial.print(deviceAddress[i], HEX);
  }
}

void printTemperature(DeviceAddress deviceAddress){
  float tempC = sensors.getTempC(deviceAddress);

  Serial.print(" C ");
  Serial.print(tempC);
  Serial.print(" F ");
  Serial.print(DallasTemperature::toFahrenheit(tempC));
}

void printData(DeviceAddress deviceAddress){
  printAddress(deviceAddress);

  printTemperature(deviceAddress);

  Serial.println();
}

void receive(){
	static bool recvInProgress = false;
	static byte ndx = 0;
	char startMarker = '{';
	char endMarker = '}';
	char rc;

	while(Serial.available() > 0 && newData == false){
		rc = Serial.read();

		if(recvInProgress == true){
			if(rc != endMarker){
				receivedChars[ndx] = rc;
				ndx++;

				if(ndx >= numChars){
					ndx = numChars - 1;
				}
			}

			else{
				receivedChars[ndx] = '\0';
				recvInProgress = false;
				ndx = 0;
				newData = true;
			}
		}

		else if(rc == startMarker){
			recvInProgress = true;
		}
	}
}

void handleCommands(){
	if(newData == false) return;

	if(receivedChars.startsWith("OUTLET_1")){
		digitalWrite(OUTLET_1, receivedChars.endsWith("0") ? LOW : HIGH);

		Serial.print("OUTLET_1 ");
		Serial.println(receivedChars.endsWith("0") ? "0" : "1");
	}

	newData = false;
}

unsigned long temp_check_millis = 0;

#define temp_update_frequency 5000

void readTemps(){
	unsigned long currentMillis = millis();

	if(currentMillis - temp_check_millis <= temp_update_frequency) return;

	temp_check_millis = currentMillis;

  sensors.requestTemperatures();

  printData(temp1);
  printData(temp2);
  printData(temp3);
}

void loop(void){
	receive();

	handleCommands();

	readTemps();
}
