#include <SimpleDHT.h>

#define DBG false

#define sensor_light A0
#define sensor_motion A1
#define sensor_button A3
#define sensor_temp_humidity_office 10
#define sensor_temp_humidity_lara_cool_side 11
#define sensor_temp_humidity_lara_hot_side 12

#define out_fan 2
#define out_alarm 3
#define out_red 13
#define out_green 9
#define out_yellow 8
#define out_orange 7
#define out_brown 6
#define out_grey 5
#define out_blue 4
// #define out_purple 2

#define light_update_frequency 2000
#define temp_humidity_update_frequency 3000
#define debounce_delay 50

String hub_name = "hub1";

SimpleDHT11 DHT11_temp_humidity_office(sensor_temp_humidity_office);
SimpleDHT11 DHT11_temp_humidity_lara_cool_side(sensor_temp_humidity_lara_cool_side);
SimpleDHT11 DHT11_temp_humidity_lara_hot_side(sensor_temp_humidity_lara_hot_side);

byte temp_office_state = 0;
byte humidity_office_state = 0;
byte temp_lara_cool_side_state = 0;
byte humidity_lara_cool_side_state = 0;
byte temp_lara_hot_side_state = 0;
byte humidity_lara_hot_side_state = 0;

unsigned long temp_humidity_check_millis = 0;
unsigned long light_check_millis = 0;

bool button_state;
bool last_button_state = false;
unsigned long last_debounce_time = 0;

bool motion_state = false;

int light_level = 0;

const byte numChars = 32;
char receivedChars[numChars];
bool newData = false;

bool connected = false;

