/*
  test (shell/netcat):
  --------------------
	echo "test\r\n" | nc -w 0 -u 192.168.1.35 8888
*/

#include <ESP8266WiFi.h>
#include <ESP8266mDNS.h>
#include <WiFiUdp.h>
#include <ArduinoOTA.h>

#ifndef STASSID
	#define STASSID "Obi_WANs_wifi"
	#define STAPSK  "bluekenobi"
#endif

unsigned int localPort = 8888;

char InBuffer[UDP_TX_PACKET_MAX_SIZE];
char OutBuffer[] = "acknowledged\r\n";

WiFiUDP Udp;

#define LEDPin 2

int showLED = 0;
int LEDOnTime = 100;

void setup(){
  Serial.begin(115200);

  Serial.println("\nBooting...");

	pinMode(LEDPin, OUTPUT);

  WiFi.mode(WIFI_STA);
  WiFi.begin(STASSID, STAPSK);

	int retries = 10;

  while(WiFi.status() != WL_CONNECTED){
    Serial.print('.');

		--retries;

		if(!retries){
	    Serial.println("Connection Failed! Rebooting...");

			ESP.restart();
		}

		delay(500);
  }

	Serial.print("Connected! IP address: ");
  Serial.println(WiFi.localIP());

  Udp.begin(localPort);

  Serial.printf("UDP server started on port %d\n", localPort);

	// Port defaults to 8266
  // ArduinoOTA.setPort(8266);

  // Hostname defaults to esp8266-[ChipID]
  // ArduinoOTA.setHostname("myesp8266");

  // No authentication by default
  // ArduinoOTA.setPassword("admin");

  // Password can be set with it's md5 value as well
  // MD5(admin) = 21232f297a57a5a743894a0e4a801fc3
  // ArduinoOTA.setPasswordHash("21232f297a57a5a743894a0e4a801fc3");

  ArduinoOTA.onStart([](){
    String type;

    if(ArduinoOTA.getCommand() == U_FLASH){
      type = "sketch";
    }

		else{ // U_SPIFFS
      type = "filesystem";
    }

    // NOTE: if updating SPIFFS this would be the place to unmount SPIFFS using SPIFFS.end()
    Serial.println("Start updating " + type);
  });

  ArduinoOTA.onEnd([](){
    Serial.println("\nEnd");

		for(int x = 0; x < 30; ++x){
      analogWrite(LEDPin, (x * 100) % 1001);

      delay(50);
    }
  });

  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total){
    Serial.printf("Progress: %u%%\r", (progress / (total / 100)));
  });

  ArduinoOTA.onError([](ota_error_t error){
	  // (void)error;

    Serial.printf("Error[%u]: ", error);

    if(error == OTA_AUTH_ERROR){
      Serial.println("Auth Failed");
    }

		else if(error == OTA_BEGIN_ERROR){
      Serial.println("Begin Failed");
    }

		else if(error == OTA_CONNECT_ERROR){
      Serial.println("Connect Failed");
    }

		else if(error == OTA_RECEIVE_ERROR){
      Serial.println("Receive Failed");
    }

		else if(error == OTA_END_ERROR){
      Serial.println("End Failed");
    }

    // ESP.restart();
  });

	ArduinoOTA.begin();

	Serial.println("Arduino OTA Loaded");
}

void loop(){
  ArduinoOTA.handle();

  delay(5);

  int packetSize = Udp.parsePacket();

  if(packetSize){
    Udp.read(InBuffer, packetSize);//UDP_TX_PACKET_MAX_SIZE | packetSize

		Serial.print("Received packet of size ");
    Serial.println(packetSize);
    Serial.print("From ");
    Serial.print(Udp.remoteIP());
    Serial.print(":");
    Serial.println(Udp.remotePort());
    Serial.println("Contents:");
    Serial.println(InBuffer);

    Udp.beginPacket(Udp.remoteIP(), Udp.remotePort());
    Udp.write(OutBuffer);
    Udp.endPacket();

		digitalWrite(LEDPin, LOW);

		++showLED;
  }

	else if(!showLED || showLED > LEDOnTime) showLED = 0;

	else if(showLED < LEDOnTime) ++showLED;
}