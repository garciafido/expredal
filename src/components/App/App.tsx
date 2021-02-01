import React from 'react';
import './App.css';
import { observer } from "mobx-react";
import { Grid } from '@material-ui/core';
import { store } from '../../store';
import { MidiSelector } from '../MidiSelector';


const App = observer((props: any) => {
  if (store.state === 'pending') {
    store.initData();
    return <div>Loading...</div>;
  } else if (store.state === 'done') {
  }

  const handleInput = (event: any) => {
    store.setMidiInput(event.target.value);
  };

  const handleOutput = (event: any) => {
    store.setMidiOutput(event.target.value);
  };

  return (
    <Grid container alignItems="flex-start" direction="row">
      <Grid item xs={12}>
          {store.errorMessage}
      </Grid>
      <Grid item xs={12}>
        <h1>Expredal</h1>
      </Grid>
      <Grid item xs={2}>
        <MidiSelector devices={store.midiInputs} handle={handleInput} selected={store.midiInput} label={'Input device'}/>
      </Grid>
      <Grid item xs={2}>
        <MidiSelector devices={store.midiOutputs} handle={handleOutput} selected={store.midiOutput} label={'Output device'}/>
      </Grid>
    </Grid>
  );
});

export default App;
