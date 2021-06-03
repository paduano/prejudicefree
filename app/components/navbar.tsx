import { Box, Link, Typography } from "@material-ui/core";
import React from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { OnboardingStepTypes, ONBOARDING_STEPS_LIST } from "../onboarding";
import { restartOnboarding, skipOnboarding } from "../store";
import { useAccentStyles } from "./theme";

export function NavBar(props: { current: 'viz' | 'about', height: string }) {
    const { current, height } = props;
    const classes = useAccentStyles();
    const dispatch = useAppDispatch();
   
    const onboardingStepIndex = useAppSelector(state => state.rawData.currentOnboardingStepIndex);
    const onboardingStep = ONBOARDING_STEPS_LIST[onboardingStepIndex];
    const isCompleteViz = onboardingStep && onboardingStep.type == OnboardingStepTypes.COMPLETE_VIZ;

    const handleSkipIntro = () => {
        dispatch(skipOnboarding());
    }
    const handleRestartIntro = () => {
        dispatch(restartOnboarding());
    }

    return (
        <Box display='flex' height={height || '2rem'} pt={2} pr={2} pl={2}>
            <Typography variant='h3'>
            </Typography>

            {current != 'viz' ? (
            <Box mr={2}>
                <Typography variant='h3'>
                    <Link color='inherit' href='/'> Back to the viz </Link>
                </Typography>
            </Box>
            ) : null}

            {current == 'viz' && !isCompleteViz ? (
            <Box mr={2}>
                <Typography variant='h3'>
                        <Link color='inherit' href='#' onClick={handleSkipIntro}> Skip the intro </Link>
                </Typography>
            </Box>
            ) : null}

            {current == 'viz' && isCompleteViz ? (
                <Box mr={2}>
                    <Typography variant='h3'>
                        <Link color='inherit' href='#' onClick={handleRestartIntro}> Restart the intro </Link>
                    </Typography>
                </Box>
            ) : null}

            <Box flexGrow='1'></Box>
        
            <Box mr={2}>
                <Typography variant='h3'>
                    <Link color='inherit' href='https://twitter.com/null_js'> Twitter </Link>
                </Typography>
            </Box>

            <Typography variant='h3'>
                |
            </Typography>

            <Box mr={2} ml={2}>
                <Typography variant='h3'>
                    <Link color='inherit' href='https://github.com/paduano/prejudicefree'> Github </Link>
                </Typography>
            </Box>

            <Typography variant='h3'>
                |
            </Typography>

            <Box ml={2}>
                <Typography  variant='h3' className={current == 'about' ? classes.accentText : ''}>
                    <Link color='inherit' href='/about'> About </Link>
                </Typography>
            </Box>
        </Box>
    );
}