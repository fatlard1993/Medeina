#include <Wire.h>

#define NUM_OUTLETS 8

int outletNum = 0;
boolean outletStateArray[8];

void setup(){
  for(int i = 1; i <= NUM_OUTLETS; i++){
    pinMode(i+1, OUTPUT); // Pins D2-D9
  }
  Wire.begin(4);
  Serial.begin(9600); // For testing only
  
  Wire.onReceive(receiveEvent);
  Wire.onRequest(requestEvent);
}

void loop(){
  delay(100);
}

void requestEvent(){
  Wire.write(outletNum);
}

void receiveEvent(int howMany){
  int receiveByte = 0; // Set command index to 0
  char command[7]; // [0] = outletNum (1-8), [1] = readWrite ()
  while (Wire.available()){
    command[receiveByte] = Wire.read();
    receiveByte++;
  }
  
  if(outletNum == 0){
    outletNum = Wire.read();
  } else{
    int recievedCommand = Wire.read();
    switch(recievedCommand){
      case 1:
        turnOn(outletNum);
        break;
      case 2:
        turnOff(outletNum);
        break;
      case 3:
        readOutlet(outletNum);
        break;
      default:
        break;
    }
  }
}

void turnOn(int outletNum){
  digitalWrite(outletNum+1, LOW);
}

void turnOff(int outletNum){
  digitalWrite(outletNum+1, LOW);
}

void readOutlet(int outletNum){
  
}
