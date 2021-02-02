import WebMidi from "webmidi";

import {action, observable, configure, makeAutoObservable} from "mobx";
import _ from "lodash";
// import {flowed} from "./storeUtils";

configure({ enforceActions: "observed" });
const COMMAND_CHANNEL = 1;


class ExpredalStore {
    @observable state: string = 'pending';
    @observable errorMessage: string = '';
    @observable midiDriver: string = '';
    @observable midiDrivers: string[] = [];
    @observable data: {enabled: boolean, minimum: number, maximum: number, value: any}[] = [
        {enabled: false, minimum: 0, maximum: 127, value: undefined},
        {enabled: false, minimum: 0, maximum: 127, value: undefined},
        {enabled: false, minimum: 0, maximum: 127, value: undefined},
        {enabled: false, minimum: 0, maximum: 127, value: undefined},
        {enabled: false, minimum: 0, maximum: 127, value: undefined},
        {enabled: false, minimum: 0, maximum: 127, value: undefined},
        {enabled: false, minimum: 0, maximum: 127, value: undefined},
        {enabled: false, minimum: 0, maximum: 127, value: undefined},
        {enabled: false, minimum: 0, maximum: 127, value: undefined},
        {enabled: false, minimum: 0, maximum: 127, value: undefined},
        {enabled: false, minimum: 0, maximum: 127, value: undefined},
        {enabled: false, minimum: 0, maximum: 127, value: undefined},
        {enabled: false, minimum: 0, maximum: 127, value: undefined},
        {enabled: false, minimum: 0, maximum: 127, value: undefined},
        {enabled: false, minimum: 0, maximum: 127, value: undefined},
        {enabled: false, minimum: 0, maximum: 127, value: undefined},
        ];

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
        // console.log(drivers);
    }

    @action.bound
    setEnabled(channel: number, value: boolean) {
        this.data[channel-1].enabled = value;
    }

    @action.bound
    setMinimum(channel: number, value: string) {
        this.data[channel-1].minimum = +value;
    }

    @action.bound
    setMaximum(channel: number, value: string) {
        this.data[channel-1].maximum = +value;
    }

    @action.bound
    setMidiDriver(output: string) {
        if (this.midiDriver !== output) {
            this.midiDriver = output;
            this.readConfig();
        }
    }

    @action.bound
    readConfig() {
        const output: any = WebMidi.getOutputByName(this.midiDriver);
        if (output) {
            output.playNote("C1", COMMAND_CHANNEL);
        } else {
            this.errorMessage = `Cannot connect to ${this.midiDriver}`;
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