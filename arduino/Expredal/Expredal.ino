#include <EEPROM.h>
#include "MIDIUSB.h"

#define CONTROL_CHANGE 0x0B
#define CONTINUOUS_CONTROLLER 0xB0
#define EPROM_ADDRESS 0
#define ENABLE_NOTE 24
#define DISABLE_NOTE 26
#define MINIMUM_NOTE 28
#define MAXIMUM_NOTE 29
#define GET_CONFIG_NOTE 31
#define SAVE_CONFIG_NOTE 33

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
#define CHANGE_SENSITIVITY 7
//
// END OF CODE CONFIGURATION
//

//
// RAM MEMORY STATE
//
int lastValue = -1;
int lastRawValue = -1;
boolean on = true;
ExpredalConfig expredalConfig = {
  {1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127}
};
//
// END RAM MEMORY STATE
//

void readCommands() {
  midiEventPacket_t command = MidiUSB.read();
    if (command.header == 0x09) {
      byte expredalCommand = command.byte1>>4<<4;
      if (expredalCommand == 0x90) {
        byte channel = command.byte1 & 0b1111;
        byte note = command.byte2;
        byte velocity = command.byte3;
        if (note == ENABLE_NOTE) {
          expredalConfig.enabled[channel] = 1;
        } else if (note == DISABLE_NOTE) {
          expredalConfig.enabled[channel] = 0;
        } else if (note == MINIMUM_NOTE) {
          expredalConfig.minimumValues[channel] = velocity;
        } else if (note == MAXIMUM_NOTE) {
          expredalConfig.maximumValues[channel] = velocity;
        } else if (note == GET_CONFIG_NOTE) {
          getConfiguration();
        } else if (note == SAVE_CONFIG_NOTE) {
          writeConfiguration();
          printConfig();
        }
      }
    }
}

void controlChange(byte control, int rawValue) {
  if (on) {
    for (int channel = 0; channel < 16; channel++) {
      if (expredalConfig.enabled[channel]) {
        int value = map(rawValue, 0, 1023, expredalConfig.minimumValues[channel], expredalConfig.maximumValues[channel]);
        value = constrain(value, expredalConfig.minimumValues[channel], expredalConfig.maximumValues[channel]);
        midiEventPacket_t event = {CONTROL_CHANGE, CONTINUOUS_CONTROLLER | channel, control, value};
        MidiUSB.sendMIDI(event);
        MidiUSB.flush();
    
        Serial.print("Channel: ");
        Serial.print(channel);
        Serial.print(" Sensor: ");
        Serial.print(rawValue);
        Serial.print(" Valuel: ");
        Serial.println(value);
      }
    }
//    MidiUSB.flush();
  }
}

void setup() {
  if (!isEpromSigned()) {
    initEprom();
  }
  readConfiguration();
}

void loop() {
  readCommands();

  int sensorValue = analogRead(PIN_EXPRESSION);
  int value = map(sensorValue, 0, 1023, 0, 127);
  value = constrain(value, 0, 127);

  if (abs(sensorValue-lastRawValue) > CHANGE_SENSITIVITY && (value != lastValue)) {
    controlChange(CC_EXPRESSION, sensorValue);
    lastValue = value;
    lastRawValue = sensorValue;
  }
  delay(10); // Frequency = 1 Khz
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

void printConfig() {
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

void noteOn(byte channel, byte pitch, byte velocity) {
  midiEventPacket_t noteOn = {0x09, 0x90 | channel, pitch, velocity};
  MidiUSB.sendMIDI(noteOn);
}


void getConfiguration() {
  for (int channel=0; channel < 16; channel++) {
    if (expredalConfig.enabled[channel]) {
      noteOn(channel, ENABLE_NOTE, 1);
    } else {
      noteOn(channel, DISABLE_NOTE, 1);
    }
  }
  for (int channel=0; channel < 16; channel++) {
    noteOn(channel, MINIMUM_NOTE, expredalConfig.minimumValues[channel]);
  }
  for (int channel=0; channel < 16; channel++) {
    noteOn(channel, MAXIMUM_NOTE, expredalConfig.maximumValues[channel]);
  }
  MidiUSB.flush();
}
