import React, { Fragment, useEffect } from 'react';
import Typography from '@material-ui/core/Typography';
import { Box } from '@material-ui/core';
import { useAppDispatch, useAppSelector } from '../hooks';
import { getReadableDescriptionForDemographic, getReadableDescriptionForGroup, groupsForDemographic, Observation, ValuesMap } from '../observation';
import { GroupLayoutInfo } from './viz/grid_viz_configs';
import axisStyles from '../../styles/axis.module.css'
import classNames from 'classnames/bind';
import { colorGradientList, colorGradientListCSS, getColorIndex } from './ui_utils';
import { educationLevels } from '../data/legend';
import { countryCodeToName } from '../data/countries';
import { formatPercent } from '../data/format';

interface Props {
}

const formatScore = (s: number) => `${Math.trunc(s * 9 + 1)}/10`;
const formatScoreOneDecimal = (s: number) => {
    let v = (s * 9 + 1);
    let vstring;
    // I should use a library for doing this XXX
    if (v % 1 >= 0.1) {
        vstring = v.toFixed(1);
    } else {
        vstring = ''+Math.trunc(v);
    }
    return `${vstring}/10`;
}

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


    // refactor and reuse code below

    const animationInProgress = useAppSelector(state => {
        return state.rawData.animationInProgress;
    });
    
    const clsWrapper = classNames(axisStyles.axis, {
        [axisStyles.axisHidden]: animationInProgress || !selectedObservation,
        [axisStyles.axisTransitionProperties]: !animationInProgress,
    });

    const wrapperStyles = {
        width: '100%',
        minHeight: '100px',
    } as any;

    const innerContainerStyle = {
        borderLeft: '1px solid #FFFFFF',
        height: '100%',
    } as any;

    return (
        <SidePanel hide={!selectedObservation} title='About the selected person'>
            <Typography variant='h6'>
                {selectedObservation ? describeObservation(selectedObservation) : null}
            </Typography>
        </SidePanel>
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
        `In ${countryName}` : `In the demographic selected in ${countryName}`;

    const below = `${formatPercent(groupStats.nBelow / groupStats.totalObservations)
                    } are more opposed to the topic than you`
    const above = `${formatPercent(groupStats.nAbove / groupStats.totalObservations)
        } are more tolerant than you`

    return (
        <Fragment>
            <Box display='flex' flexDirection='column'>
                <Typography variant='h6'>
                    {`You have answered that you tolerate ${ValuesMap[selectedValue]} ${numericValue}/10.`} 
                </Typography>
                <Box mt={1}>
                    <Typography variant='h6'>
                        {`${groupDesc} the average answer is ${formatScoreOneDecimal(groupStats.average)},  
                        and ${formatPercent(groupStats.nLikeYou / groupStats.totalObservations)} have given an answer similar to yours.`}
                    </Typography>
                </Box>
                <Box mt={1}>
                    <Typography variant='h6'>
                        {`${groupDesc} ${below} and ${above}.`}
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


    // refactor and reuse code below

    const animationInProgress = useAppSelector(state => {
        return state.rawData.animationInProgress;
    });

    const clsWrapper = classNames(axisStyles.axis, {
        [axisStyles.axisHidden]: animationInProgress || !selectedObservation,
        [axisStyles.axisTransitionProperties]: !animationInProgress,
    });

    const wrapperStyles = {
        width: '100%',
        minHeight: '100px',
    } as any;

    const innerContainerStyle = {
        borderLeft: '1px solid #FFFFFF',
        height: '100%',
    } as any;

    return (
       <SidePanel title='About you' hide={false}>
            {describeYourself()}
        </SidePanel>
    );
});

// ----

export const SidePanel = (props: {children: any, hide: boolean, title: string}) => {

    const animationInProgress = useAppSelector(state => {
        return state.rawData.animationInProgress;
    });

    const clsWrapper = classNames(axisStyles.axis, {
        [axisStyles.axisHidden]: animationInProgress || props.hide,
        [axisStyles.axisTransitionProperties]: !animationInProgress,
    });

    const wrapperStyles = {
        width: '100%',
        minHeight: '100px',
    } as any;

    const innerContainerStyle = {
        borderLeft: '1px solid #FFFFFF',
        height: '100%',
    } as any;

    return (
        <Box className={clsWrapper} style={wrapperStyles} >
            <Box pl={1} display='flex' flexDirection='column' style={innerContainerStyle}>
                <Box mb={1}>
                    <Typography variant='h4'>
                        {props.title}
                    </Typography>
                </Box>
                {props.children}
            </Box>
        </Box>
    );
};


