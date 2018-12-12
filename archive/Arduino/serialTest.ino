bool isConnected;

String info = "J{'dataType': 'info', 'address': '0x01', 'type': 'sensor', 'sensors': ['temp_humidity', 'waterLevel', 'soilMoisture']}";
String sensor1Data = "J{'dataType': 'sensorData', 'hostAddress': '0x01', 'id': 1, 'type': 'temp_humidity', 'data': '24,35'}";
String sensor2Data = "J{'dataType': 'sensorData', 'hostAddress': '0x01', 'id': 2, 'type': 'waterLevel', 'data': '87'}";
String sensor3Data = "J{'dataType': 'sensorData', 'hostAddress': '0x01', 'id': 3, 'type': 'soilMoisture', 'data': '96'}";

void setup() {
  Serial.begin(9600);
  isConnected = false;
  delay(100);
  Serial.println("Im a module!");
}

void loop() {
  if(random(0, 8000) == 2146 && isConnected){
    switch(random(0, 3)){
      case 0:
        Serial.println(sensor1Data);
        break;
      case 1:
        Serial.println(sensor2Data);
        break;
      case 2:
        Serial.println(sensor3Data);
        break;
    }
  }
}

void serialEvent() {
  String serialRecieved = Serial.readStringUntil('\n');
  if(!isConnected && serialRecieved == "good"){
    isConnected = true;
    delay(100);
    Serial.println(info);
  } else if(serialRecieved == "test"){
    Serial.println("testing!");
  }
}
