import React from 'react';
import './App.css';
import { observer } from "mobx-react";
import {Button, Checkbox, Grid, TextField, Typography, LinearProgress} from '@material-ui/core';
import { store } from '../../store';
import { MidiSelector } from '../MidiSelector';
import _ from 'lodash';


const App = observer((props: any) => {
  if (store.state === 'pending') {
    store.initData();
    return <div>Loading...</div>;
  } else if (store.state === 'done') {
  }

  const handleDriver = (event: any) => {
    store.setMidiDriver(event.target.value);
  };


  const channelsData = _.map([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], x => {
      const MIN = store.data[x].minimum;
      const MAX = store.data[x].maximum;
      const normalize = (value: number) => ((value - MIN) * 100) / (MAX - MIN);

      return (<Grid container xs={12}>
          <Grid item xs={1} />
          <Grid item xs={2}>{x+1}</Grid>
          <Grid item xs={1}>
            <Checkbox
              color="primary"
              checked={store.data[x].enabled}
              onChange={event => store.setEnabled(x, event.target.checked)}
              inputProps={{ 'aria-label': 'primary checkbox' }}
            />
          </Grid>
          <Grid item xs={2}>
            <TextField
              type="number"
              value={store.data[x].minimum}
              onChange={event => store.setMinimum(x, event.target.value)}
              InputProps={{ inputProps: { min: "0", max: "127", step: "1" } }}
            />
          </Grid>
          <Grid item xs={2}>
            <TextField
              type="number"
              value={store.data[x].maximum}
              onChange={event => store.setMaximum(x, event.target.value)}
              InputProps={{ inputProps: { min: "0", max: "127", step: "1" } }}
            />

          </Grid>
          <Grid item xs={3}>
            <LinearProgress variant="determinate" value={normalize(store.data[x].value)} />
            <Typography variant="caption" component="div" color="textSecondary">{`${store.data[x].value}`}</Typography>
          </Grid>
          <Grid item xs={1} />
      </Grid>);
  }
);

  return (
    <Grid container alignItems="flex-start" direction="row">
      <Grid item xs={12}>
          {store.errorMessage}
      </Grid>
      <Grid item xs={1} />
      <Grid item xs={2}>
        <h1  style={{paddingTop: 0, paddingBottom: 0}}>Expredal</h1>
      </Grid>
      <Grid item xs={3} alignItems={"center"} justify={"center"}>
        <MidiSelector style={{paddingTop: 10, marginBottom: 10}} devices={store.midiDrivers} handle={handleDriver} selected={store.midiDriver} label={'MIDI driver'}/>
      </Grid>
      <Grid item xs={2} />
      <Grid item xs={3} alignItems={"flex-start"} justify={"flex-start"} alignContent={'flex-start'}>
          <Button style={{paddingTop: 10, paddingBottom: 10}} onClick={() => store.saveConfig()}>Save to EPROM</Button>
      </Grid>
      <Grid item xs={1} />
                <Grid item xs={6}>
      </Grid>
        <Grid container xs={12}>
          <Grid item xs={1} />
          <Grid  item xs={2}>
              <Typography style={{paddingTop: 0, paddingBottom: 30}}>MIDI Channel</Typography>
          </Grid>
          <Grid  item xs={1}>
                Enabled
          </Grid>
          <Grid  item xs={2}>
                Minimum
          </Grid>
          <Grid  item xs={2}>
                Maximum
          </Grid>
          <Grid  item xs={3}>
                Current position
          </Grid>
          <Grid item xs={1} />
          {channelsData}
      </Grid>
    </Grid>
  );
});

export default App;
