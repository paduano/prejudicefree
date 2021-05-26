import React, { Fragment, useEffect, useRef, useState } from 'react';
import Typography from '@material-ui/core/Typography';
import { Box } from '@material-ui/core';
import { useAppDispatch, useAppSelector } from '../hooks';
import { getReadableDescriptionForDemographic, getReadableDescriptionForGroupValue, getReadableGroupDescriptor, groupsForDemographic, Observation, ObservationDemographics, ValuesMap } from '../observation';
import { color, getColorIndex } from './colors';
import { educationLevels } from '../data/legend';
import { countryCodeToName } from '../data/countries';
import { formatPercent } from '../data/format';
import { ChartAnnotationWrapper } from './chart_annotation_wrapper';
import YouMarker from './you_marker';
import { isFeatureAvailableSelector } from '../onboarding';
import { useAccentStyles } from './theme';
import { SelectionMarker } from './selection_marker';
import styles from '../styles/detail_panel.module.css'
import { countryNameAppSelector } from '../selectors';
import { Button } from './ui_utils';
import { setCurrentColumn, setCurrentRow } from '../store';

interface Props {
}

const formatScore0to1 = (s: number) => `${Math.trunc(s * 9 + 1)}/10`; // 1-10
const formatScore = (s: number) => `${s}/10`;
const formatScoreOneDecimal = (s: number) => {
    // let v = (s * 9 + 1); // 1-10
    let v = s;
    let vstring;
    // I should use a library for doing this XXX
    if (v % 1 >= 0.1) {
        vstring = v.toFixed(1);
    } else {
        vstring = '' + Math.trunc(v);
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
                    {`${ValuesMap[k]}:`}{' '}{formatScore(o[k] as number)}<br />
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
            <b>Gender:</b> {o.sex == 'M' ? 'male' : 'female'} <br />
            <b>Born:</b> {o.birth_year} <br />
            <b>Education:</b>  {educationLevels[o.education]} <br />
            <b>Income range:</b> {formatScore0to1(o.income_quantiles / 10)} <br />
            <b>Religious:</b> {o.is_religious ? 'yes' : 'no'} <br />
            <div>•</div>
            {tolerate.length > 0 ? <Box mb={1}>
                <b>Tolerates</b><br />
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

const FlashingPercent = (props: { children: string }) => {
    const { children } = props;
    const oldChild = useRef(null);
    const [uiPaint, setUiPaint] = useState(false);
    const duration = 1000;

    useEffect(() => {
        if (children !== oldChild.current) {
            oldChild.current = children;
            setUiPaint(true);
            setTimeout(() => {
                setUiPaint(false);
            }, duration);
        }

    }, [children]);

    const style = {
        color: uiPaint ? color.accent : '#FFFFFF',
        transition: `color ${duration}ms linear`,
    } as any;

    return (
        <span style={style}>{children}</span>
    );

}

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

    const countryName = countryNameAppSelector();

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
        <Fragment> <b><FlashingPercent>{formatPercent(groupStats.nBelow / groupStats.totalObservations)}</FlashingPercent></b>
            {' '}is more opposed to the topic than you </Fragment>
    );

    const above = (
        <Fragment> <b><FlashingPercent>{formatPercent(groupStats.nAbove / groupStats.totalObservations)}</FlashingPercent></b>
            {' '}is more tolerant</Fragment>
    );

    const samePercentText = <FlashingPercent>{formatPercent(groupStats.nLikeYou / groupStats.totalObservations)}</FlashingPercent>;
    const valueText = ValuesMap[selectedValue];
    const youTolerateValueText = <b>{numericValue}/10</b>;

    const moveYourself = (demo: ObservationDemographics) => {
        const groups = groupsForDemographic(demo);
        const moveButtons = groups.map((_, i) => {
            const dispatch = useAppDispatch();
            let select = false;
            let handleClick = () => {};
            if (demo == demo1) {
                handleClick = () => dispatch(setCurrentColumn({ column: i }));
                select = i == currentColumn;
            } else if (demo == demo2) {
                handleClick = () => dispatch(setCurrentRow({ row: i }));
                select = i == currentRow;
            }
            const label = getReadableDescriptionForGroupValue(demo, i);
            return <Button small select={select} label={label} onClick={handleClick} mr={1} key={`button-${i}`}></Button>
        });
        return (
            <Box mt={2}>
                {/* <div style={{borderTop: '1px solid white'}}></div> */}
                <b><u>Change your {getReadableDescriptionForDemographic(demo)}:</u></b>
                <Box display='flex' flexWrap='wrap'>
                    {moveButtons}
                </Box>
            </Box>
        )
    };

    return (
        <Fragment>
            <Box display='flex' flexDirection='column'>
                <Typography variant='h6'>
                    You have answered that you tolerate {valueText} {youTolerateValueText}.
                </Typography>
                <Box mt={1}>
                    <Typography variant='h6'>
                        {groupDesc} <b>{samePercentText}</b> has given the same answer than you, and
                        the average is <b><FlashingPercent>{formatScoreOneDecimal(groupStats.average)}</FlashingPercent></b>.
                    </Typography>
                </Box>
                <Box mt={1}>
                    <Typography variant='h6'>
                        {below} and {above}.
                    </Typography>
                </Box>

                {demo1 ? moveYourself(demo1) : null}
                {demo2 ? moveYourself(demo2) : null}

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

export const SidePanel = (props: { children: any, hide: boolean, title: string, marker?: JSX.Element }) => {
    const wrapperStyles = {
        width: '100%',
        minHeight: '100px',
    } as any;

    const innerContainerStyle = {
        borderLeft: '1px solid #FFFFFF',
        height: '100%',
        marginLeft: '9px', // for the marker alignment
        background: color.backgroundWithOpacity
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


