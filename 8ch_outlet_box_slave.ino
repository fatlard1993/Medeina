#include <Wire.h>

#define SLAVE_ADDRESS 2 // Slave address used for I2c
#define NUM_OUTLETS 8 // Total number of outlets
#define FIRST_OUTLET_PIN 2 // The first(lowest number) pin of NUM_OUTLETS, this is designed to be used with consecutive pins eg. 2-9

int data = 9; // Data to be writen back to I2c master. 9 = no data ready yet.

void setup(){
  for(int i = FIRST_OUTLET_PIN; i <= NUM_OUTLETS; i++){ // Loop through all outlets
    pinMode(i, OUTPUT);
    digitalWrite(i, HIGH); // Initialize them all at HIGH (off)
  }
  Wire.begin(SLAVE_ADDRESS);
  Serial.begin(9600);
  
  Wire.onReceive(receiveEvent);
  Wire.onRequest(requestEvent);
  
  Serial.println("            Serial/I2c Powerstrip            ");
  Serial.println("=============================================");
  Serial.println("To operate enter 2 digits [outletNum][action]");
  Serial.print("There are ");
  Serial.print(NUM_OUTLETS);
  Serial.println(" currently configured outlets");
  Serial.println("Available actions are: 1(ON), 0(OFF), r(read)");
  Serial.println("=============================================");
}

void loop(){
  delay(100);
}

void serialEvent() {
  int receiveByte = 0; // Set command index to 0
  char command[2]; // [0] = outletNum (1-8), [1] = action (0,1,r)
  while(Serial.available()) {
    command[receiveByte] = (char)Serial.read();
    if (command[receiveByte] == '\n') { // Break out of loop when return is pressed
      break;
    } else{
      receiveByte++;
    }
  }
  handleInput(command);
}

void requestEvent(){
  Wire.write(data);
}

void receiveEvent(int howMany){
  int receiveByte = 0; // Set command index to 0
  char command[2]; // [0] = outletNum (1-8), [1] = action (0,1,r)
  while(Wire.available()){
    command[receiveByte] = Wire.read();
    receiveByte++;
  }
  handleInput(command);
}

void handleInput(char command[2]){
  int outletNum;
  if(command[0] == 'a'){
    outletNum = 666;
  }else{
    outletNum = (int)command[0] - '0'; // Convert char to int
    if(outletNum > NUM_OUTLETS || outletNum < 1){
      Serial.print(command[0]);
      Serial.print(" is not a valid outlet selection, 1-");
      Serial.print(NUM_OUTLETS);
      Serial.println(" are currently configured.");
      return;
    } else{
      outletNum = outletNum + (FIRST_OUTLET_PIN - 1); // Adjust based on what the first pin is
    }
  }
  switch(command[1]){
    case '0':
      turnOff(outletNum);
      break;
    case '1':
      turnOn(outletNum);
      break;
    case 'r':
      readOutlet(outletNum);
      break;
    default:
      Serial.print(command[1]);
      Serial.println(" is not a valid outlet action. 0, 1, r are the avalible actions");
      break;
  }
}

void turnOn(int outletNum){
  if(outletNum == 666){
    for(int i = FIRST_OUTLET_PIN; i <= NUM_OUTLETS; i++){
      if(digitalRead(i)){
        digitalWrite(i, LOW);
        Serial.print("Turned ON outlet #");
        Serial.println(i - (FIRST_OUTLET_PIN - 1));
      }
    }
  }else{
    digitalWrite(outletNum, LOW);
    Serial.print("Turned ON outlet #");
    Serial.println(outletNum - (FIRST_OUTLET_PIN - 1));
  }
}

void turnOff(int outletNum){
  if(outletNum == 666){
    for(int i = FIRST_OUTLET_PIN; i <= NUM_OUTLETS; i++){
      if(!digitalRead(i)){
        digitalWrite(i, HIGH);
        Serial.print("Turned OFF outlet #");
        Serial.println(i - (FIRST_OUTLET_PIN - 1));
      }
    }
  }else{
    digitalWrite(outletNum, HIGH);
    Serial.print("Turned OFF outlet #");
    Serial.println(outletNum - (FIRST_OUTLET_PIN - 1));
  }
}

void readOutlet(int outletNum){
  if(outletNum == 666){
    for(int i = FIRST_OUTLET_PIN; i <= NUM_OUTLETS; i++){
      bool outletState = digitalRead(i);
      Serial.print("Outlet #");
      Serial.print(i - (FIRST_OUTLET_PIN - 1));
      Serial.print(" is ");
      if(outletState){
        Serial.println("OFF!");
      } else{
        Serial.println("ON!");
      }
    }
  }else{
    bool outletState = digitalRead(outletNum);
    Serial.print("Outlet #");
    Serial.print(outletNum - (FIRST_OUTLET_PIN - 1));
    Serial.print(" is ");
    if(outletState){
      Serial.println("OFF!");
    } else{
      Serial.println("ON!");
    }
  }
}
