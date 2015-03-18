#include <Wire.h>
#include <PciManager.h>
#include <PciListenerImp.h>
#include <SoftTimer.h>
#include <LiquidCrystal.h>
#include "DHT.h"

// DEFINE SENSOR PINS
#define SOIL_MOISTURE_SENSOR_IN A0
#define SOIL_MOISTURE_SENSOR_OUT 9
#define TEMP_HUMIDITY_SENSOR 8
#define WATER_LEVEL_SENSOR 10

// DEFINE OBJECT PINS
#define WATER_PUMP 12 // Yellow LED
#define BLOWER 11 // Red LED

#define SLAVE_ADDRESS 0x04 // I2c Address
#define SENSOR_PRECISION 5 // How many readings per average
#define DRY_SOIL 0 // Sensor reading for when to water

Task SoilMoisture(2000, checkSoilMoisture);
//Task TempHumidity(2000, checkTempHumidity);

PciListenerImp waterLevelListener(WATER_LEVEL_SENSOR, onWaterLevelChange);
LiquidCrystal lcd(2, 3, 4, 5, 6, 7);
DHT dht(TEMP_HUMIDITY_SENSOR, DHT11);

float tempPlaceholder;
int tempIndex;
int tempAverage;

float humidityPlaceholder;
int humidityIndex;
int humidityAverage;

float soilMoisturePlaceholder;
int soilMoistureIndex;
int soilMoistureAverage;

void setup() {
  pinMode(WATER_LEVEL_SENSOR, INPUT_PULLUP);
  pinMode(SOIL_MOISTURE_SENSOR_IN, OUTPUT);
  pinMode(SOIL_MOISTURE_SENSOR_OUT, OUTPUT);
  pinMode(WATER_PUMP, OUTPUT);
  pinMode(BLOWER, OUTPUT);
  //pinMode(LIGHTS, OUTPUT);
  
  Wire.begin(SLAVE_ADDRESS);
  Serial.begin(115200);
  lcd.begin(16, 2);
  dht.begin();
  
  Wire.onReceive(receiveData);
  Wire.onRequest(sendData);
  
  PciManager.registerListener(WATER_LEVEL_SENSOR, &waterLevelListener);
  
  SoftTimer.add(&SoilMoisture);
  //SoftTimer.add(&TempHumidity);
}

void checkSoilMoisture(Task* me) {
  if(soilMoistureIndex < SENSOR_PRECISION){
    pinMode(SOIL_MOISTURE_SENSOR_IN, INPUT);
    digitalWrite(SOIL_MOISTURE_SENSOR_OUT, HIGH);
    float soilMoistureReading = analogRead(SOIL_MOISTURE_SENSOR_IN);
    // Clear everything for next measurement
    digitalWrite(SOIL_MOISTURE_SENSOR_OUT, LOW);
    pinMode(SOIL_MOISTURE_SENSOR_IN, OUTPUT);
    
    soilMoistureReading = soilMoistureReading * 24.48 / (1024 - soilMoistureReading);
    Serial.print("Soil Moisture: ");
    Serial.println(soilMoistureReading);
    soilMoisturePlaceholder = soilMoisturePlaceholder + soilMoistureReading;
    soilMoistureIndex++;
    
    lcd.setCursor(0, 0);
    lcd.print("New data in: ");
    lcd.print(SENSOR_PRECISION - soilMoistureIndex);
  } else{
    soilMoistureAverage = (int) ((soilMoisturePlaceholder / SENSOR_PRECISION) + .5);
    soilMoistureIndex = 0;
    soilMoisturePlaceholder = 0;
    Serial.print("Soil Moisture Average: ");
    Serial.println(soilMoistureAverage);
    
    lcd.setCursor(0, 1);
    lcd.print("Soil Moisture ");
    lcd.print(soilMoistureAverage);
    
    if(soilMoistureAverage <= DRY_SOIL){
      water(1000);
    }
  }
}

void checkTempHumidity(Task* me) {
  if(tempIndex < SENSOR_PRECISION){
    float tempReading = dht.readTemperature();
    if (isnan(tempReading)) {
      Serial.println("ERROR: Failed to read temp from DHT sensor!");
      return;
    }
    Serial.print("Temperature: "); 
    Serial.print(tempReading);
    Serial.println(" *C");
    
    tempPlaceholder = tempPlaceholder + tempReading;
    tempIndex++;
  } else{
    tempAverage = (int) (tempPlaceholder / SENSOR_PRECISION);
    tempIndex = 0;
    tempPlaceholder = 0;
    Serial.print("Temperature Average: ");
    Serial.println(tempAverage);
  }
  
  if(humidityIndex < SENSOR_PRECISION){
    float humidityReading = dht.readHumidity();
    if (isnan(humidityReading)) {
      Serial.println("ERROR: Failed to read humidity from DHT sensor!");
      return;
    }
    Serial.print("Humidity: "); 
    Serial.print(humidityReading);
    Serial.println(" %");
    
    humidityPlaceholder = humidityPlaceholder + humidityReading;
    humidityIndex++;
  } else{
    humidityAverage = (int) (humidityPlaceholder / SENSOR_PRECISION);
    humidityIndex = 0;
    humidityPlaceholder = 0;
    Serial.print("Humidity Average: ");
    Serial.println(humidityAverage);
  }
}

void onWaterLevelChange(byte state) {
  if(state == 0){
    digitalWrite(WATER_PUMP, LOW);
  }
}

void water(int howMuch){
  digitalWrite(WATER_PUMP, HIGH);
  delay(howMuch);
  digitalWrite(WATER_PUMP, LOW);
}

void receiveData(int byteCount){
  int data = 0;//Wire.Read();
  Serial.print("I2c Recieved Data: ");
  Serial.println(data);
}

void sendData(){
 Wire.write(1);
}
