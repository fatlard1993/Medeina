/*---------- Useage ----------
-Initiate connection with 'secret handshake', "Im a module" -> "good"
-Send commands following this structure *XYZ
-X = An enumerated key to send back to the requestor
-Y = The outlet number, a for all
-Z = The action: r(read),0(off),1(on)
-=============================
-The responce will be in this structure: J{'dataType': 'powerData', 'data': 'X/[Y,Y,Y,...]', 'for': 'Z'}
-'data' will either be X(0/1) a single digit, or [Y,Y,Y,...](0/1) an array of digits
-'for' will contain the enumerated transaction key
*/
bool isConnected;

String info = "J{'dataType': 'info', 'address': '0x02', 'type': 'power'}";
String preData = "J{'dataType': 'powerData', 'data': '";
String postData = "', 'for': '";
String postFor = "'}";

//========== To be configured by wizard ==========//
#define NUM_OUTLETS 8
#define FIRST_OUTLET_PIN 2 // The first(lowest number) physical pin
//========== END ==========//

#define ALL 666

int refBit;

void setup(void){
  for(int i = FIRST_OUTLET_PIN; i <= NUM_OUTLETS + (FIRST_OUTLET_PIN - 1); i++){
    pinMode(i, OUTPUT);
    digitalWrite(i, HIGH); // Initialize all outlets to HIGH (off)
  }
  Serial.begin(9600);
  isConnected = false;
  delay(100);
  Serial.println("Im a module!");
}

void loop(void){} // Because Arduino complains if its missing

void serialEvent() {
  String serialRecieved = Serial.readStringUntil('\n');
  if(!isConnected && serialRecieved == "good"){
    isConnected = true;
    delay(100);
    Serial.println(info);
  } else if(isConnected && serialRecieved.charAt(0) == '*'){
    refBit = serialRecieved.charAt(1) -'0';
    char command[2] = {serialRecieved.charAt(2), serialRecieved.charAt(3)}; // [0] = outletNum (1-8), [1] = action (0,1,r)
    int outletNum;
    if(command[1] == 'a'){
      outletNum = ALL;
    } else {
      outletNum = (int)command[1] - '0'; // Convert char to int
      if(outletNum > NUM_OUTLETS || outletNum < 1){
        Serial.println("J{'dataType': 'powerData', 'error': 'outlet not within range - "+String(outletNum)+"'}");
      } else {
        outletNum = outletNum + (FIRST_OUTLET_PIN - 1); // Adjust for the first pin, result is actual arduino pin used
      }
    }
    outlet(outletNum, command[0]);
  }
}

void outlet(int num, char action){
  String dataArray = "J{'dataType': 'powerData', 'data': [";
  if(num == ALL){
    for(int i = FIRST_OUTLET_PIN; i <= NUM_OUTLETS + (FIRST_OUTLET_PIN - 1); i++){
      if(action == 'r'){
        if(i == NUM_OUTLETS + (FIRST_OUTLET_PIN - 1)){ // At the end of this loop
          dataArray = dataArray + !digitalRead(i) + "], 'for': '"+refBit+"'}";
          Serial.println(dataArray);
        } else {
          dataArray = dataArray + !digitalRead(i) + ",";
        }
      } else {
        int iaction = !((int)action - '0'); // Convert char to int and invert
        digitalWrite(i, iaction);
        if(digitalRead(num) == iaction){
          Serial.println("success");
        } else {
          Serial.println("J{'dataType': 'powerData', 'error': 'error setting desired state - D"+String(iaction)+" - R"+digitalRead(num)+"'}");
        }
      }
    }
  }else{
    if(action == 'r'){
      Serial.println(!digitalRead(num));
    } else {
      int iaction = !((int)action - '0'); // Convert char to int and invert
      digitalWrite(num, iaction);
      if(digitalRead(num) == iaction){
        Serial.println("J{'dataType': 'powerData', 'data': 1, 'for': '"+String(refBit)+"'}");
      } else {
        Serial.println("J{'dataType': 'powerData', 'error': 'error setting desired state - D"+String(iaction)+" - R"+digitalRead(num)+"'}");
      }
    }
  }
}
