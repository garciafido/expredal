"""
    Python expredal library
    Expredal is an arduino midi interface for an expression pedal
"""
import time
from dataclasses import asdict, dataclass

from pygame import midi


DEFAULT_DRIVER_NAME = "Arduino Leonardo"
EXPREDAL_ENABLED = "C1"
EXPREDAL_DISABLED = "D1"
EXPREDAL_MINIMUM = "E1"
EXPREDAL_MAXIMUM = "F1"
EXPREDAL_READ_CONFIG = "G1"  # 31
EXPREDAL_SAVE_CONFIG = "A1"  # 33

CONFIG_ENABLE_NOTE = 24
CONFIG_DISABLE_NOTE = 26
CONFIG_MINIMUM_NOTE = 28
CONFIG_MAXIMUM_NOTE = 29

note_number = {
    f'{label}{octave-1}': note + (12*octave)
    for octave in range(9)
    for note, label in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])
}


@dataclass
class ChannelConfig:
    """
    Expredal Channel Config
    """
    channel: int = 11
    enabled: bool = True
    minimum: int = 0
    maximum: int = 127


class Expredal(object):
    def __init__(self):
        self.input = None
        self.output = None
        self.config: ChannelConfig = ChannelConfig()
        self.devices = []
        midi.init()
        try:
            for i in range(midi.get_count()):
                info = midi.get_device_info(i)
                self.devices.append(info)
        except Exception as e:
            self._end()
            raise e

    def open(self, device_name=DEFAULT_DRIVER_NAME):
        try:
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
        except Exception as e:
            self._end()
            raise e

    def set_config(self):
        try:
            self._play_note(EXPREDAL_MINIMUM, channel=self.config.channel, velocity=self.config.minimum)
            self._play_note(EXPREDAL_MAXIMUM, channel=self.config.channel, velocity=self.config.maximum)
            if self.config.enabled:
                self._play_note(EXPREDAL_ENABLED, channel=self.config.channel)
            else:
                self._play_note(EXPREDAL_DISABLED, channel=self.config.channel)
            self._play_note(EXPREDAL_SAVE_CONFIG)
        except Exception as e:
            self._end()
            raise e

    def get_config(self):
        try:
            self._play_note(EXPREDAL_READ_CONFIG)
            time.sleep(1)
            if self.input.poll():
                data = self.input.read(5)
                config_data = [x[0] for x in data]
                for event in config_data:
                    self.config.channel = event[0] ^ 0x90
                    if event[1] == CONFIG_ENABLE_NOTE:
                        self.config.enabled = True
                    elif event[1] == CONFIG_DISABLE_NOTE:
                        self.config.enabled = False
                    elif event[1] == CONFIG_MINIMUM_NOTE:
                        self.config.minimum = event[2]
                    elif event[1] == CONFIG_MAXIMUM_NOTE:
                        self.config.maximum = event[2]
                    else:
                        raise Exception(f'Unexpected config parameter {event[1]}')
                print(asdict(self.config))
            else:
                raise Exception(f'Cannot get driver config')
        except Exception as e:
            self._end()
            raise e

    def close(self):
        self._end()

    def _play_note(self, note, velocity=127, channel=0):
        self.output.note_on(note=note_number[note], velocity=velocity, channel=channel)
        self.output.note_off(note=note_number[note], velocity=0, channel=channel)

    def _end(self):
        if self.input is not None:
            self.input.close()
            self.input = None
        if self.output is not None:
            self.output.close()
            self.output = None
        midi.quit()


pedal = Expredal()
pedal.open()
# pedal.config.minimum = 0
# pedal.set_config()
# pedal.get_config()
pedal.close()
