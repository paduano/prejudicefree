import React, { Fragment, useEffect } from 'react';
import Typography from '@material-ui/core/Typography';
import { Box } from '@material-ui/core';
import { useAppDispatch, useAppSelector } from '../hooks';
import { getReadableDescriptionForDemographic, getReadableDescriptionForGroupValue, getReadableGroupDescriptor, groupsForDemographic, Observation, ValuesMap } from '../observation';
import { GroupLayoutInfo } from './viz/grid_viz_configs';
import axisStyles from '../../styles/chart_annotation.module.css'
import classNames from 'classnames/bind';
import { colorGradientList, colorGradientListCSS, getColorIndex } from './ui_utils';
import { educationLevels } from '../data/legend';
import { countryCodeToName } from '../data/countries';
import { formatPercent } from '../data/format';
import { ChartAnnotationWrapper } from './chart_annotation_wrapper';
import YouMarker from './you_marker';
import { isFeatureAvailableSelector } from '../onboarding';
import { useAccentStyles } from './theme';
import { SelectionMarker } from './selection_marker';

interface Props {
}

// const formatScore = (s: number) => `${Math.trunc(s * 9 + 1)}/10`; // 1-10
const formatScore = (s: number) => `${s}/10`;
const formatScoreOneDecimal = (s: number) => {
    // let v = (s * 9 + 1); // 1-10
    let v = s;
    let vstring;
    // I should use a library for doing this XXX
    if (v % 1 >= 0.1) {
        vstring = v.toFixed(1);
    } else {
        vstring = ''+Math.trunc(v);
    }
    return `${vstring}/10`;
}

export const DetailPanel = () => {
    const selectedObservation = useAppSelector(state => {
        return state.rawData.selectedObservation
    });
    const currentGroupStats = useAppSelector(state => {
        return state.rawData.currentGroupStats
    });

    const showYourselfPanel = currentGroupStats && !selectedObservation;

    return (
        <Fragment>
            {selectedObservation ? <SelectedObservation /> : null}
            {showYourselfPanel ? <YourselfInfo /> : null}
        </Fragment>
    )

}

// --- SELECTED PERSON 
const describeObservation = (o: Observation) => {

    const renderJustify = (k: string) => {
        if (o[k] != undefined) {
            return (
                <Fragment key={`just-${k}`}>
                    {`${ValuesMap[k]}:`}{' '}{formatScore(o[k] as number)}<br/>
                </Fragment>
            );
        } else return null;
    }
    const sortedValues = Object.keys(ValuesMap).filter(a => o[a] != undefined).sort((a, b) => o[b] - o[a]);
    const tolerate = sortedValues.filter(a => getColorIndex(o[a]) == 2);
    const oppose = sortedValues.filter(a => getColorIndex(o[a]) == 0);
    const unsure = sortedValues.filter(a => getColorIndex(o[a]) == 1);
    return (
        <Fragment>
            <b>Gender:</b> {o.sex == 'M' ? 'male' : 'female'} <br/>
            <b>Born:</b> {o.birth_year} <br />
            <b>Education:</b>  {educationLevels[o.education]} <br />
            <b>Income range:</b> {formatScore(o.income_quantiles/10)} <br />
            <b>Religious:</b> {o.is_religious ? 'yes' : 'no'} <br />
            <div>•</div>
            {tolerate.length > 0 ? <Box mb={1}>
                <b>Tolerates</b><br/>
                {tolerate.map(k => renderJustify(k))}
            </Box> : null}
            {oppose.length > 0 ? <Box mb={1}>
                <b>Opposes</b><br />
                {oppose.map(k => renderJustify(k))}
            </Box> : null}
            {unsure.length > 0 ? <Box mb={1}>
                <b>Uncertain</b><br />
                {unsure.map(k => renderJustify(k))}
            </Box> : null}
        </Fragment>
    )
}

export const SelectedObservation = React.memo((props: Props) => {
    const selectedObservation = useAppSelector(state => {
        return state.rawData.selectedObservation
        // return state.rawData.allEntries['840'][0]
    });

    const marker = <SelectionMarker />;

    return (
        <Fragment>
            <SidePanel hide={!selectedObservation} title='About the selected person' marker={marker}>
                <Typography variant='h6'>
                    {selectedObservation ? describeObservation(selectedObservation) : null}
                </Typography>
            </SidePanel>
        </Fragment>
    );
});

