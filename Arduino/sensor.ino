#include <Wire.h>
#include <PciManager.h>
#include <SoftTimer.h>
#include "DHT.h"
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
  char command = Wire.read();
  Serial.print("command: ");
  Serial.println(command);
}

void requestEvent(void){
  switch (command) {
      case 1:
        Wire.write((uint8_t *)temp_humidity_data, 4);
        break;
      case 2:
        Wire.write(waterLevel);
        break;
      default:
        Wire.write(NO_DATA);
  }
  command = 0;
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
//========== To be configured by wizard ==========//
#define SLAVE_ADDRESS 0x05
//========== END ==========//

// Define i2c responce messages
#define NO_DATA 9 // No data ready to be written (try again)

int data = NO_DATA; // Data to be writen back to I2c master
int request = 0;

//========== temp_humidity specific ==========//
#define TEMP_HUMIDITY_SENSOR 2
#define TEMP_HUMIDITY_INTERVAL 2000
#define TEMP_HUMIDITY_PRECISION 5 // How many readings per average
DHT dht(TEMP_HUMIDITY_SENSOR, DHT11);

float tempPlaceholder;
int tempIndex;

float humidityPlaceholder;
int humidityIndex;

int temp_humidity_data[2];

void check_temp_humidity(Task* me) {
  if(tempIndex < TEMP_HUMIDITY_PRECISION){
    float tempReading = dht.readTemperature();
    if (isnan(tempReading)) {
      Serial.println("ERROR: Failed to read temp from DHT sensor!");
      return;
    }
    tempPlaceholder = tempPlaceholder + tempReading;
    tempIndex++;
  } else{
    temp_humidity_data[0] = (int) (tempPlaceholder / TEMP_HUMIDITY_PRECISION);
    tempIndex = 0;
    tempPlaceholder = 0;
  }
  
  if(humidityIndex < TEMP_HUMIDITY_PRECISION){
    float humidityReading = dht.readHumidity();
    if (isnan(humidityReading)) {
      Serial.println("ERROR: Failed to read humidity from DHT sensor!");
      return;
    }
    humidityPlaceholder = humidityPlaceholder + humidityReading;
    humidityIndex++;
  } else{
    temp_humidity_data[1] = (int) (humidityPlaceholder / TEMP_HUMIDITY_PRECISION);
    humidityIndex = 0;
    humidityPlaceholder = 0;
  }
}
Task TempHumidity(TEMP_HUMIDITY_INTERVAL, check_temp_humidity);
//========== END ==========//

void setup(void){
  Wire.begin(SLAVE_ADDRESS);
  Wire.onReceive(receiveEvent);
  Wire.onRequest(requestEvent);

  Serial.begin(9600);

  //========== temp_humidity specific ==========//
  dht.begin();
  SoftTimer.add(&TempHumidity);
  //========== END ==========//
}

void receiveEvent(int howMany){
  int receiveByte = 0;
  char command[howMany];
  while(Wire.available()){
    command[receiveByte] = Wire.read();
    receiveByte++;
  }
  if(command[0] == '1'){
    request = 1;
  }
}

void requestEvent(void){
  if(request == 1){
    Wire.write((uint8_t *)temp_humidity_data, sizeof(temp_humidity_data));
  } else{
    Wire.write(data);
  }
  data = NO_DATA;
  request = 0;
}

