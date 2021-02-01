import WebMidi, {Input, Output} from "webmidi";

import {action, observable, configure, makeAutoObservable} from "mobx";
// import {flowed} from "./storeUtils";

configure({ enforceActions: "observed" });

WebMidi.enable(function (err) {
    if(err) {
            console.log("WebMidi cannot be enabled!");
        } else {
            console.log("WebMidi enabled!");
        }
    },
    true);

class ExpredalStore {
    @observable state: string = 'pending';
    @observable errorMessage: string = '';
    @observable midiInput: string = '';
    @observable midiOutput: string = '';
    @observable midiInputs: Input[] = [];
    @observable midiOutputs: Output[] = [];
    @observable enabledChannels: boolean[] = [];

    constructor() {
        makeAutoObservable(this)
    }

    @action.bound
    setMidiInput(input: string) {
        this.midiInput = input;
    }

    @action.bound
    readConfig() {
        const output: any = WebMidi.getOutputByName(this.midiOutput);
        if (output) {
            output.playNote("C1");
        } else {
            this.errorMessage = `Cannot connect to ${this.midiOutput}`;
        }
    }

    @action.bound
    setMidiOutput(output: string) {
        this.midiOutput = output;
        this.readConfig();
    }

    @action.bound
    initData() {
        this.state = "loading";
        try {
            this.midiInputs = WebMidi.inputs;
            this.midiOutputs = WebMidi.outputs;
            this.state = "done";
        } catch(error) {
            this.state = "error";
            this.errorMessage = error;
        }
    }
}

export { ExpredalStore };