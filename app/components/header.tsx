import React, { Fragment, useState } from 'react';
import Typography from '@material-ui/core/Typography';
import { useAccentStyles } from './theme';
import { Box, useTheme } from '@material-ui/core';
import { useAppDispatch, useAppSelector } from '../hooks';
import { nextOnboardingStep, setPrimaryFilterDemographic, setSecondaryFilterDemographic, updateValuesQuery } from '../store';
import { getReadableDescriptionForDemographic, LATEST_WAVE, ObservationDemographics, ObservationDemographicsList, ValuesMap, ValuesQuery } from '../observation';
import { Button, FadeGradient, FadeInBoxWithDelay } from './ui_utils';
import { CountrySelect, DemographicSelect, DemographicView, ValuesSelect, ValuesView } from './select';
import styles from '../../styles/titles.module.css'
import { getCurrentStep, NextOnboardingStepButton, OnboardingStepTypes, PreviousOnboardingStepButton } from '../onboarding';
import YouMarker from './you_marker';
import { color, colorGradientListCSS } from './colors';
import { countryNameAppSelector, isLimitedWidthSelector } from '../selectors';
import { StoryContents } from './story';
import { WAVE_TO_YEAR } from '../data/legend';


export function FullTitle() {
    const theme = useTheme();
    const limitedWidth = isLimitedWidthSelector();
    const wave = useAppSelector(state => state.rawData.wave);

    const containerStyles = {
        textAlign: limitedWidth ? 'left' : 'center',
        width: '100%',
    } as any;
    return (
        <Box display='flex' style={containerStyles} flexDirection='column' zIndex='9'>
            <Box>
                <Typography variant='h1' >
                    What{' '}
                    <CountrySelect ml={1} mr={1} mb={0} height={theme.typography.h1.fontSize} />
                    {wave != LATEST_WAVE ? 'thought about' : 'thinks about'}
                    <ValuesSelect ml={1} variant='h1' height={theme.typography.h1.fontSize} />
                    {wave != LATEST_WAVE ? `(in ${WAVE_TO_YEAR[wave]})` : null}
                </Typography>
            </Box>
            <Box mt={1}>
                <Typography variant='h2' >
                    Broken down by{' '}
                    <DemographicSelect variant='h2' height={theme.typography.h2.fontSize} axis='x' />
                    {' '} and filtered by {' '}
                    <DemographicSelect variant='h2' height={theme.typography.h2.fontSize} axis='y' />
                </Typography>
            </Box>
        </Box>
    );
}

export const NextHeaderPrompt = (props: { children: JSX.Element | JSX.Element[] | string, nextLabel?: string, onNext?: () => void }) => {
    const limitedWidth = isLimitedWidthSelector();
    return (
        <Box display='flex' alignItems='center' flexWrap={limitedWidth ? 'wrap' : undefined} pr={!limitedWidth ? 6 : 0} >
            {props.children}
            <Box flexGrow={1} />
            <NextOnboardingStepButton display='inline-block' nextLabel={props.nextLabel} onNext={props.onNext} />
        </Box>
    )
}

export const SimpleHeaderTitle = (props: { children: string }) => {
    const classes = useAccentStyles();
    const style = {
        marginBottom: '0.25rem',
    }
    return (
        <Typography variant='h2' className={classes.accentText} style={style}>
            <b>{props.children}</b>
        </Typography>
    )
}

// const SimpleHeaderSubtitle = (props: { children: string }) => {
//     const classes = useAccentStyles();
//     return (
//         <Typography variant='h4'>
//             {props.children}
//         </Typography>
//     )
// }

export const TitleSelector = (props: { primaryDemographic?: boolean, secondaryDemographic?, center?: boolean}) => {
    const classes = useAccentStyles();
    const limitedWidth = isLimitedWidthSelector();
    const wave = useAppSelector(state => state.rawData.wave);
    const theme = useTheme();
    return (
        <Box mb={1}>
            <Box display='flex' 
                alignItems='center' 
                flexWrap='wrap' 
                justifyContent={props.center && !limitedWidth ? 'center' : undefined}>
                <Typography variant='h2' display='inline' className={classes.accentText}> <b>What{' '}</b> </Typography>
                <CountrySelect ml={1} mr={1} mb={0} height={theme.typography.h2.fontSize} />
                <Typography variant='h2' display='inline' className={classes.accentText}>
                    <b>{wave != LATEST_WAVE ? 'thought about' : 'thinks about'}{'\u00A0'}</b>
                </Typography>
                <ValuesSelect variant='h2' mr={1} mb={0} accent height={theme.typography.h2.fontSize} />
                <Typography variant='h2' display='inline' className={classes.accentText}>
                    {wave != LATEST_WAVE ? `in ${WAVE_TO_YEAR[wave]}` : null}
                </Typography>
            </Box>
            {props.primaryDemographic || props.secondaryDemographic ? (
                <Box mt={1} display='flex' flexDirection={limitedWidth ? 'column' : 'row'} 
                    justifyContent={props.center && !limitedWidth ? 'center' : undefined}>
                    <Box display='flex' alignItems='center'>
                        {/* primary */}
                        <Typography variant='h4' >
                            <b>Broken down by{' '}</b>
                        </Typography>
                        <DemographicSelect variant='h4' axis='x' ml={1} mr={1} height={theme.typography.h2.fontSize} />
                    </Box>


                    <Box display='flex' alignItems='center'>
                        {/* secondary */}
                        {props.secondaryDemographic ? (
                            <Fragment>
                                <Typography variant='h4' >
                                    <b>and filtered by</b>
                                </Typography>
                                <DemographicSelect variant='h4' axis='y' ml={1} height={theme.typography.h2.fontSize} />
                            </Fragment>
                        ) : null}
                    </Box>
                </Box>
            ) : null}
        </Box>
    )
}

