import WebMidi, { InputEventNoteon, InputEventControlchange } from "webmidi";

import {action, observable, configure, makeAutoObservable} from "mobx";
import _ from "lodash";
// import {flowed} from "./storeUtils";

configure({ enforceActions: "observed" });
const EXPREDAL_ENABLED = 'C1';
const EXPREDAL_DISABLED = 'D1';
const EXPREDAL_MINIMUM = 'E1';
const EXPREDAL_MAXIMUM = 'F1';
const EXPREDAL_READ_CONFIG = 'G1';
const EXPREDAL_SAVE_CONFIG = 'A1';


const initData = [
        {enabled: false, minimum: 0, maximum: 127, value: 0},
        {enabled: false, minimum: 0, maximum: 127, value: 0},
        {enabled: false, minimum: 0, maximum: 127, value: 0},
        {enabled: false, minimum: 0, maximum: 127, value: 0},
        {enabled: false, minimum: 0, maximum: 127, value: 0},
        {enabled: false, minimum: 0, maximum: 127, value: 0},
        {enabled: false, minimum: 0, maximum: 127, value: 0},
        {enabled: false, minimum: 0, maximum: 127, value: 0},
        {enabled: false, minimum: 0, maximum: 127, value: 0},
        {enabled: false, minimum: 0, maximum: 127, value: 0},
        {enabled: false, minimum: 0, maximum: 127, value: 0},
        {enabled: false, minimum: 0, maximum: 127, value: 0},
        {enabled: false, minimum: 0, maximum: 127, value: 0},
        {enabled: false, minimum: 0, maximum: 127, value: 0},
        {enabled: false, minimum: 0, maximum: 127, value: 0},
        {enabled: false, minimum: 0, maximum: 127, value: 0},
        ];

function controlChange(store: ExpredalStore, event: InputEventControlchange) {
    store.receiveControlChange(event);
}


class ExpredalStore {
    @observable state: string = 'pending';
    @observable errorMessage: string = '';
    @observable midiDriver: string = '';
    @observable midiDrivers: string[] = [];
    @observable data: {enabled: boolean, minimum: number, maximum: number, value: any}[] = initData;

    constructor() {
        makeAutoObservable(this);
        const self: ExpredalStore = this;
        WebMidi.enable(function (err) {
            if(err) {
                console.log("WebMidi cannot be enabled!");
            } else {
                console.log("WebMidi enabled!");
                const inputs = _.map(WebMidi.inputs, x => x.name);
                const outputs = _.map(WebMidi.outputs, x => x.name);
                self.setMidiDrivers(_.intersection(outputs, inputs));
            }
        },
            true);
    }

    @action.bound
    setMidiDrivers(drivers: string[]) {
        this.midiDrivers = drivers;
    }

    @action.bound
    setEnabled(channel: number, value: boolean) {
        if (this.data[channel].enabled !== value) {
            this.data[channel].enabled = value;
            this.setConfig(channel)
        }
    }

    @action.bound
    setMinimum(channel: number, value: string) {
        if (this.data[channel].minimum !== +value) {
            this.data[channel].minimum = +value;
            console.log(channel);
            this.setConfig(channel)
        }
    }

    @action.bound
    setMaximum(channel: number, value: string) {
        if (this.data[channel].maximum !== +value) {
            this.data[channel].maximum = +value;
            this.setConfig(channel)
        }
    }

    @action.bound
    async receiveNoteOn(event: InputEventNoteon) {
        const note = `${event.note.name}${event.note.octave}`;
        if (note === EXPREDAL_MINIMUM) {
            this.data[event.channel - 1].minimum = event.rawVelocity;
        } else if (note === EXPREDAL_MAXIMUM) {
            this.data[event.channel-1].maximum = event.rawVelocity;
        } else if (note === EXPREDAL_ENABLED) {
            this.data[event.channel-1].enabled = true;
        } else if (note === EXPREDAL_DISABLED) {
            this.data[event.channel-1].enabled = false;
        }
    }

    @action.bound
    receiveControlChange(event: InputEventControlchange) {
        if (event.controller.number === 11 && this.data[event.channel-1].value !== event.value) {
            this.data[event.channel-1].value = event.value;
            console.log(event.value);
        }
    }

    @action.bound
    setMidiDriver(driver: string) {
        if (this.midiDriver !== driver) {
            this.data = initData;
            if (this.midiDriver !== '') {
                const oldInput: any = WebMidi.getInputByName(this.midiDriver);
                if (oldInput) {
                    oldInput.removeListener();
                }
            }
            this.midiDriver = driver;
            const input: any = WebMidi.getInputByName(this.midiDriver);
            if (input) {
                const self = this;
                input.addListener("noteon", "all", async (e: InputEventNoteon) => {
                    await self.receiveNoteOn(e);
                });
                input.addListener("controlchange", "all", async (e: InputEventControlchange) => {
                        _.debounce(controlChange, 100, {
                            'leading': false,
                            'trailing': true
                        })(self, e);
                    }
                );
            } else {
                this.errorMessage = `Cannot connect to input driver "${this.midiDriver}"`;
            }
            this.readConfig();
        }
    }

    @action.bound
    readConfig() {
        const output: any = WebMidi.getOutputByName(this.midiDriver);
        if (output) {
            output.playNote(EXPREDAL_READ_CONFIG, 1);
        } else {
            this.errorMessage = `Cannot connect to ${this.midiDriver}`;
        }
    }

    @action.bound
    getOutput(): any {
        const output: any = WebMidi.getOutputByName(this.midiDriver);
        if (output) {
            return output;
        } else {
            this.errorMessage = `Cannot connect to ${this.midiDriver}`;
        }
    }

    @action.bound
    saveConfig() {
        const output = this.getOutput();
        output.playNote(EXPREDAL_SAVE_CONFIG, 1);
    }

    setChannelData(channel: number, output: any) {
        if (this.data[channel].enabled) {
            output.playNote(EXPREDAL_ENABLED, channel+1);
        } else {
            output.playNote(EXPREDAL_DISABLED, channel+1);
        }
        output.playNote(EXPREDAL_MINIMUM, channel+1, {rawVelocity: true, velocity: this.data[channel].minimum});
        output.playNote(EXPREDAL_MAXIMUM, channel+1, {rawVelocity: true, velocity: this.data[channel].maximum});
    }

    @action.bound
    setConfig(channel: number = -1) {
        const output = this.getOutput();
        if (channel === -1) {
            for (let c=0; c < 16; c++) {
                this.setChannelData(c, output);
            }
        } else {
            this.setChannelData(channel, output);
        }
    }

    @action.bound
    initData() {
        this.state = "loading";
        try {
            this.state = "done";
        } catch(error) {
            this.state = "error";
            this.errorMessage = error;
        }
    }
}

export { ExpredalStore };