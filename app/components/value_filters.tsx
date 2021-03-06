import React, {  } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';
import { Box, Checkbox } from '@material-ui/core';
import { useAppDispatch, useAppSelector } from '../hooks';
import { updateValuesQuery } from '../store';

const useStyles = makeStyles((theme) => ({
  root: {
    width: 400,
  },
  margin: {
    height: theme.spacing(3),
  },
}));

export function ValueFilters() {
  const classes = useStyles();

  // justify_homosexuality,
  // justify_prostitution,
  // justify_abortion,
  // justify_divorce,
  // justify_euthanasia,
  // justify_suicide,
  // justify_casual_sex,
  // justify_death_penalty

  return (
    <div className={classes.root}>
      <ValueFilterGroup label="justify_abortion" />
      <ValueFilterGroup label="justify_homosexuality" />
      <ValueFilterGroup label="justify_euthanasia" />
      <ValueFilterGroup label="justify_prostitution" />
      <ValueFilterGroup label="justify_suicide" />
      <ValueFilterGroup label="justify_death_penalty" />
      <ValueFilterGroup label="justify_casual_sex" />
      <ValueFilterGroup label="justify_divorce" />
    </div>
  );
}

function ValueFilterGroup(props: { label: string, children?: JSX.Element[] | JSX.Element }) {
  const dispatch = useAppDispatch()
  const {label} = props;
  const value = useAppSelector(state => {
    const query = state.rawData.valuesQuery;
    return query[label];
  });
  const sliderValue = value !== undefined ? value : 0
  const [temporaryValue, setTemporaryValue] = React.useState<number | null>(sliderValue);


  const handleValueChange = (event, value: number) => {
    setTemporaryValue(value);
  };

  const commitValueChange = (event, value: number) => {
    // setTemporaryValue(null);
    console.error('updateValuesQuery broken with refactor')
    // dispatch(updateValuesQuery({[label]: value}));
  };
  const handleCheckboxChange = (event, checked: boolean) => {
    // setTemporaryValue(null);
    if (!checked) {
      console.error('updateValuesQuery broken with refactor')
      // dispatch(updateValuesQuery({ [label]: undefined}));
    } else {
      dispatch(updateValuesQuery({ [label]: temporaryValue}));
    }
  };

  return (
    <Box mt={2}>
      <Box display='flex' alignItems='center'>
        <Checkbox
          style={{ paddingRight: 9, paddingLeft: 0, marginLeft: -9 }}
          checked={value !== undefined}
          onChange={handleCheckboxChange}
        />
        <Typography id="discrete-slider-custom" gutterBottom>
          {`${label.replace('_', ' ')}: ${value === undefined ? 'disabled' : value}`}
        </Typography>
      </Box>
      <Box mt={0}>
        <Slider
          defaultValue={temporaryValue}
          value={temporaryValue}
          onChange={handleValueChange}
          onChangeCommitted={commitValueChange}
          // aria-labelledby="discrete-slider-custom"
          min={0}
          max={1}
          step={0.1}
          valueLabelDisplay="off"
        // valueLabelFormat={ (v) => <div>{v == 80 ? '> 80' : v}</div> }
        />
      </Box>
      {props.children}
    </Box>
  );
}
