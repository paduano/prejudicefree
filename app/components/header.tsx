import React, { Fragment, lazy, useMemo } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';
import { ThemeProvider } from '@material-ui/styles';
import theme, { useAccentStyles } from './theme';
import { FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Box, InputLabel, MenuItem, Switch, Checkbox } from '@material-ui/core';
import { countryCodeToName } from '../data/countries';
import { ageRanges, educationLevels, educationRanges, getIndexFromRange, incomeRanges } from '../data/legend';
import { useAppDispatch, useAppSelector } from '../hooks';
import { nextOnboardingStep, RootState, setPrimaryFilterDemographic, setSecondaryFilterDemographic, updateObservationsQuery, updateValuesQuery } from '../store';
import { shallowEqual, useSelector } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import { AllEntriesStore, Observation, ObservationDemographics, ValuesMap, ValuesQuery } from '../observation';
import { color, colorGradientListCSS, FadeGradient, getColorIndex, getFlagFromCountryCode, selectAvailableCountries } from './ui_utils';
import { CountrySelect, DemographicSelect, DemographicView, Select, ValuesSelect, ValuesView } from './select';
import styles from '../../styles/titles.module.css'
import { getCurrentStep, NextOnboardingStepButton, OnboardingStepTypes } from '../onboarding';


export function FullTitle() {

    return (
        <Box display='flex' flexDirection='column' className={styles.titleContainer} zIndex='9'>
            <Box>
                <Typography variant='h1' >
                    What{' '}
                    <CountrySelect />
                    {' '} thinks about {' '}
                    <ValuesSelect variant='h1' />
                </Typography>
            </Box>
            <Box mt={1}>
                <Typography variant='h2' >
                    Broken down by{' '}
                    <DemographicSelect variant='h2' axis='x' />
                    {' '} and {' '}
                    <DemographicSelect variant='h2' axis='y' />
                </Typography>
            </Box>
        </Box>
    );
}

const NextHeaderPrompt = (props: { children: JSX.Element | JSX.Element[] | string, nextLabel?: string}) => {
    return (
        <Box display='flex' alignItems='center'>
            {props.children}
            <Box flexGrow={1} />
            <NextOnboardingStepButton display='inline-block' nextLabel={props.nextLabel} />
        </Box>
    )
}

const SimpleHeaderTitle = (props: {children: string}) => {
    const classes = useAccentStyles();
    const style = {
        marginBottom: '0.25rem',
    }
    return (
        <Typography variant='h2' className={classes.accentText} style={style}>
            {props.children}
        </Typography>
    )
}

const SimpleHeaderSubtitle = (props: { children: string }) => {
    const classes = useAccentStyles();
    return (
        <Typography variant='h4'>
            {props.children}
        </Typography>
    )
}

const TitleSelector = (props: {primaryDemographic?: boolean, secondaryDemographic?}) => {
    const classes = useAccentStyles();
    return (
        <Box >
            <Box display='flex' alignItems='center'>
                <Typography variant='h2' display='inline' className={classes.accentText}> What{' '} </Typography>
                <CountrySelect ml={1} mr={1} mb={0} />
                <Typography variant='h2' display='inline' className={classes.accentText}> {' '} thinks about {' '} </Typography>
                <ValuesSelect variant='h2' ml={1} mr={1} mb={0} accent />
            </Box>
            {props.primaryDemographic || props.secondaryDemographic ? (
                <Box display='flex' alignItems='center'>
                    {/* primary */}
                    <Typography variant='h4' >
                        Broken down by{' '}
                    </Typography>
                    <DemographicSelect variant='h4' axis='x' ml={1} />

                    {/* secondary */}
                    {props.secondaryDemographic ? (
                        <Fragment>
                            <Typography variant='h2' >
                                and
                            </Typography>
                            <DemographicSelect variant='h2' axis='y' ml={1} />
                        </Fragment>
                    ) : null}
                </Box>
            ) : null}
        </Box>
    )
}

export function Header() {
    const headerBaseHeight = '7rem';
    const outerContainerStyle = {
    }
    const innerContainerStyle = {
        backgroundColor: color.backgroundWithOpacity,
    }
    // const backStyle = {
    //     position: 'absolute',
    //     top: 0,
    //     left: 0,
    //     width: 'calc(100% - 50px)',
    //     height: '100%',
    // } as any;

    const onboardingStep = useAppSelector(getCurrentStep);

    const HeaderContent = HeaderContents[onboardingStep.type];
    if (!HeaderContent) {
        throw `no header defined for step ${onboardingStep.type}`;
    }

    return (
        <Box
            id='title-outer-container'
            zIndex={9}
            style={outerContainerStyle}
            height={headerBaseHeight}
            alignItems='center'
        >
            <Box
                id='title-inner-container'
                position='relative'
                margin='auto'
                style={innerContainerStyle}
                minHeight={headerBaseHeight}
                width={900}
            >
                <HeaderContent />
                {/* <div style={backStyle}></div> */}
            </Box>
            <FadeGradient destinationColor={color.backgroundWithOpacity} orientation='top' />
        </Box>
    );
}



