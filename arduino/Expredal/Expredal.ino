#include <EEPROM.h>
#include "MIDIUSB.h"

#define CONTROL_CHANGE 0x0B
#define CONTINUOUS_CONTROLLER 0xB0
#define EPROM_ADDRESS 0

const byte EPROM_SIGNATURE[] = {0x3F, 0x55, 0x68, 0x60, 0x62, 0x55, 0x54, 0x51, 0x5C, 0x3F};
const int CONFIG_ADDRESS = sizeof(EPROM_SIGNATURE) + 1;

struct ExpredalConfig {
  byte activeMidiChannels[16];
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
  {
      true, true, true, true, true,
      true, true, true, true, true,
      true,
      true, true, true, true, true
  }
};
//
// END RAM MEMORY STATE
//

void readCommands() {
  midiEventPacket_t command = MidiUSB.read();
    if (command.header != 0) {
      Serial.print("Received: ");
      Serial.print(command.header, HEX);
      Serial.print("-");
      Serial.print(command.byte1, HEX);
      Serial.print("-");
      Serial.print(command.byte2, HEX);
      Serial.print("-");
      Serial.println(command.byte3, HEX);
    }
}

void controlChange(byte control, byte value) {
  if (on) {
    for (int channel = 0; channel < sizeof(expredalConfig.activeMidiChannels); channel++) {
      if (expredalConfig.activeMidiChannels[channel]) {
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
  sensorValue = map(sensorValue, 0, 1023, 0, 127);
  sensorValue = constrain(sensorValue, 0, 127);

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
  for (int channel=0; channel < sizeof(expredalConfig.activeMidiChannels); channel++) {
    Serial.print(expredalConfig.activeMidiChannels[channel], HEX);
  }
  Serial.println("");
}
