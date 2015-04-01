#include <Wire.h>

//========== To be configured by wizard ==========//
#define SLAVE_ADDRESS 0x04
#define NUM_OUTLETS 8
#define FIRST_OUTLET_PIN 2 // The first(lowest number) physical pin
//========== END ==========//

#define ALL 666

// Define i2c responce messages
#define NO_DATA 9 // No data ready to be written (try again)
#define OUTLET_ERROR 2 // There was an error trying to use the provided outlet number
#define OUTPUT_ERROR 3
#define SUCCESS 1 // Operation succeded

int data = NO_DATA; // Data to be writen back to I2c master
bool outletState[NUM_OUTLETS];

void setup(void){
  for(int i = FIRST_OUTLET_PIN; i <= NUM_OUTLETS + (FIRST_OUTLET_PIN - 1); i++){
    pinMode(i, OUTPUT);
    digitalWrite(i, HIGH); // Initialize all outlets to HIGH (off)
  }
  Wire.begin(SLAVE_ADDRESS);
  Wire.onReceive(receiveEvent);
  Wire.onRequest(requestEvent);
}

void loop(void){} //Because Arduino complains if its missing

void receiveEvent(int howMany){
  int receiveByte = 0;
  char command[howMany];
  while(Wire.available()){
    command[receiveByte] = Wire.read();
    receiveByte++;
  }
  int outletNum;
  if(command[1] == 'a'){
    outletNum = ALL;
  } else {
    outletNum = (int)command[1] - '0'; // Convert char to int
    if(outletNum > NUM_OUTLETS || outletNum < 1){
      data = OUTLET_ERROR;
    } else {
      outletNum = outletNum + (FIRST_OUTLET_PIN - 1); // Adjust for the first pin, result is actual arduino pin used
    }
  }
  outlet(outletNum, command[0]);
}

void requestEvent(void){
  if(data == ALL){
    Wire.write((uint8_t *)outletState, NUM_OUTLETS);
  } else {
    Wire.write(data);
  }
  data = NO_DATA;
}

void outlet(int num, char action){
  if(num == ALL){
    for(int i = FIRST_OUTLET_PIN; i <= NUM_OUTLETS + (FIRST_OUTLET_PIN - 1); i++){
      if(action == 'r'){
        outletState[i - FIRST_OUTLET_PIN] = !digitalRead(i);
        data = ALL;
      } else {
        int iaction = !((int)action - '0'); // Convert char to int and invert
        digitalWrite(i, iaction);
        if(digitalRead(num) == iaction){
        data = SUCCESS;
      } else {
        data = OUTPUT_ERROR;
      }
      }
    }
  }else{
    if(action == 'r'){
        data = !digitalRead(num);
    } else {
      int iaction = !((int)action - '0'); // Convert char to int and invert
      digitalWrite(num, iaction);
      if(digitalRead(num) == iaction){
        data = SUCCESS;
      } else {
        data = OUTPUT_ERROR;
      }
    }
  }
}