const HeaderContents = {
    /**
     * select country
     */
    [OnboardingStepTypes.SELECT_COUNTRY]: () => {
        return (
            <Fragment>
                <SimpleHeaderTitle>
                    Prejudice Free.
                </SimpleHeaderTitle>
                <Typography variant='h4'>
                    As part of the World Values Survey initiative, 120,000 people were interviewed around the world about their values.
                    This website is trying to show a bit of each one of them, plus you.
                </Typography>
                 
                <NextHeaderPrompt>
                    <Typography variant='h4' display='inline'> Select your country{' '} </Typography>
                    <CountrySelect ml={1} mr={1} mb={1} height={'2.7rem'} />
                    <Typography variant='h4' display='inline'>  {' '}and click next.{' '} </Typography>
                </NextHeaderPrompt>
            </Fragment>
        );

    },

    /**
     * select value
     */
    [OnboardingStepTypes.SELECT_VALUE]: () => {
        const dispatch = useAppDispatch();
        const onValuesSubmit = (query: ValuesQuery) => {
            dispatch(updateValuesQuery(query));
            dispatch(nextOnboardingStep());
        }
        return (
            <Fragment>
                <SimpleHeaderTitle>
                    What do you want to know?
                </SimpleHeaderTitle>

                <Typography variant='h4'>
                    I listed below a number of things that people find sometimes divisive or controversial. 
                    In what are you interested to see what your country thinks about?
                </Typography>
                <Box display='flex' flexDirection='row' width='100%' mt={4}>
                    <ValuesView onSubmit={onValuesSubmit} />
                </Box>
            </Fragment>
        );
    },

    /*
     * Viz random
     */
    [OnboardingStepTypes.VIZ_RANDOM]: () => {
        const selectedValue = useAppSelector(state => {
            return state.rawData.valuesQuery.selectedValue;
        });
        const vLabel = ValuesMap[selectedValue];
        return (
            <Fragment>
                <TitleSelector />

                {/* description */}
                <Typography variant='h4'>
                    People around you hold different opinions on {vLabel}. <br/>
                    We colored them <span style={{ color: colorGradientListCSS(2)}}>blue{' '}</span> if they answered that 
                    tolerate {vLabel} more 7, <span style={{ color: colorGradientListCSS(0) }}>red{' '}</span> if less than 4, 
                    <span style={{ color: colorGradientListCSS(1) }}>{' '}gray{' '}</span> otherwise. <br/>
                    Remember that the people you are seeing on the screen are real people that ansered the survey.
                    You can click on them with the mouse cursor and know a bit more about them. 
                </Typography>

                <NextHeaderPrompt>
                    <Typography variant='h4' display='inline' >
                        When you’re done fiddling around, click next.
                    </Typography>
                </NextHeaderPrompt>
            </Fragment>
        );
    },

    /*
    * Viz one group
    */
    [OnboardingStepTypes.VIZ_ONE_GROUP]: () => {
        return (
            <Fragment>
                <TitleSelector />
               
                {/* description */}
                <Typography variant='h4'>
                    Let's bring some order. The people are sorted according to their answer. <br/>
                    You (the one new selected in yellow) are placed close to people that thinks similarly to you.
                </Typography>

                <NextHeaderPrompt>
                    <Typography variant='h4' display='inline' >
                        When you’re done fiddling around, click next.
                    </Typography>
                </NextHeaderPrompt>
            </Fragment>
        );
    },

    /*
    * select demo x
    */
    [OnboardingStepTypes.SELECT_DEMO_X]: () => {
        const dispatch = useAppDispatch();
        const onDemoSubmit = (demographic: ObservationDemographics) => {
            dispatch(setPrimaryFilterDemographic({ demographic }));
            dispatch(nextOnboardingStep());
        }
        return (
            <Fragment>
                <SimpleHeaderTitle>
                    Select a demographic.
                </SimpleHeaderTitle>

                <Typography variant='h4'>
                    Now, let’s make things more interesting. 
                    I listed below a list of characteristics we can split the population by. Select one of them
                    and let's see how people's opinion changes withing each group.
                </Typography>

                <Box display='flex' flexDirection='row' width='100%' mt={4}>
                    <DemographicView axis='x' onSubmit={onDemoSubmit} />
                </Box>
            </Fragment>
        );
    },

    /*
    * visualize demo x
    */
    [OnboardingStepTypes.VIZ_DEMO_X]: () => {
        return (
            <Fragment>
                <TitleSelector primaryDemographic />

                <NextHeaderPrompt>
                    <Typography variant='h4' display='inline' >
                        Feel free to play with the filters above.
                        When you’re ready to take it to the next level, click next.
                    </Typography>
                </NextHeaderPrompt>
            </Fragment>
        );
    },

    /*
    * select demo y
    */
    [OnboardingStepTypes.SELECT_DEMO_Y]: () => {
        const dispatch = useAppDispatch();
        const onDemoSubmit = (demographic: ObservationDemographics) => {
            dispatch(setSecondaryFilterDemographic({ demographic }));
            dispatch(nextOnboardingStep());
        }
        return (
            <Fragment>
                <SimpleHeaderTitle>
                    One more thing.
                </SimpleHeaderTitle>
                <Typography variant='h4'>
                    Let’s make things a bit more complicated. Pick one more characteristic to break down the population by.
                </Typography>

                <Box display='flex' flexDirection='row' width='100%' mt={4}>
                    <DemographicView axis='y' onSubmit={onDemoSubmit} />
                </Box>
            </Fragment>
        );
    },


    /*
    * visualize demo y
    */
    [OnboardingStepTypes.VIZ_DEMO_Y]: () => {
        // for now, same as full viz
        return (
            <Fragment>
                <FullTitle />

                <NextHeaderPrompt nextLabel='Got it'>
                    <Typography variant='h4' display='inline' >
                        You made it to the end. Try to change country, values, demographics and understand how your values rank compared to others.
                    </Typography>
                </NextHeaderPrompt>
            </Fragment>
        );
    },

    /**
     * Full Viz 
     */
    [OnboardingStepTypes.COMPLETE_VIZ]: () => {
        return (
            <FullTitle />
        );
    },
}

