#ifndef __SIMPLE_DHT_H
#define __SIMPLE_DHT_H

#include <Arduino.h>

// High 8bits are time duration.
// Low 8bits are error code.
// For example, 0x0310 means t=0x03 and code=0x10,
// which is start low signal(0x10) error.
// @see https://github.com/winlinvip/SimpleDHT/issues/25
#define simpleDHTCombileError(t, err) ((t << 8) & 0xff00) | (err & 0x00ff)

// Success.
#define SimpleDHTErrSuccess 0
// Error to wait for start low signal.
#define SimpleDHTErrStartLow 0x10
// Error to wait for start high signal.
#define SimpleDHTErrStartHigh 0x11
// Error to wait for data start low signal.
#define SimpleDHTErrDataLow 0x12
// Error to wait for data read signal.
#define SimpleDHTErrDataRead 0x13
// Error to wait for data EOF signal.
#define SimpleDHTErrDataEOF 0x14
// Error to validate the checksum.
#define SimpleDHTErrDataChecksum 0x15
// Error when temperature and humidity are zero, it shouldn't happen.
#define SimpleDHTErrZeroSamples 0x16
// Error when pin is not initialized.
#define SimpleDHTErrNoPin 0x17

class SimpleDHT {
protected:
    long levelTimeout = 5000000; // 500ms
    int pin = -1;
#ifdef __AVR
    // For direct GPIO access (8-bit AVRs only), store port and bitmask
    // of the digital pin connected to the DHT.
    // (other platforms use digitalRead(), do not need this)
    uint8_t bitmask = 0xFF;
    uint8_t port    = 0xFF;
#endif
public:
    SimpleDHT();
    SimpleDHT(int pin);
public:
    // to read from dht11 or dht22.
    // @param pin the DHT11 pin.
    // @param ptemperature output, NULL to igore. In Celsius.
    // @param phumidity output, NULL to ignore.
    //      For DHT11, in H, such as 35H.
    //      For DHT22, in RH%, such as 53%RH.
    // @param pdata output 40bits sample, NULL to ignore.
    // @remark the min delay for this method is 1s(DHT11) or 2s(DHT22).
    // @return SimpleDHTErrSuccess is success; otherwise, failed.
    virtual int read(byte* ptemperature, byte* phumidity, byte pdata[40]);
    virtual int read(int pin, byte* ptemperature, byte* phumidity, byte pdata[40]);
    // to get a more accurate data.
    // @remark it's available for dht22. for dht11, it's the same of read().
    virtual int read2(float* ptemperature, float* phumidity, byte pdata[40]) = 0;
    virtual int read2(int pin, float* ptemperature, float* phumidity, byte pdata[40]) = 0;
protected:
    // (eventually) change the pin configuration for existing instance
    // @param pin the DHT11 pin.
    void setPin( int pin );
    // only AVR - methods returning low level conf. of the pin
#ifdef __AVR
    // @return bitmask to access pin state from port input register
    int getBitmask();
    // @return bitmask to access pin state from port input register
    int getPort();
#endif
protected:
    // measure and return time (in microseconds)
    // with precision defined by interval between checking the state
    // while pin is in specified state (HIGH or LOW)
    // @param level    state which time is measured.
    // @param interval time interval between consecutive state checks.
    // @return measured time (microseconds). -1 if timeout.
    virtual long levelTime(byte level, int firstWait = 10, int interval = 6);
    // @data the bits of a byte.
    // @remark please use simple_dht11_read().
    virtual byte bits2byte(byte data[8]);
    // read temperature and humidity from dht11.
    // @param data a byte[40] to read bits to 5bytes.
    // @return 0 success; otherwise, error.
    // @remark please use simple_dht11_read().
    virtual int sample(byte data[40]) = 0;
    // parse the 40bits data to temperature and humidity.
    // @remark please use simple_dht11_read().
    virtual int parse(byte data[40], short* ptemperature, short* phumidity);
};

