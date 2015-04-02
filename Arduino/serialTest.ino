String writeData = "nigga";
bool isConnected = false;

void setup() {
  Serial.begin(9600);
  Serial.println("Im #1");
}

void loop() {
  if(isConnected){
    delay(1000);
    Serial.println(writeData);
  }
}

void serialEvent() {
  String serialRecieved = Serial.readStringUntil('\n');
  Serial.println(serialRecieved);
  if(serialRecieved == "good"){
    isConnected = true;
  } else if(serialRecieved == "stop"){
    writeData = "cracker!";
  }
}
