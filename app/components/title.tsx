import React, { Fragment, useMemo } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';
import { ThemeProvider } from '@material-ui/styles';
import theme from './theme';
import { FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Box, InputLabel, MenuItem, Switch, Checkbox } from '@material-ui/core';
import { countryCodeToName } from '../data/countries';
import { ageRanges, educationLevels, educationRanges, getIndexFromRange, incomeRanges } from '../data/legend';
import { useAppDispatch, useAppSelector } from '../hooks';
import { RootState, updateObservationsQuery, updateValuesQuery } from '../store';
import { shallowEqual, useSelector } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import { AllEntriesStore, Observation } from '../observation';
import { getFlagFromCountryCode, selectAvailableCountries } from './ui_utils';
import { CountrySelect, DemographicSelect, Select, ValuesSelect } from './select';
import styles from '../../styles/titles.module.css'


export function Title() {
    const dispatch = useAppDispatch()

    // --- Country

    return (
        <Box display='flex' flexDirection='column' className={styles.titleContainer} zIndex='9'>
            <Box>
                <Typography variant='h1' >
                    What{' '}
                    <CountrySelect />
                    {' '} thinks about {' '}
                    <ValuesSelect />
                </Typography>
            </Box>
            <Box mt={1}>
                <Typography variant='h2' >
                    Broken down by{' '}
                    <DemographicSelect axis='x' />
                    {' '} and {' '}
                    <DemographicSelect axis='y' />
                </Typography>
            </Box>
        </Box>
    );
}

