bool isConnected;

String info = "J{'dataType': 'info', 'address': '0x02', 'type': 'power'}";

//========== To be configured by wizard ==========//
#define NUM_OUTLETS 8
#define FIRST_OUTLET_PIN 2 // The first(lowest number) physical pin
//========== END ==========//

#define ALL 666

bool outletState[NUM_OUTLETS];
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
        Serial.println("error");
      } else {
        outletNum = outletNum + (FIRST_OUTLET_PIN - 1); // Adjust for the first pin, result is actual arduino pin used
      }
    }
    outlet(outletNum, command[0]);
  }
}

void outlet(int num, char action){
  if(num == ALL){
    for(int i = FIRST_OUTLET_PIN; i <= NUM_OUTLETS + (FIRST_OUTLET_PIN - 1); i++){
      if(action == 'r'){
        outletState[i - FIRST_OUTLET_PIN] = !digitalRead(i);
        Serial.println(i);
        if(i == NUM_OUTLETS + (FIRST_OUTLET_PIN - 1)){ // At the end of this loop
          Serial.println("Fuck me...");
        }
      } else {
        int iaction = !((int)action - '0'); // Convert char to int and invert
        digitalWrite(i, iaction);
        if(digitalRead(num) == iaction){
          Serial.println("success");
        } else {
          Serial.println("error");
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
        Serial.println("success");
      } else {
        Serial.println("error");
      }
    }
  }
}
