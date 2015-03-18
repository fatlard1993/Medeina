#include <Wire.h>
#include <PciManager.h>
#include <PciListenerImp.h>
#include <SoftTimer.h>
#include "DHT.h"


#define SLAVE_ADDRESS 5 // Slave address used for I2c

float tempPlaceholder;
int tempIndex;
int tempAverage;

float humidityPlaceholder;
int humidityIndex;
int humidityAverage;

int data = 9; // Data to be writen back to I2c master. 9 = no data ready yet.

void setup() {
  Wire.begin(SLAVE_ADDRESS);
  Serial.begin(9600);
  
  Wire.onReceive(receiveEvent);
  Wire.onRequest(requestEvent);
}

void loop(){
  delay(100);
}

void requestEvent(){
  Wire.write(data);
  data = 9;
}

void receiveEvent(int howMany){
  int receiveByte = 0; // Set command index to 0
  char command[2];
  while(Wire.available()){
    command[receiveByte] = Wire.read();
    receiveByte++;
  }
}
