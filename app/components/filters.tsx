import React, { Fragment, useMemo } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';
import { ThemeProvider } from '@material-ui/styles';
import theme from './theme';
import { FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Box, InputLabel, MenuItem, Select, Switch, Checkbox } from '@material-ui/core';
import { countryCodeToName } from '../data/countries';
import { ageRanges, educationLevels, educationRanges, getIndexFromRange, incomeRanges } from '../data/legend';
import { useAppDispatch, useAppSelector } from '../hooks';
import { RootState, updateObservationsQuery, updateValuesQuery } from '../store';
import { shallowEqual, useSelector } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import { AllEntriesStore, Observation } from '../observation';

const useStyles = makeStyles((theme) => ({
  root: {
    width: 400,
  },
  margin: {
    height: theme.spacing(3),
  },
}));

function educationValuetext(value) {
  return educationLevels[value];
}

const selectAvailableCountries = createSelector<RootState, AllEntriesStore, any>(
  state => state.rawData.allEntries,
  entries => {
    console.count('[selector] selectAvailableCountries');
    const countriesMap = {};
    Object.keys(entries).forEach((code) => {
      if (!countriesMap[code]) {
        countriesMap[code] = true;
      }
    });
    return Object.keys(countriesMap);
  }
)


export function Filters() {
  const classes = useStyles();
  const dispatch = useAppDispatch()
  const countries = useAppSelector(selectAvailableCountries)

  // --- Gender

  const genderValue = useAppSelector(state => {
    const sex = state.rawData.filterQuery.sex;
    if (!sex) {
      return 'other';
    } else {
      return sex;
    }
  });

  const handleGenderChange = (event) => {
    let sex = event.target.value;
    sex = sex == 'other' ? null : sex;
    dispatch(updateObservationsQuery({ sex }))
  };

  // --- Country

  const countryValue = useAppSelector(state => {
    const selectedCodes = state.rawData.filterQuery.country_codes
    if (selectedCodes) {
      return selectedCodes[0];
    } else {
      return '';
    }
  });

  const handleCountryChange = (event) => {
    const code = event.target.value;
    dispatch(updateObservationsQuery({ country_codes: [code] }))
  };

  // --- Age

  const ageValue = useAppSelector(state => {
    const query = state.rawData.filterQuery
    if (query.min_birth_year == null && query.max_birth_year == null) {
      return undefined;
    } else {
      return getIndexFromRange(query.min_birth_year, query.max_birth_year, ageRanges);
    }
  });
  const [temporaryAgeValue, setTemporaryAgeValue] = React.useState(ageValue);
  const ageSliderValue = temporaryAgeValue != undefined ? temporaryAgeValue : 0

  const handleAgeChange = (event, value: number) => {
    setTemporaryAgeValue(value);
  };

  const commitAgeChange = (event, value: number) => {
    const range = ageRanges[value];
    dispatch(updateObservationsQuery({
      min_birth_year: range[0],
      max_birth_year: range[1],
    }));
  };

  const handleCheckboxAgeChange = (event, checked: boolean) => {
    if (!checked) {
      dispatch(updateObservationsQuery({
        min_birth_year: null,
        max_birth_year: null,
      }));
    } else {
      const range = ageRanges[temporaryAgeValue != undefined ? temporaryAgeValue : 0];
      dispatch(updateObservationsQuery({
        min_birth_year: range[0],
        max_birth_year: range[1],
      }));
    }
  };

  // --- Income

  const incomeValue = useAppSelector(state => {
    const query = state.rawData.filterQuery
    if (query.min_income_quantiles == null && query.max_income_quantiles == null) {
      return undefined;
    } else {
      return getIndexFromRange(query.min_income_quantiles, query.max_income_quantiles, incomeRanges);
    }
  });
  const [temporaryIncomeValue, setTemporaryIncomeValue] = React.useState(incomeValue);
  const incomeSliderValue = temporaryIncomeValue != undefined ? temporaryIncomeValue : 0

  const handleIncomeChange = (event, value: number) => {
    setTemporaryIncomeValue(value);
  };

  const commitIncomeChange = (event, value: number) => {
    const range = incomeRanges[value];
    dispatch(updateObservationsQuery({
      min_income_quantiles: range[0],
      max_income_quantiles: range[1],
    }));
  };

  const handleCheckboxIncomeChange = (event, checked: boolean) => {
    if (!checked) {
      dispatch(updateObservationsQuery({
        min_income_quantiles: null,
        max_income_quantiles: null,
      }));
    } else {
      const range = incomeRanges[temporaryIncomeValue != undefined ? temporaryIncomeValue : 0];
      dispatch(updateObservationsQuery({
        min_income_quantiles: range[0],
        max_income_quantiles: range[1],
      }));
    }
  };

  // --- Education

  const educationValue = useAppSelector(state => {
    const query = state.rawData.filterQuery
    if (query.min_education == null && query.max_education == null) {
      return undefined;
    } else {
      return getIndexFromRange(query.min_education, query.max_education, educationRanges);
    }
  });
  const [temporaryEducationValue, setTemporaryEducationValue] = React.useState(educationValue);
  const educationSliderValue = temporaryEducationValue != undefined ? temporaryEducationValue : 0

  const handleCheckboxEducationChange = (event, checked: boolean) => {
    if (!checked) {
      dispatch(updateObservationsQuery({
        min_education: null,
        max_education: null,
      }));
    } else {
      const range = educationRanges[temporaryEducationValue != undefined ? temporaryEducationValue : 0];
      dispatch(updateObservationsQuery({
        min_education: range[0],
        max_education: range[1],
      }));
    }
  };

  const handleEducationChange = (event, value: number) => {
    setTemporaryEducationValue(value);
  };
  const commitEducationChange = (event, value: number) => {
    const range = educationRanges[value];
    dispatch(updateObservationsQuery({
      min_education: range[0],
      max_education: range[1],
    }));
  };

  // --- Education Parents

  const educationParentsValue = useAppSelector(state => {
    const query = state.rawData.filterQuery
    if (query.min_education_parents == null && query.max_education_parents == null) {
      return undefined;
    } else {
      return getIndexFromRange(query.min_education_parents, query.max_education_parents, educationRanges);
    }
  });
  const [temporaryEducationParentsValue, setTemporaryEducationParentsValue] = React.useState(educationParentsValue);
  const educationParentsSliderValue = temporaryEducationParentsValue != undefined ? temporaryEducationParentsValue : 0

  const handleCheckboxEducationParentsChange = (event, checked: boolean) => {
    if (!checked) {
      dispatch(updateObservationsQuery({
        min_education_parents: null,
        max_education_parents: null,
      }));
    } else {
      const range = educationRanges[temporaryEducationParentsValue != undefined ? temporaryEducationParentsValue : 0];
      dispatch(updateObservationsQuery({
        min_education_parents: range[0],
        max_education_parents: range[1],
      }));
    }
  };

  const handleEducationParentsChange = (event, value: number) => {
    setTemporaryEducationParentsValue(value);
  };
  const commitEducationParentsChange = (event, value: number) => {
    const range = educationRanges[value];
    dispatch(updateObservationsQuery({
      min_education_parents: range[0],
      max_education_parents: range[1],
    }));
  };

  // --- Religiosity

  const religionValue = useAppSelector(state => state.rawData.filterQuery.is_religious);

  const handleIsReligiousChange = (event) => {
    dispatch(updateObservationsQuery({ is_religious: event.target.checked }))
  };

  const handleCheckboxReligionChange = (event, checked: boolean) => {
    if (!checked) {
      dispatch(updateObservationsQuery({
        is_religious: undefined,
      }));
    } else {
      dispatch(updateObservationsQuery({
        is_religious: false,
      }));
    }
  };

  // ---

  return (
    <div className={classes.root}>
      <FilterGroup label="Country">
        <Select labelId="label" id="select" value={countryValue} onChange={handleCountryChange}>
          {countryMenuItems(countries)}
        </Select>
      </FilterGroup>

      <FilterGroup label="Gender">
        <RadioGroup row aria-label="gender" name="gender1" value={genderValue} onChange={handleGenderChange}>
          <FormControlLabel value="M" control={<Radio />} label="Female" />
          <FormControlLabel value="F" control={<Radio />} label="Male" />
          <FormControlLabel value="other" control={<Radio />} label="Any" />
        </RadioGroup>
      </FilterGroup>

      {/* Education */}
      <FilterGroup label="Education ">
        <Box mt={2} display='flex' alignItems='center'>
          <Checkbox
            style={{ paddingRight: 18, paddingLeft: 0 }}
            checked={educationValue != undefined}
            onChange={handleCheckboxEducationChange}
          />
          <Slider
            defaultValue={educationSliderValue}
            value={educationSliderValue}
            onChange={handleEducationChange}
            onChangeCommitted={commitEducationChange}
            getAriaValueText={educationValuetext}
            min={0}
            max={educationRanges.length - 1}
            step={1}
            valueLabelDisplay="on"
          />
        </Box>
        <div>{`from ${educationLevels[educationRanges[educationSliderValue][0]]} to ${educationLevels[educationRanges[educationSliderValue][1]]}`}</div>
      </FilterGroup>

      {/* Education Parents */}
      <FilterGroup label="Education parents">
        <Box mt={2} display='flex' alignItems='center'>
          <Checkbox 
            style={{paddingRight: 18, paddingLeft: 0}}
            checked={educationParentsValue != undefined}
            onChange={handleCheckboxEducationParentsChange}
          />
          <Slider
            defaultValue={educationParentsSliderValue}
            value={educationParentsSliderValue}
            onChange={handleEducationParentsChange}
            onChangeCommitted={commitEducationParentsChange}
            getAriaValueText={educationValuetext}
            // aria-labelledby="discrete-slider-custom"
            min={0}
            max={educationRanges.length - 1}
            step={1}
            valueLabelDisplay="on"
          // valueLabelFormat={(v) => <div>{educationLevels[v]}</div>}
          // marks={educationMarks}
          />
        </Box>
        <div>{`from ${educationLevels[educationRanges[educationParentsSliderValue][0]]} to ${educationLevels[educationRanges[educationParentsSliderValue][1]]}`}</div>
      </FilterGroup>

      {/* Age */}
      <FilterGroup label="Age">
        <Box mt={2} display='flex' alignItems='center'>
          <Checkbox
            style={{ paddingRight: 18, paddingLeft: 0 }}
            checked={ageValue != undefined}
            onChange={handleCheckboxAgeChange}
          />
          <Slider
            defaultValue={ageSliderValue}
            value={ageSliderValue}
            onChange={handleAgeChange}
            onChangeCommitted={commitAgeChange}
            min={0}
            max={ageRanges.length - 1}
            step={1}
            valueLabelDisplay="off"
          />
        </Box>
        <div>{`Born from ${ageRanges[ageSliderValue][0]} - ${ageRanges[ageSliderValue][1]}`}</div>
      </FilterGroup>

      {/* Income */}
      <FilterGroup label="Income">
        <Box mt={2} display='flex' alignItems='center'>
          <Checkbox
            style={{ paddingRight: 18, paddingLeft: 0 }}
            checked={incomeValue != undefined}
            onChange={handleCheckboxIncomeChange}
          />
          <Slider
            defaultValue={incomeSliderValue}
            value={incomeSliderValue}
            onChange={handleIncomeChange}
            onChangeCommitted={commitIncomeChange}
            min={0}
            max={incomeRanges.length - 1}
            step={1}
            valueLabelDisplay="off"
          />
        </Box>
        <div>{`Income from ${incomeRanges[incomeSliderValue][0]} - ${incomeRanges[incomeSliderValue][1]}`}</div>
      </FilterGroup>

      {/* Religiosity */}
      <FilterGroup label='Religious person'>
        <Checkbox
          style={{ paddingRight: 18, paddingLeft: 0 }}
          checked={religionValue != undefined}
          onChange={handleCheckboxReligionChange}
        />
        <Switch
          checked={!!religionValue}
          onChange={handleIsReligiousChange}
          name="checkedA"
          inputProps={{ 'aria-label': 'secondary checkbox' }}
        />
      </FilterGroup>
    </div>
  );
}

function FilterGroup(props: { label: string, children?: JSX.Element[] | JSX.Element }) {
  return (
    <Box mt={4}>
      <Typography id="discrete-slider-custom" gutterBottom>
        {props.label}
      </Typography>
      {props.children}
    </Box>
  );
}


const CountryMenuItems = React.memo(function countryList(props) {
  return (
    <Fragment>
      <MenuItem value="10">Ten</MenuItem>
      <MenuItem value="20">Twenty</MenuItem>
    </Fragment>
  );
});

function countryMenuItems(codes: string[]) {
  return codes.map(code =>
    <MenuItem value={code} key={code}>{countryCodeToName[code]}</MenuItem>,
  )
}

const staticCountryMenuItems = countryMenuItems(Object.keys(countryCodeToName));