void send(String type, String payload){
	Serial.print("{\""+ type +"\":"+ payload +"}\n");
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

void send_light(){
	send("light", String(light_level));
}

void send_button(){
	send("button", String(button_state));
}

void send_motion(){
	send("motion", String(motion_state));
}

void send_temp_humidity_office(){
	send("temp_office", String(temp_office_state));
	send("humidity_office", String(humidity_office_state));
}

void send_temp_humidity_lara_cool_side(){
	send("temp_lara_cool_side", String(temp_lara_cool_side_state));
	send("humidity_lara_cool_side", String(humidity_lara_cool_side_state));
}

void send_temp_humidity_lara_hot_side(){
	send("temp_lara_hot_side", String(temp_lara_hot_side_state));
	send("humidity_lara_hot_side", String(humidity_lara_hot_side_state));
}

void send_yellow(){
	bool state = digitalRead(out_yellow);

	send("yellow", String(!state));
}

void send_blue(){
	bool state = digitalRead(out_blue);

	send("blue", String(!state));
}

void send_brown(){
	bool state = digitalRead(out_brown);

	send("brown", String(!state));
}

void send_green(){
	bool state = digitalRead(out_green);

	send("green", String(!state));
}

void send_fan(){
	bool state = digitalRead(out_fan);

	send("fan", String(state));
}

void sendStates(){
	send_temp_humidity_office();
	send_temp_humidity_lara_cool_side();
	send_temp_humidity_lara_hot_side();
	send_motion();
	send_button();
	send_light();
	send_yellow();
	send_blue();
	send_brown();
	send_green();
	send_fan();
}

void handleCommands(){
	if(newData == false) return;

	if(DBG) sendString("echo", String(receivedChars));

	if(strcmp(receivedChars, "connection_request") == 0){
		// maybe these names should be more simple on the arduino side .. like just the pin definitions? Or even indexes in an array.
		send("things", "{\"light\":\"in\",\"button\":\"in\",\"motion\":\"in\"}");
		send("things", "{\"temp_office\":\"in\",\"humidity_office\":\"in\"}");
		send("things", "{\"temp_lara_cool_side\":\"in\",\"humidity_lara_cool_side\":\"in\"}");
		send("things", "{\"temp_lara_hot_side\":\"in\",\"humidity_lara_hot_side\":\"in\"}");
		send("things", "{\"fan\":\"out\"}");
		send("things", "{\"yellow\":\"out\",\"brown\":\"out\",\"blue\":\"out\"}");
		send("things", "{\"green\":\"out\"}");
		// send("things", "{\"purple\":\"out\"}");
		// send("things", "{\"red\":\"out\",\"grey\":\"out\",\"orange\":\"out\"}");

		sendString("connected", hub_name);

		sendStates();

		connected = true;
	}

	else if(strcmp(receivedChars, "getStates") == 0){
		sendStates();
	}

	else if(strcmp(receivedChars, "yellow 0") == 0){
		digitalWrite(out_yellow, HIGH);

		send_yellow();
	}

	else if(strcmp(receivedChars, "yellow 1") == 0){
		digitalWrite(out_yellow, LOW);

		send_yellow();
	}

	else if(strcmp(receivedChars, "blue 0") == 0){
		digitalWrite(out_blue, HIGH);

		send_blue();
	}

	else if(strcmp(receivedChars, "blue 1") == 0){
		digitalWrite(out_blue, LOW);

		send_blue();
	}

	else if(strcmp(receivedChars, "brown 0") == 0){
		digitalWrite(out_brown, HIGH);

		send_brown();
	}

	else if(strcmp(receivedChars, "brown 1") == 0){
		digitalWrite(out_brown, LOW);

		send_brown();
	}

	else if(strcmp(receivedChars, "green 0") == 0){
		digitalWrite(out_green, HIGH);

		send_green();
	}

	else if(strcmp(receivedChars, "green 1") == 0){
		digitalWrite(out_green, LOW);

		send_green();
	}

	else if(strcmp(receivedChars, "fan 0") == 0){
		digitalWrite(out_fan, LOW);

		send_fan();
	}

	else if(strcmp(receivedChars, "fan 1") == 0){
		digitalWrite(out_fan, HIGH);

		send_fan();
	}

	newData = false;
}

void readDHT(){
	unsigned long currentMillis = millis();

	if(currentMillis - temp_humidity_check_millis <= temp_humidity_update_frequency) return;

	temp_humidity_check_millis = currentMillis;

	readDHT_office();
	readDHT_lara_cool_side();
	readDHT_lara_hot_side();
}

void readDHT_office(){
  int err = SimpleDHTErrSuccess;

  if((err = DHT11_temp_humidity_office.read(&temp_office_state, &humidity_office_state, NULL)) != SimpleDHTErrSuccess){
    sendString("error", String(err));

    return;
  }

	send_temp_humidity_office();
}

void readDHT_lara_cool_side(){
  int err = SimpleDHTErrSuccess;

  if((err = DHT11_temp_humidity_lara_cool_side.read(&temp_lara_cool_side_state, &humidity_lara_cool_side_state, NULL)) != SimpleDHTErrSuccess){
    sendString("error", String(err));

    return;
  }

	send_temp_humidity_lara_cool_side();
}

void readDHT_lara_hot_side(){
  int err = SimpleDHTErrSuccess;

  if((err = DHT11_temp_humidity_lara_hot_side.read(&temp_lara_hot_side_state, &humidity_lara_hot_side_state, NULL)) != SimpleDHTErrSuccess){
    sendString("error", String(err));

    return;
  }

	send_temp_humidity_lara_hot_side();
}

void readLight(){
	unsigned long currentMillis = millis();

	if(currentMillis - light_check_millis <= light_update_frequency) return;

	light_check_millis = currentMillis;

	light_level = analogRead(sensor_light);

	send_light();
}

void readMotion(){
	bool reading = digitalRead(sensor_motion);

	if(reading != motion_state){
		motion_state = reading;

		send_motion();
	}
}

void readButton(){
	bool reading = digitalRead(sensor_button);

  if(reading != last_button_state) last_debounce_time = millis();

  if(millis() - last_debounce_time > debounce_delay && reading != button_state){
		button_state = reading;

		send_button();
  }

  last_button_state = reading;
}

void setup(){
  Serial.begin(115200);

  pinMode(sensor_light, INPUT);
  pinMode(sensor_button, INPUT);
  pinMode(sensor_motion, INPUT);

  pinMode(out_fan, OUTPUT);
  pinMode(out_alarm, OUTPUT);
  pinMode(out_red, OUTPUT);
  pinMode(out_green, OUTPUT);
  pinMode(out_yellow, OUTPUT);
  pinMode(out_orange, OUTPUT);
  pinMode(out_brown, OUTPUT);
  pinMode(out_grey, OUTPUT);
  pinMode(out_blue, OUTPUT);
  // pinMode(out_purple, OUTPUT);
}

void loop(){
	receive();

	handleCommands();

	if(connected == false) return;

	readButton();

	readLight();

	readDHT();

	readMotion();
}