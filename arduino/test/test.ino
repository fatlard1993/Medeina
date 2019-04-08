#include <SimpleDHT.h>

#define DBG false

#define sensor_light A0
#define sensor_button A1
#define sensor_motion 2
#define sensor_temp_humidity_office 10
#define sensor_temp_humidity_lara_cool_side 11
#define sensor_temp_humidity_lara_hot_side 12

#define out_alarm 3
#define out_desk_light 9
#define out_lara_heat 8
#define out_green 7
#define out_lara_fan 6

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
	send("button", String(!button_state));
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

void send_lara_heat(){
	bool state = digitalRead(out_lara_heat);

	send("lara_heat", String(state));
}

void send_desk_light(){
	bool state = digitalRead(out_desk_light);

	send("desk_light", String(state));
}

void send_lara_fan(){
	bool state = digitalRead(out_lara_fan);

	send("lara_fan", String(state));
}

void send_green(){
	bool state = digitalRead(out_green);

	send("green", String(state));
}

void sendStates(){
	send_temp_humidity_office();
	send_temp_humidity_lara_cool_side();
	send_temp_humidity_lara_hot_side();
	send_motion();
	send_button();
	send_light();
	send_lara_heat();
	send_desk_light();
	send_lara_fan();
	send_green();
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
		send("things", "{\"lara_heat\":\"out\",\"desk_light\":\"out\",\"lara_fan\":\"out\"}");
		send("things", "{\"green\":\"out\"}");

		sendString("connected", hub_name);

		sendStates();

		connected = true;
	}

	else if(strcmp(receivedChars, "getStates") == 0){
		sendStates();
	}

	else if(strcmp(receivedChars, "lara_heat 0") == 0){
		digitalWrite(out_lara_heat, LOW);

		send_lara_heat();
	}

	else if(strcmp(receivedChars, "lara_heat 1") == 0){
		digitalWrite(out_lara_heat, HIGH);

		send_lara_heat();
	}

	else if(strcmp(receivedChars, "desk_light 0") == 0){
		digitalWrite(out_desk_light, LOW);

		send_desk_light();
	}

	else if(strcmp(receivedChars, "desk_light 1") == 0){
		digitalWrite(out_desk_light, HIGH);

		send_desk_light();
	}

	else if(strcmp(receivedChars, "lara_fan 0") == 0){
		digitalWrite(out_lara_fan, LOW);

		send_lara_fan();
	}

	else if(strcmp(receivedChars, "lara_fan 1") == 0){
		digitalWrite(out_lara_fan, HIGH);

		send_lara_fan();
	}

	else if(strcmp(receivedChars, "green 0") == 0){
		digitalWrite(out_green, LOW);

		send_green();
	}

	else if(strcmp(receivedChars, "green 1") == 0){
		digitalWrite(out_green, HIGH);

		send_green();
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

  pinMode(out_alarm, OUTPUT);
  pinMode(out_lara_heat, OUTPUT);
  pinMode(out_desk_light, OUTPUT);
  pinMode(out_lara_fan, OUTPUT);
  pinMode(out_green, OUTPUT);
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