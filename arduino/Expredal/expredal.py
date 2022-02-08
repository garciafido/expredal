"""
    Python expredal library
    Expredal is an arduino midi interface for an expression pedal
"""
import time

from pygame import midi


DEFAULT_DRIVER_NAME = "Arduino Leonardo"
EXPREDAL_ENABLED = "C1"
EXPREDAL_DISABLED = "D1"
EXPREDAL_MINIMUM = "E1"
EXPREDAL_MAXIMUM = "F1"
EXPREDAL_READ_CONFIG = "G1"
EXPREDAL_SAVE_CONFIG = "A1"

CONFIG_ENABLE_NOTE = 24
CONFIG_DISABLE_NOTE = 26
CONFIG_MINIMUM_NOTE = 28
CONFIG_MAXIMUM_NOTE = 29

note_number = {
    f'{label}{octave-1}': note + (12*octave)
    for octave in range(9)
    for note, label in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])
}

class Expredal(object):
    def __init__(self):
        self.input = None
        self.output = None
        self.config = None
        self.devices = []
        midi.init()

        for i in range(midi.get_count()):
            info = midi.get_device_info(i)
            self.devices.append(info)

    def open(self, device_name=DEFAULT_DRIVER_NAME):
        for index, device in enumerate(self.devices):
            (interface, name, is_input, is_output, is_opened) = device
            if name.decode("utf-8") == device_name:
                if is_input:
                    self.input = midi.Input(index)
                if is_output:
                    self.output = midi.Output(index)
                if self.input and self.output:
                    break
        if self.input is None or self.output is None:
            raise Exception(f'{device_name} does not exist.\nAvailable devices: {[x[1] for x in self.devices]}')
        self.get_config()

    def get_config(self):
        self.play_note(EXPREDAL_READ_CONFIG)
        time.sleep(0.3)
        if self.input.poll():
            data = self.input.read(16*4)
            config_data = [x[0] for x in data]
            self.config = {number: {} for number in range(16)}
            for event in config_data:
                number = event[0] ^ 0x90
                if event[1] == CONFIG_ENABLE_NOTE:
                    self.config[number]['enabled'] = True
                elif event[1] == CONFIG_DISABLE_NOTE:
                    self.config[number]['enabled'] = False
                elif event[1] == CONFIG_MINIMUM_NOTE:
                    self.config[number]['minimum'] = event[2]
                elif event[1] == CONFIG_MAXIMUM_NOTE:
                    self.config[number]['maximum'] = event[2]
                else:
                    raise Exception(f'Unexpecte config parameter {event[1]}')
            for channel in range(16):
                print(channel, self.config[channel])
        else:
            raise Exception(f'Cannot get driver config')

    def play_note(self, note):
        self.output.note_on(note=note_number[note], velocity=127)
        self.output.note_off(note=note_number[note], velocity=0)

    def close(self):
        self.input.close()
        self.output.close()

    def quit(self):
        midi.quit()

    # def read_config(self):
    #     output = WebMidi.getOutputByName(this.midiDriver)
    #     if output:
    #         output.playNote(EXPREDAL_READ_CONFIG, 1)
    #     else:
    #         raise Exception(f'Cannot connect to {this.midiDriver}'


pedal = Expredal()
pedal.open()
pedal.close()
pedal.quit()