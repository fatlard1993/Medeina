#include <OneWire.h>
#include <DallasTemperature.h>

#define ONE_WIRE_BUS 2
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

void loop(void){
	delay(5000);

  sensors.requestTemperatures();

  printData(temp1);
  printData(temp2);
  printData(temp3);
}
