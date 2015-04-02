String writeData = "nigga";
bool isConnected;
bool responded;

String info = "{'id': 1}";

void setup() {
  Serial.begin(9600);
  isConnected = false;
  responded = false;
  delay(100);
  Serial.println("Im a module!");
}

void loop() {
  if(writeData != "nigga"){responded = true;}
  if(isConnected && random(0, 19999) == 1 && !responded){
    Serial.println(writeData);
  }
}

void serialEvent() {
  String serialRecieved = Serial.readStringUntil('\n');
  if(serialRecieved == "good"){
    isConnected = true;
    Serial.println("connected");
  } else if(serialRecieved == "stop"){
    switch(random(0, 4)){
      case 0:
        writeData = "cracker!";
        break;
      case 1:
        writeData = "fine!";
        break;
      case 2:
        writeData = "hoe!";
        break;
      case 3:
        writeData = "ok..";
        break;
    }
    Serial.println(writeData);
  }
}