export const STORY_WIDTH = 800;
export function Header() {
    const limitedWidth = isLimitedWidthSelector();
    const onboardingStep = useAppSelector(getCurrentStep);

    const params = HeaderParams[onboardingStep.type] || {};

    // const headerBaseHeight = limitedWidth && params.headerMaxHeightForLimitedWidth ? undefined : '7rem';
    const headerBaseHeight = '4rem';
    const outerContainerStyle = {
    }
    const innerContainerStyle = {
        backgroundColor: color.backgroundWithOpacity,
    }
    const content = StoryContents[onboardingStep.type];

    const HeaderContent = content.header as any;
    const Story = content.story as any;
    if (!HeaderContent) {
        throw `no header defined for step ${onboardingStep.type}`;
    }

    return (
        <Box
            id='title-outer-container'
            zIndex={10}
            style={outerContainerStyle}
            height={headerBaseHeight}
            alignItems={limitedWidth ? 'flex-start' : 'center'}
        >
            <Box
                id='title-inner-container'
                position='relative'
                margin={limitedWidth ? 0 : 'auto'}
                p={limitedWidth ? 2 : 0}
                style={innerContainerStyle}
                minHeight={headerBaseHeight}
                width={limitedWidth ? '100%' : STORY_WIDTH}
            >
                <HeaderContent />
                {content.storyPosition == 'top' ? <Story /> : null}
                {/* <div style={backStyle}></div> */}
            </Box>
            {/* { headerBaseHeight == undefined ? null :
                <FadeGradient width={limitedWidth ? '100%' : STORY_WIDTH} margin='auto' destinationColor={color.backgroundWithOpacity} orientation='top' />
            } */}
        </Box>
    );
}


export function StoryContent() {
    const limitedWidth = isLimitedWidthSelector();
    const onboardingStep = useAppSelector(getCurrentStep);
    const params = HeaderParams[onboardingStep.type] || {};

    const outerContainerStyle = {
    }
    const innerContainerStyle = {
        backgroundColor: color.backgroundWithOpacity,
    }
    const content = StoryContents[onboardingStep.type];


    const Story = content.story as any;

    return (
        <Box
            id='story-outer-container'
            zIndex={10}
            style={outerContainerStyle}
            alignItems={limitedWidth ? 'flex-start' : 'center'}
        >

            <Box
                id='story-inner-container'
                position='relative'
                margin={limitedWidth ? 0 : 'auto'}
                p={limitedWidth ? 2 : 0}
                style={innerContainerStyle}
                width={limitedWidth ? '100%' : STORY_WIDTH}
                mb={4}
            >
                {!content.hideNextButton ? <Box display='flex' flexDirection='row'>
                    <PreviousOnboardingStepButton display='inline-block' />
                    <Box flex={1}></Box>
                    <NextOnboardingStepButton display='inline-block' />
                </Box> : null}
                {Story && content.storyPosition != 'top' ? <Story /> : null}
            </Box>
        </Box>
    );
}


const HeaderParams = {
    [OnboardingStepTypes.VIZ_RANDOM]: {
        headerMaxHeightForLimitedWidth: true,
    },
    [OnboardingStepTypes.VIZ_ONE_GROUP]: {
        headerMaxHeightForLimitedWidth: true,
    },
    // [OnboardingStepTypes.VIZ_DEMO_X]: {
    //     headerMaxHeightForLimitedWidth: true,
    // },
    // [OnboardingStepTypes.VIZ_DEMO_Y]: {
    //     headerMaxHeightForLimitedWidth: true,
    // },
    [OnboardingStepTypes.COMPLETE_VIZ]: {
        headerMaxHeightForLimitedWidth: true,
    }
}

