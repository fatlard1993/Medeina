bool isConnected;

String info = "{'id': 1, 'type': 'sensor'}";

void setup() {
  Serial.begin(9600);
  isConnected = false;
  delay(100);
  Serial.println("Im a module!");
}

void loop() {

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