// YOU PANEL
// -----------

const describeYourself = () => {
    const selectedValue = useAppSelector(state => {
        return state.rawData.valuesQuery.selectedValue;
    });
    const numericValue = useAppSelector(state => {
        return state.rawData.valuesQuery.value;
    });
    const groupStats = useAppSelector(state => {
        return state.rawData.currentGroupStats;
    });
    const currentRow = useAppSelector(state => {
        return state.rawData.currentRow;
    });
    const currentColumn = useAppSelector(state => {
        return state.rawData.currentColumn;
    });

    const countryName = useAppSelector(state => {
        if (state.rawData.filterQuery.country_codes && state.rawData.filterQuery.country_codes.length > 0) {
            return countryCodeToName[state.rawData.filterQuery.country_codes[0]];
        } else {
            return '';
        }
    });

    const demo1 = useAppSelector(state => {
        return state.rawData.primaryFilterDemographic;
    });

    const demo2 = useAppSelector(state => {
        return state.rawData.secondaryFilterDemographic;
    });

    const entireCountry = !demo1 && !demo2;

    const groupDesc = entireCountry ? 
        `In ${countryName}` : 
        getReadableGroupDescriptor(currentColumn, currentRow, demo1, demo2) + ', ';

    const below = (
        <Fragment> <b>{formatPercent(groupStats.nBelow / groupStats.totalObservations)}{' '}</b> is more opposed to the topic than you </Fragment>
    );

    const above = (
        <Fragment> <b>{formatPercent(groupStats.nAbove / groupStats.totalObservations)}</b> is more tolerant</Fragment>
    );

    const samePercentText = formatPercent(groupStats.nLikeYou / groupStats.totalObservations);
    const valueText = ValuesMap[selectedValue];
    const youTolerateValueText = <b>{numericValue}/10</b>;
    return (
        <Fragment>
            <Box display='flex' flexDirection='column'>
                <Typography variant='h6'>
                    You have answered that you tolerate {valueText} {youTolerateValueText}.
                </Typography>
                <Box mt={1}>
                    <Typography variant='h6'>
                        {groupDesc} <b>{samePercentText}</b> has given the same answer than you, and 
                        the average is <b>{formatScoreOneDecimal(groupStats.average)}</b>.
                    </Typography>
                </Box>
                <Box mt={1}>
                    <Typography variant='h6'>
                       {below} and {above}
                    </Typography>
                </Box>
            </Box>
        </Fragment>
    );
}

export const YourselfInfo = React.memo((props: Props) => {
    const selectedObservation = useAppSelector(state => {
        return state.rawData.selectedObservation
        // return state.rawData.allEntries['840'][0]
    });

    const isVisible = useAppSelector(isFeatureAvailableSelector('yourself_info'));

    const marker = <YouMarker />

    return (
        <SidePanel title='About you' hide={!isVisible} marker={marker}>
            {describeYourself()}
        </SidePanel>
    );
});

// ----

export const SidePanel = (props: {children: any, hide: boolean, title: string, marker?: JSX.Element}) => {
    const wrapperStyles = {
        width: '100%',
        minHeight: '100px',
    } as any;

    const innerContainerStyle = {
        borderLeft: '1px solid #FFFFFF',
        height: '100%',
        marginLeft: '9px', // for the marker alignment
    } as any;

    const isOverlayVisible = !!useAppSelector(state => {
        return state.rawData.uiSelect.current
        // return state.rawData.allEntries['840'][0]
    });

    const typoCls = useAccentStyles().accentText;

    const isFeatureSidePanelAvailable = useAppSelector(isFeatureAvailableSelector('side_panel'));

    return (
        <ChartAnnotationWrapper style={wrapperStyles} hidden={props.hide || isFeatureSidePanelAvailable}>
            <Box>
                {props.marker}
            </Box>
            <Box pl={1} display='flex' flexDirection='column' style={innerContainerStyle}>
                <Box mb={1}>
                    <Typography variant='h4' className={typoCls}>
                        {props.title}
                    </Typography>
                </Box>
                {props.children}
            </Box>
        </ChartAnnotationWrapper>
    );
};


