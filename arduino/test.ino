//   tone(buzzer, 1000); // Send 1KHz sound signal...
//   delay(1000);        // ...for 1 sec
//   noTone(buzzer);     // Stop sound...
//   delay(1000);        // ...for 1sec



//87-90 temp high side
//74-80 temp low side
//70-75 temp night
//30-40% humid

#include <SimpleDHT.h>

#define DBG false

#define device_light_desk 11
#define device_light 10
#define device_heat 9
#define device_amp 8

#define device_12v_fan 7

#define device_5v_alarm 3

#define sensor_motion 6
#define sensor_temp_humidity 12

#define sensor_analog_light A0

int tempCalibration = -5;
int humidityCalibration = -10;
int onTemp = 87;
int offTemp = 90;
int onTempNight = 70;
int offTempNight = 75;

SimpleDHT11 dht11(sensor_temp_humidity);

void setup(){
  Serial.begin(115200);

  pinMode(sensor_motion, INPUT);
  pinMode(sensor_analog_light, INPUT);

  pinMode(device_light_desk, OUTPUT);
  pinMode(device_light, OUTPUT);
  pinMode(device_heat, OUTPUT);
  pinMode(device_12v_fan, OUTPUT);
  pinMode(device_5v_alarm, OUTPUT);

  digitalWrite(device_light_desk, LOW);
  digitalWrite(device_light, LOW);
  digitalWrite(device_heat, LOW);
  digitalWrite(device_12v_fan, LOW);
  digitalWrite(device_5v_alarm, LOW);
}

void loop(){
  byte temperature = 0;
  byte humidity = 0;
  int err = SimpleDHTErrSuccess;

  if((err = dht11.read(&temperature, &humidity, NULL)) != SimpleDHTErrSuccess){
    if(DBG){
			Serial.print("Sample failed, err=");
			Serial.println(err);
		}

		delay(1000);

    return;
  }

  int tempC = (int)temperature + tempCalibration;
	int tempF = ((9 * tempC) / 5.0) + 32;
	int humidityCal = (int)humidity + humidityCalibration;
	int motion = digitalRead(sensor_motion);
  int lightLevel = analogRead(sensor_analog_light) / 1024;

  Serial.println("================");

  // Serial.print(tempC);
	// Serial.print("* C, ");

	Serial.print(lightLevel);
	Serial.print("% Light, ");

  Serial.print(tempF);
	Serial.print("* F, ");

  Serial.print(humidityCal);
	Serial.println("% H");

	if(motion == 1){
		Serial.println("Motion detected");
	}

	if(tempF < onTemp){
		Serial.println("Heat ON");

	  digitalWrite(device_heat, LOW);
	}

	else if(tempF > offTemp){
		Serial.println("Heat OFF");

	  digitalWrite(device_heat, HIGH);
	}

	delay(1500);// DHT11 sampling rate is 1HZ.
}