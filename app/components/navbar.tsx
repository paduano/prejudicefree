import { Box, Link, Typography } from "@material-ui/core";
import React, { Fragment } from "react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { OnboardingStepTypes, ONBOARDING_STEPS_LIST } from "../onboarding";
import { isLimitedWidthSelector } from "../selectors";
import { restartOnboarding, skipOnboarding } from "../store";
import { useAccentStyles } from "./theme";
import { Button } from "./ui_utils";

export function NavBar(props: { current: 'viz' | 'about', height: string }) {
    const { current, height } = props;
    const classes = useAccentStyles();
    const dispatch = useAppDispatch();
    const limitedWidth = isLimitedWidthSelector();

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
                        <Link color='inherit' href='/'> Back to the site </Link>
                    </Typography>
                </Box>
            ) : null}

            {current == 'viz' && !isCompleteViz ? (
                <Box mr={2}>
                    {/* <Button select={false} small label="Skip the intro" frame onClick={handleSkipIntro}></Button> */}
                    <Typography variant='h3'>
                        <Link color='inherit' href='#' onClick={handleSkipIntro}> ► Skip the intro </Link>
                    </Typography>
                </Box>
            ) : null}

            {current == 'viz' && isCompleteViz ? (
                <Box mr={2}>
                    <Typography variant='h3'>
                        <Link color='inherit' href='#' onClick={handleRestartIntro}> ◂ Restart the intro </Link>
                    </Typography>
                </Box>
            ) : null}

            <Box flexGrow='1'></Box>

            {limitedWidth ? null : (
                <Fragment>
                    <Box mr={2}>
                        <Typography variant='h3'>
                            <Link color='inherit' target="_blank" href='https://twitter.com/null_js'> Twitter </Link>
                        </Typography>
                    </Box>

                    <Typography variant='h3'> | </Typography>

                    <Box mr={2} ml={2}>
                        <Typography variant='h3'>
                            <Link color='inherit' target="_blank" href='https://github.com/paduano/prejudicefree'> Github </Link>
                        </Typography>
                    </Box>

                    <Typography variant='h3'> | </Typography>
                </Fragment>
            )}

            <Box ml={2}>
                <Typography variant='h3' className={current == 'about' ? classes.accentText : ''}>
                    <Link color='inherit' href='/about'> About </Link>
                </Typography>
            </Box>
        </Box>
    );
}