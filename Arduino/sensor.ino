#include <Wire.h>

//========== To be configured by wizard ==========//
#include "DHT.h" // If temp_humidity sensor type is added
#define SLAVE_ADDRESS 0x05
#define SENSOR_1_PIN 2
//========== END ==========//

// Define i2c responce messages
#define NO_DATA 9 // No data ready to be written (try again)
// End responce definition

//========== temp_humidity specific ==========//
DHT sensor_1(SENSOR_1_PIN, DHT11);

int sensor_1_data[2];
//========== END ==========//

char command; // Global place holder for recieved command

void setup(void){
  Wire.begin(SLAVE_ADDRESS);
  Wire.onReceive(receiveEvent);
  Wire.onRequest(requestEvent);

  Serial.begin(9600);

  //========== temp_humidity specific ==========//
  sensor_1.begin();
  //========== END ==========//

  delay(100); // Dont get started TOO fast
}

void loop(){
  update_sensor_1();
}

void receiveEvent(int howMany){
  command = Wire.read();
  Serial.print("command: ");
  Serial.println(command);
}

void requestEvent(void){
  switch (command) {
      case '1':
        Wire.write((uint8_t *)sensor_1_data, 4);
        break;
      case '2':
        Wire.write(100);
        break;
      default:
        Wire.write(NO_DATA);
  }
  command = '0';
}

void update_sensor_1(void) {
  sensor_1_data[0] = sensor_1.readTemperature();
  if (isnan(sensor_1_data[0])) {
    Serial.println("ERROR: Failed to read temp from DHT sensor!");
    return;
  }
  sensor_1_data[1] = sensor_1.readHumidity();
  if (isnan(sensor_1_data[1])) {
    Serial.println("ERROR: Failed to read humidity from DHT sensor!");
    return;
  }
}
