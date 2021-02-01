import WebMidi from "webmidi";

import {action, observable, configure, makeAutoObservable} from "mobx";
import _ from "lodash";
// import {flowed} from "./storeUtils";

configure({ enforceActions: "observed" });


class ExpredalStore {
    @observable state: string = 'pending';
    @observable errorMessage: string = '';
    @observable midiInput: string = '';
    @observable midiOutput: string = '';
    @observable midiInputs: string[] = [];
    @observable midiOutputs: string[] = [];
    @observable enabledChannels: boolean[] = [];

    constructor() {
        makeAutoObservable(this);
        const self = this;
        WebMidi.enable(function (err) {
            if(err) {
                    console.log("WebMidi cannot be enabled!");
                } else {
                    console.log("WebMidi enabled!");
                    const inputs = _.map(WebMidi.inputs, x => x.name);
                    const outputs = _.map(WebMidi.outputs, x => x.name);
                    self.setMidiInputs(inputs);
                    self.setMidiOutputs(outputs);
                }
            },
            true);
    }

    @action.bound
    setMidiInputs(inputs: string[]) {
        this.midiInputs = inputs;
    }

    @action.bound
    setMidiOutputs(outputs: string[]) {
        this.midiOutputs = outputs;
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
            this.state = "done";
        } catch(error) {
            this.state = "error";
            this.errorMessage = error;
        }
    }
}

export { ExpredalStore };