bool isConnected;

String info = "{'dataType': 'info', 'id': 1, 'type': 'sensor'}";
String sensor1Data = "{'dataType': 'sensorData', 'id': 1, 'type': 'temp_humidity', 'data': '24,35'}";

void setup() {
  Serial.begin(9600);
  isConnected = false;
  delay(100);
  Serial.println("Im a module!");
}

void loop() {
  if(random(0, 3000) == 1){
    Serial.println(sensor1Data);
  }
}

void serialEvent() {
  String serialRecieved = Serial.readStringUntil('\n');
  if(!isConnected && serialRecieved == "good"){
    isConnected = true;
    Serial.println("connected");
    delay(100);
    Serial.println(info);
  } else if(serialRecieved == "test"){
    Serial.println("testing!");
  }
}
