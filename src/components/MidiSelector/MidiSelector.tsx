import React from 'react';
import _ from 'lodash';
import { observer } from "mobx-react";
import {FormControl, InputLabel, MenuItem, Select} from '@material-ui/core';

const MidiSelector = observer((props: any) => {
  const {devices, handle, selected, label} = props;
  const items = _.map(devices, (x, index) => <MenuItem key={index} value={x}>{x}</MenuItem>);

  return (
        <FormControl fullWidth>
          <InputLabel>{label}</InputLabel>
          <Select
            value={selected}
            onChange={handle}
          >
            {items}
          </Select>
        </FormControl>
      );
});

export { MidiSelector };
