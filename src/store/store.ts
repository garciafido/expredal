import WebMidi, {Input, Output} from "webmidi";

import {action, observable, configure, makeAutoObservable} from "mobx";
// import {flowed} from "./storeUtils";

configure({ enforceActions: "observed" });

WebMidi.enable(function (err) {
  console.log(WebMidi.inputs);
  console.log(WebMidi.outputs);
});

class ExpredalStore {
    @observable state: string = 'pending';
    @observable errorMessage: string = '';
    @observable midiInput: string = '';
    @observable midiOutput: string = '';
    @observable midiInputs: Input[] = [];
    @observable midiOutputs: Output[] = [];

    constructor() {
        makeAutoObservable(this)
    }

    @action.bound
    setMidiInput(input: string) {
        this.midiInput = input;
    }

    @action.bound
    setMidiOutput(output: string) {
        this.midiOutput = output;
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