/*
    Simple DHT11

    Simple, Stable and Fast DHT11 library.

    The circuit:
    * VCC: 5V or 3V
    * GND: GND
    * DATA: Digital ping, for instance 2.

    23 Jan 2016 By winlin <winlin@vip.126.com>

    https://github.com/winlinvip/SimpleDHT#usage
    https://akizukidenshi.com/download/ds/aosong/DHT11.pdf
    https://cdn-shop.adafruit.com/datasheets/DHT11-chinese.pdf

*/
class SimpleDHT11 : public SimpleDHT {
public:
    SimpleDHT11();
    SimpleDHT11(int pin);
public:
    virtual int read2(float* ptemperature, float* phumidity, byte pdata[40]);
    virtual int read2(int pin, float* ptemperature, float* phumidity, byte pdata[40]);
protected:
    virtual int sample(byte data[40]);
};

/*
    Simple DHT22

    Simple, Stable and Fast DHT22 library.

    The circuit:
    * VCC: 5V or 3V
    * GND: GND
    * DATA: Digital ping, for instance 2.

    3 Jun 2017 By winlin <winlin@vip.126.com>

    https://github.com/winlinvip/SimpleDHT#usage
    http://akizukidenshi.com/download/ds/aosong/AM2302.pdf
    https://cdn-shop.adafruit.com/datasheets/DHT22.pdf

*/
class SimpleDHT22 : public SimpleDHT {
public:
    SimpleDHT22();
    SimpleDHT22(int pin);
public:
    virtual int read2(float* ptemperature, float* phumidity, byte pdata[40]);
    virtual int read2(int pin, float* ptemperature, float* phumidity, byte pdata[40]);
protected:
    virtual int sample(byte data[40]);
};

#endif


SimpleDHT::SimpleDHT() {
}

SimpleDHT::SimpleDHT(int pin) {
    setPin(pin);
}

int SimpleDHT::read(byte* ptemperature, byte* phumidity, byte pdata[40]) {
    int ret = SimpleDHTErrSuccess;

    if (pin == -1) {
        return SimpleDHTErrNoPin;
    }

    float temperature = 0;
    float humidity = 0;
    if ((ret = read2(&temperature, &humidity, pdata)) != SimpleDHTErrSuccess) {
        return ret;
    }

    if (ptemperature) {
        *ptemperature = (byte)(int)temperature;
    }

    if (phumidity) {
        *phumidity = (byte)(int)humidity;
    }

    return ret;
}

int SimpleDHT::read(int pin, byte* ptemperature, byte* phumidity, byte pdata[40]) {
    setPin(pin);
    return read(ptemperature, phumidity, pdata);
}

void SimpleDHT::setPin(int pin) {
    this->pin = pin;
#ifdef __AVR
    // (only AVR) - set low level properties for configured pin
    bitmask = digitalPinToBitMask(pin);
    port = digitalPinToPort(pin);
#endif
}

#ifdef __AVR
int SimpleDHT::getBitmask() {
    return bitmask;
}

int SimpleDHT::getPort() {
    return port;
}
#endif

long SimpleDHT::levelTime(byte level, int firstWait, int interval) {
    unsigned long time_start = micros();
    long time = 0;

#ifdef __AVR
    uint8_t portState = level ? bitmask : 0;
#endif

    bool loop = true;
    for (int i = 0 ; loop; i++) {
        if (time < 0 || time > levelTimeout) {
            return -1;
        }

        if (i == 0) {
            if (firstWait > 0) {
                delayMicroseconds(firstWait);
            }
        } else if (interval > 0) {
            delayMicroseconds(interval);
        }

        // for an unsigned int type, the difference have a correct value
        // even if overflow, explanation here:
        //     https://arduino.stackexchange.com/questions/33572/arduino-countdown-without-using-delay
        time = micros() - time_start;

#ifdef __AVR
        loop = ((*portInputRegister(port) & bitmask) == portState);
#else
        loop = (digitalRead(pin) == level);
#endif
    }

    return time;
}

byte SimpleDHT::bits2byte(byte data[8]) {
    byte v = 0;
    for (int i = 0; i < 8; i++) {
        v += data[i] << (7 - i);
    }
    return v;
}

