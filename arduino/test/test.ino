#include <SimpleDHT.h>

#define DBG false

String DEVICE_ID = "testDevice";

int dht1Pin = 2;

SimpleDHT11 dht1(dht1Pin);

const byte numChars = 32;
char receivedChars[numChars];
boolean newData = false;

boolean connected = false;

unsigned long previousMillis = 0;

void send(String key, String value){
	Serial.println("{\""+ key +"\":\""+ value +"\"}");
}

void receive(){
	static boolean recvInProgress = false;
	static byte ndx = 0;
	char startMarker = '{';
	char endMarker = '}';
	char rc;

	while(Serial.available() > 0 && newData == false){
		rc = Serial.read();

		if(recvInProgress == true){
			if(rc != endMarker){
				receivedChars[ndx] = rc;
				ndx++;

				if(ndx >= numChars){
					ndx = numChars - 1;
				}
			}

			else{
				receivedChars[ndx] = '\0';
				recvInProgress = false;
				ndx = 0;
				newData = true;
			}
		}

		else if(rc == startMarker){
			recvInProgress = true;
		}
	}
}

void handleCommands(){
	if(newData == true){
		if(DBG) send("echo", String(receivedChars));

		if(strcmp(receivedChars, "connection_request") == 0){
			connected = true;

			send("connected", DEVICE_ID);
		}

		else if(strcmp(receivedChars, "request_capabilities") == 0){
			send("capabilities", DEVICE_ID);
		}

		newData = false;
	}
}

void readDHT(){
	byte temperature = 0;
  byte humidity = 0;

  int err = SimpleDHTErrSuccess;

  if((err = dht1.read(&temperature, &humidity, NULL)) != SimpleDHTErrSuccess){
    send("error", String(err));

    return;
  }

	int tempCalibration = 0;//-5;
	int humidityCalibration = 0;//-10;
  int tempC = (double)temperature + tempCalibration;
	int tempF = fahrenheit(tempC);//((9 * tempC) / 5.0) + 32;
	int humidityCal = (int)humidity + humidityCalibration;

	send("temp", String(tempC));
	send("humidity", String(humidityCal));
}

double fahrenheit(double celsius){
  return 1.8 * celsius + 32;
}

void setup(){
  Serial.begin(115200);
}

void loop(){
	receive();

	handleCommands();

	if(connected){
		unsigned long currentMillis = millis();

		if(currentMillis - previousMillis >= 1500){
			previousMillis = currentMillis;

			readDHT();
		}
	}
}