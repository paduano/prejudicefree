import React, { Fragment } from 'react';
import Typography from '@material-ui/core/Typography';
import { useAccentStyles } from './theme';
import { Box } from '@material-ui/core';
import { useAppDispatch, useAppSelector } from '../hooks';
import { nextOnboardingStep, setPrimaryFilterDemographic, setSecondaryFilterDemographic, updateValuesQuery } from '../store';
import { ObservationDemographics, ValuesMap, ValuesQuery } from '../observation';
import { color, colorGradientListCSS, FadeGradient } from './ui_utils';
import { CountrySelect, DemographicSelect, DemographicView, ValuesSelect, ValuesView } from './select';
import styles from '../../styles/titles.module.css'
import { getCurrentStep, NextOnboardingStepButton, OnboardingStepTypes } from '../onboarding';
import YouMarker from './you_marker';


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
        <Box display='flex' alignItems='center' pr={6} >
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
        <Box mb={1}>
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

                    Are you free to form your own beliefs?
                    <br />
                    Over the past 5 years 120,000 people were interviewed around the world about their opinions and values as part of the <i>World Values Survey</i>.
                    <br />
                    <br />

                    This website will take you through a short journey to show you how some socio-demographic factors, 
                    often outside our control, might affect how people around you think.
                    
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
                    Select a topic.
                </SimpleHeaderTitle>

                <Typography variant='h4'>
                    I listed below a number of things that people may find divisive or controversial. 
                    Pick the topic you'd like to dive in.
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
                    I colored them <span style={{ color: colorGradientListCSS(2) }}>{' '}●{' '}</span>blue if they answered that
                    they tolerate {vLabel} 7 or more, <span style={{ color: colorGradientListCSS(0) }}>{' '}●{' '}</span>red if they answered 4 or less,
                    <span style={{ color: colorGradientListCSS(1) }}>{' '}●{' '}</span>gray the rest. <br/>
                    <br />
                    Remember, the people on the screen are real people that answered the survey.
                    You can hover over them with the mouse cursor and read a bit about them on the right.
                </Typography>

                <NextHeaderPrompt>
                    <Typography variant='h4' display='inline' >
                        When you’re done fiddling around, click next and I'll try to bring some order on the screen!
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
                    The people are sorted according to their answer. <br/>
                    Where do you stand? You are marked with "<YouMarker />", and placed close to people that thinks similarly to you.
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
                    Now let’s make things more interesting. 
                    I listed below some characteristics we can split the population by. Select one of them
                    and see how people's opinions change within each group.
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
                        You made it to the end. Try to change country, topic, demographics and understand how your opinion compares to others.
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

