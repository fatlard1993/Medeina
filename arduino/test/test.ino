#include <SimpleDHT.h>

#define DBG false

#define sensor_light A0
#define sensor_motion 11
SimpleDHT11 sensor_temp_humidity(12);

#define light_update_frequency 5000
#define temp_humidity_update_frequency 1500

unsigned long temp_humidity_check_millis = 0;
unsigned long light_check_millis = 0;

#define out_alarm 3
#define out_red 10
#define out_green 9
#define out_yellow 8
#define out_orange 7
#define out_brown 6
#define out_grey 5
#define out_blue 4
#define out_purple 2

String hub_id = "testDevice";

bool motionState = false;

const byte numChars = 32;
char receivedChars[numChars];
bool newData = false;

bool connected = false;

void send(String type, String payload){
	Serial.println("{\"type\":\""+ type +"\",\"payload\":"+ payload +"}");
}

void sendString(String type, String payload){
	send(type, "\""+ payload +"\"");
}

void receive(){
	static bool recvInProgress = false;
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
	if(newData == false) return;

	if(DBG) sendString("echo", String(receivedChars));

	if(strcmp(receivedChars, "connection_request") == 0){
		send("things", "{\"light\":{\"type\":\"in\"},\"motion\":{\"type\":\"in\"},\"temp_humidity\":{\"type\":\"in\"}}");
		send("things", "{\"red\":{\"type\":\"out\"},\"green\":{\"type\":\"out\"},\"yellow\":{\"type\":\"out\"},\"orange\":{\"type\":\"out\"}}");
		send("things", "{\"brown\":{\"type\":\"out\"},\"grey\":{\"type\":\"out\"},\"blue\":{\"type\":\"out\"},\"purple\":{\"type\":\"out\"}}");

		sendString("connected", hub_id);

		connected = true;
	}

	else if(strcmp(receivedChars, "yellow=off") == 0){
		send("state", "{\"thing\":\"yellow\",\"state\":\"off\"}");

		digitalWrite(out_yellow, HIGH);
	}

	else if(strcmp(receivedChars, "yellow=on") == 0){
		send("state", "{\"thing\":\"yellow\",\"state\":\"on\"}");

		digitalWrite(out_yellow, LOW);
	}

	else if(strcmp(receivedChars, "grey=off") == 0){
		send("state", "{\"thing\":\"grey\",\"state\":\"off\"}");

		digitalWrite(out_grey, HIGH);
	}

	else if(strcmp(receivedChars, "grey=on") == 0){
		send("state", "{\"thing\":\"grey\",\"state\":\"on\"}");

		digitalWrite(out_grey, LOW);
	}

	else if(strcmp(receivedChars, "blue=off") == 0){
		send("state", "{\"thing\":\"blue\",\"state\":\"off\"}");

		digitalWrite(out_blue, HIGH);
	}

	else if(strcmp(receivedChars, "blue=on") == 0){
		send("state", "{\"thing\":\"blue\",\"state\":\"on\"}");

		digitalWrite(out_blue, LOW);
	}

	newData = false;
}

double fahrenheit(double celsius){
  return 1.8 * celsius + 32;
}

void readDHT(){
	unsigned long currentMillis = millis();

	if(currentMillis - temp_humidity_check_millis <= temp_humidity_update_frequency) return;

	temp_humidity_check_millis = currentMillis;

	byte temperature = 0;
  byte humidity = 0;

  int err = SimpleDHTErrSuccess;

  if((err = sensor_temp_humidity.read(&temperature, &humidity, NULL)) != SimpleDHTErrSuccess){
    sendString("error", String(err));

    return;
  }

	int tempCalibration = 0;//-5;
	int humidityCalibration = 0;//-10;
  int tempC = (double)temperature + tempCalibration;
	int tempF = fahrenheit(tempC);//((9 * tempC) / 5.0) + 32;
	int humidityCal = (int)humidity + humidityCalibration;

	send("state", "{\"thing\":\"temp_humidity\",\"state\":{\"temp\":\""+ String(tempF) +"\",\"humidity\":\""+ String(humidityCal) +"\"}}");
}

void readLight(){
	unsigned long currentMillis = millis();

	if(currentMillis - light_check_millis <= light_update_frequency) return;

	light_check_millis = currentMillis;

	int lightLevel = analogRead(sensor_light) / 1024;

	send("state", "{\"thing\":\"light\",\"state\":\""+ String(lightLevel) +"\"}");
}

void readMotion(){
	bool motion = digitalRead(sensor_motion);

	if(motion != motionState){
		send("state", "{\"thing\":\"motion\",\"state\":\""+ String(motion) +"\"}");

		motionState = motion;
	}
}

void setup(){
  Serial.begin(115200);

  pinMode(sensor_light, INPUT);
  pinMode(sensor_motion, INPUT);

  pinMode(out_alarm, OUTPUT);
  pinMode(out_red, OUTPUT);
  pinMode(out_green, OUTPUT);
  pinMode(out_yellow, OUTPUT);
  pinMode(out_orange, OUTPUT);
  pinMode(out_brown, OUTPUT);
  pinMode(out_grey, OUTPUT);
  pinMode(out_blue, OUTPUT);
  pinMode(out_purple, OUTPUT);
}

void loop(){
	receive();

	handleCommands();

	if(connected == false) return;

	readLight();

	readDHT();

	readMotion();
}