const byte numChars = 32;
char receivedChars[numChars];
boolean newData = false;

void write(String message){
	Serial.print(message +"\n");
}

void recvWithStartEndMarkers(){
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

void showNewData(){
	if(newData == true){
		write("Echo: "+ String(receivedChars));

		if(strcmp(receivedChars, "connection_request") == 0){
			write("connected");
		}

		newData = false;
	}
}

void setup(){
	Serial.begin(115200);
}

void loop(){
	recvWithStartEndMarkers();
	showNewData();
}
