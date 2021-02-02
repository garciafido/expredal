#include <EEPROM.h>
#include "MIDIUSB.h"

#define CONTROL_CHANGE 0x0B
#define CONTINUOUS_CONTROLLER 0xB0
#define EPROM_ADDRESS 0

const byte EPROM_SIGNATURE[] = {0x3F, 0x55, 0x68, 0x60, 0x62, 0x55, 0x54, 0x51, 0x5C, 0x3F};
const int CONFIG_ADDRESS = sizeof(EPROM_SIGNATURE) + 1;

struct ExpredalConfig {
  byte enabled[16];
  byte minimumValues[16];
  byte maximumValues[16];
};

//
// CODE CONFIGURATION
//
#define PIN_EXPRESSION A0  // Analog input pin
#define CC_EXPRESSION 11   // CC midi message for expression pedal value change
//
// END OF CODE CONFIGURATION
//

//
// RAM MEMORY STATE
//
int lastValue = -1;
boolean on = true;
ExpredalConfig expredalConfig = {
  {1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127}
};
//
// END RAM MEMORY STATE
//

void readCommands() {
  midiEventPacket_t command = MidiUSB.read();
    if (command.header != 0) {
      byte expredalCommand = command.byte1>>4<<4;
      if (expredalCommand == 0x90) {
        byte channel = command.byte1 & 0b1111;
        byte note = command.byte2;
        byte velocity = command.byte3;
        if (note == 24) {
          expredalConfig.enabled[channel] = 1;
        } else if (note == 26) {
          expredalConfig.enabled[channel] = 0;
        } else if (note == 28) {
          expredalConfig.minimumValues[channel] = velocity;
        } else if (note == 29) {
          expredalConfig.maximumValues[channel] = velocity;
        } else if (note == 31) {
          printEprom();
        }
      }
    }
}

void controlChange(byte control, byte rawValue) {
  if (on) {
    for (int channel = 0; channel < 16; channel++) {
      if (expredalConfig.enabled[channel]) {
        int value = map(rawValue, 0, 1023, expredalConfig.minimumValues[channel], expredalConfig.maximumValues[channel]);
        value = constrain(value, expredalConfig.minimumValues[channel], expredalConfig.maximumValues[channel]);
        midiEventPacket_t event = {CONTROL_CHANGE, CONTINUOUS_CONTROLLER | channel, control, value};
        MidiUSB.sendMIDI(event);
      }
    }
    MidiUSB.flush();
  }
}

void setup() {
  if (!isEpromSigned()) {
    initEprom();
  }
  readConfiguration();
}

void loop() {
  int sensorValue = analogRead(PIN_EXPRESSION);

  readCommands();

  if (sensorValue != lastValue) {
    controlChange(CC_EXPRESSION, sensorValue);
    lastValue = sensorValue;
  }
  delay(1); // Frequency = 1 Khz
}

boolean isEpromSigned() {
  byte tmp[sizeof(EPROM_SIGNATURE)];
  EEPROM.get(EPROM_ADDRESS, tmp);
  for (int pos=0; pos < sizeof(EPROM_SIGNATURE); pos++) {
    if (tmp[pos] != EPROM_SIGNATURE[pos]) {
      return false;
    }
  }
  return true;
}

void initEprom() {
  EEPROM.put(EPROM_ADDRESS, EPROM_SIGNATURE);
  EEPROM.put(CONFIG_ADDRESS, expredalConfig);
}

void readConfiguration() {
  EEPROM.get(CONFIG_ADDRESS, expredalConfig);
}

void writeConfiguration() {
  EEPROM.put(CONFIG_ADDRESS, expredalConfig);
}

void printEprom() {
  for (int channel=0; channel < 16; channel++) {
    Serial.print("Channel: ");
    Serial.print(channel);
    Serial.print(" Enabled: ");
    Serial.print(expredalConfig.enabled[channel]);
    Serial.print(" Minimum: ");
    Serial.print(expredalConfig.minimumValues[channel]);
    Serial.print(" Maximum: ");
    Serial.print(expredalConfig.maximumValues[channel]);
    Serial.println("");
  }
}
