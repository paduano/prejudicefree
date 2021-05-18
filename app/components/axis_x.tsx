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
import { AllEntriesStore, getReadableDescriptionForDemographic, getReadableDescriptionForGroup, groupsForDemographic, Observation } from '../observation';
import { getFlagFromCountryCode, selectAvailableCountries } from './ui_utils';
import { CountrySelect, DemographicSelect, Select, ValuesSelect } from './select';
import styles from '../../styles/titles.module.css'
import { GroupLayoutInfo } from './viz/grid_viz_configs';

interface Props {
    groupLayoutInfo: GroupLayoutInfo;
    getAnnotationPos: (x: number, y: number) => {x: number, y: number},
    getSizeTransform: (v: number) => number,
}

export const AxisX = React.memo((props: Props) => {
    const { groupLayoutInfo, getAnnotationPos, getSizeTransform} = props;
    const dispatch = useAppDispatch()
    const demo = useAppSelector(state => {
        return state.rawData.primaryFilterDemographic;
    });

    if (!demo) {
        return <div></div>
    }
    
    const demoGroups = groupsForDemographic(demo);

    console.count('render');

    const styles = {
        left: 0,
        top: 0,
        pointerEvents: 'none',
        color: 'white'
    } as any;

    const currentRow = 0; // use store value

    const getSegmentPos = (groupIndex: number) => {
        const x3d = groupLayoutInfo.groupPosX[groupIndex][currentRow];
        return getAnnotationPos(x3d, groupLayoutInfo.groupPosY[groupIndex][currentRow]);
    }
    const getSegmentWidth = (groupIndex: number) => getSizeTransform(groupLayoutInfo.rectWidths[groupIndex][currentRow]);

    const xSegments = demoGroups.map((_label, groupIndex) => {
        const { x, y } = getSegmentPos(groupIndex);
        const width = getSegmentWidth(groupIndex);
        const segmentStyle = {
            left: x,
            top: y,
            width,
        };
        const borderStyle = '1px solid #FFFFFF';
        const squareStyle =  {
            borderBottom: borderStyle,
            borderLeft: borderStyle,
            borderRight: borderStyle,
            height: '20px',
        };
        return (
            <Box pt={2} position='absolute' display='flex' flexDirection='column' style={segmentStyle} key={`axis-x-segment-${groupIndex}`}>
                <div style={squareStyle}></div>
                <Box mt={1}>
                    <Typography align='center' variant='h3'>
                        {getReadableDescriptionForGroup(demo, groupIndex)}
                    </Typography>
                </Box>
            </Box>
        )
    });

    const lastGroupIndex = demoGroups.length - 1;
    const lastSegmentPos = getSegmentPos(lastGroupIndex);
    const width = getSegmentWidth(lastGroupIndex);
    const legendTitleStyle = {
        left: lastSegmentPos.x + width + 20, 
        top: lastSegmentPos.y + 20,
    }
    const legendTitle = (
        <Box position='absolute' style={legendTitleStyle}>
            <Typography align='center' variant='h3'>
                {getReadableDescriptionForDemographic(demo).toUpperCase()}
            </Typography>
        </Box>
    );

    return (
        <Box position='absolute' display='flex' flexDirection='column' style={styles} >
            <Box position='relative'>
                {xSegments}
                {legendTitle}
            </Box>
        </Box>
    );
});