int SimpleDHT::parse(byte data[40], short* ptemperature, short* phumidity) {
    short humidity = bits2byte(data);
    short humidity2 = bits2byte(data + 8);
    short temperature = bits2byte(data + 16);
    short temperature2 = bits2byte(data + 24);
    byte check = bits2byte(data + 32);
    byte expect = (byte)humidity + (byte)humidity2 + (byte)temperature + (byte)temperature2;
    if (check != expect) {
        return SimpleDHTErrDataChecksum;
    }

    *ptemperature = temperature<<8 | temperature2;
    *phumidity = humidity<<8 | humidity2;

    return SimpleDHTErrSuccess;
}

SimpleDHT11::SimpleDHT11() {
}

SimpleDHT11::SimpleDHT11(int pin) : SimpleDHT (pin) {
}

int SimpleDHT11::read2(float* ptemperature, float* phumidity, byte pdata[40]) {
    int ret = SimpleDHTErrSuccess;

    if (pin == -1) {
        return SimpleDHTErrNoPin;
    }

    byte data[40] = {0};
    if ((ret = sample(data)) != SimpleDHTErrSuccess) {
        return ret;
    }

    short temperature = 0;
    short humidity = 0;
    if ((ret = parse(data, &temperature, &humidity)) != SimpleDHTErrSuccess) {
        return ret;
    }

    if (pdata) {
        memcpy(pdata, data, 40);
    }
    if (ptemperature) {
        *ptemperature = (int)(temperature>>8);
    }
    if (phumidity) {
        *phumidity = (int)(humidity>>8);
    }

    // For example, when remove the data line, it will be success with zero data.
    if (temperature == 0 && humidity == 0) {
        return SimpleDHTErrZeroSamples;
    }

    return ret;
}

int SimpleDHT11::read2(int pin, float* ptemperature, float* phumidity, byte pdata[40]) {
    setPin(pin);
    return read2(ptemperature, phumidity, pdata);
}

int SimpleDHT11::sample(byte data[40]) {
    // empty output data.
    memset(data, 0, 40);

    // According to protocol: [1] https://akizukidenshi.com/download/ds/aosong/DHT11.pdf
    // notify DHT11 to start:
    //    1. PULL LOW 20ms.
    //    2. PULL HIGH 20-40us.
    //    3. SET TO INPUT.
    // Changes in timing done according to:
    //  [2] https://www.mouser.com/ds/2/758/DHT11-Technical-Data-Sheet-Translated-Version-1143054.pdf
    // - original values specified in code
    // - since they were not working (MCU-dependent timing?), replace in code with
    //   _working_ values based on measurements done with levelTimePrecise()
    pinMode(pin, OUTPUT);
    digitalWrite(pin, LOW);            // 1.
    delay(20);                         // specs [2]: 18us

    // Pull high and set to input, before wait 40us.
    // @see https://github.com/winlinvip/SimpleDHT/issues/4
    // @see https://github.com/winlinvip/SimpleDHT/pull/5
    digitalWrite(pin, HIGH);           // 2.
    pinMode(pin, INPUT);
    delayMicroseconds(25);             // specs [2]: 20-40us

    // DHT11 starting:
    //    1. PULL LOW 80us
    //    2. PULL HIGH 80us
    long t = levelTime(LOW);          // 1.
    if (t < 30) {                    // specs [2]: 80us
        return simpleDHTCombileError(t, SimpleDHTErrStartLow);
    }

    t = levelTime(HIGH);             // 2.
    if (t < 50) {                    // specs [2]: 80us
        return simpleDHTCombileError(t, SimpleDHTErrStartHigh);
    }

    // DHT11 data transmite:
    //    1. 1bit start, PULL LOW 50us
    //    2. PULL HIGH:
    //         - 26-28us, bit(0)
    //         - 70us, bit(1)
    for (int j = 0; j < 40; j++) {
          t = levelTime(LOW);          // 1.
          if (t < 24) {                    // specs says: 50us
              return simpleDHTCombileError(t, SimpleDHTErrDataLow);
          }

          // read a bit
          t = levelTime(HIGH);              // 2.
          if (t < 11) {                     // specs say: 20us
              return simpleDHTCombileError(t, SimpleDHTErrDataRead);
          }
          data[ j ] = (t > 40 ? 1 : 0);     // specs: 26-28us -> 0, 70us -> 1
    }

    // DHT11 EOF:
    //    1. PULL LOW 50us.
    t = levelTime(LOW);                     // 1.
    if (t < 24) {                           // specs say: 50us
        return simpleDHTCombileError(t, SimpleDHTErrDataEOF);
    }

    return SimpleDHTErrSuccess;
}

SimpleDHT22::SimpleDHT22() {
}

SimpleDHT22::SimpleDHT22(int pin) : SimpleDHT (pin) {
}

int SimpleDHT22::read2(float* ptemperature, float* phumidity, byte pdata[40]) {
    int ret = SimpleDHTErrSuccess;

    if (pin == -1) {
        return SimpleDHTErrNoPin;
    }

    byte data[40] = {0};
    if ((ret = sample(data)) != SimpleDHTErrSuccess) {
        return ret;
    }

    short temperature = 0;
    short humidity = 0;
    if ((ret = parse(data, &temperature, &humidity)) != SimpleDHTErrSuccess) {
        return ret;
    }

    if (pdata) {
        memcpy(pdata, data, 40);
    }
    if (ptemperature) {
        *ptemperature = (float)((temperature & 0x8000 ? -1 : 1) * (temperature & 0x7FFF)) / 10.0;
    }
    if (phumidity) {
        *phumidity = (float)humidity / 10.0;
    }

    return ret;
}

int SimpleDHT22::read2(int pin, float* ptemperature, float* phumidity, byte pdata[40]) {
    setPin(pin);
    return read2(ptemperature, phumidity, pdata);
}

int SimpleDHT22::sample(byte data[40]) {
    // empty output data.
    memset(data, 0, 40);

    // According to protocol: http://akizukidenshi.com/download/ds/aosong/AM2302.pdf
    // notify DHT11 to start:
    //    1. T(be), PULL LOW 1ms(0.8-20ms).
    //    2. T(go), PULL HIGH 30us(20-200us), use 40us.
    //    3. SET TO INPUT.
    pinMode(pin, OUTPUT);
    digitalWrite(pin, LOW);
    delayMicroseconds(1000);
    // Pull high and set to input, before wait 40us.
    // @see https://github.com/winlinvip/SimpleDHT/issues/4
    // @see https://github.com/winlinvip/SimpleDHT/pull/5
    digitalWrite(pin, HIGH);
    pinMode(pin, INPUT);
    delayMicroseconds(40);

    // DHT11 starting:
    //    1. T(rel), PULL LOW 80us(75-85us).
    //    2. T(reh), PULL HIGH 80us(75-85us).
    long t = 0;
    if ((t = levelTime(LOW)) < 30) {
        return simpleDHTCombileError(t, SimpleDHTErrStartLow);
    }
    if ((t = levelTime(HIGH)) < 50) {
        return simpleDHTCombileError(t, SimpleDHTErrStartHigh);
    }

    // DHT11 data transmite:
    //    1. T(LOW), 1bit start, PULL LOW 50us(48-55us).
    //    2. T(H0), PULL HIGH 26us(22-30us), bit(0)
    //    3. T(H1), PULL HIGH 70us(68-75us), bit(1)
    for (int j = 0; j < 40; j++) {
          t = levelTime(LOW);          // 1.
          if (t < 24) {                    // specs says: 50us
              return simpleDHTCombileError(t, SimpleDHTErrDataLow);
          }

          // read a bit
          t = levelTime(HIGH);              // 2.
          if (t < 11) {                     // specs say: 26us
              return simpleDHTCombileError(t, SimpleDHTErrDataRead);
          }
          data[ j ] = (t > 40 ? 1 : 0);     // specs: 22-30us -> 0, 70us -> 1
    }

    // DHT11 EOF:
    //    1. T(en), PULL LOW 50us(45-55us).
    t = levelTime(LOW);
    if (t < 24) {
        return simpleDHTCombileError(t, SimpleDHTErrDataEOF);
    }

    return SimpleDHTErrSuccess;
}
