import { nextOnboardingStep, RootState, StoreState } from "./store";
import classNames from 'classnames/bind';
import { useAppDispatch, useAppSelector } from "./hooks";
import { Button, FadeInBox } from './components/ui_utils';
import { Box, BoxProps, Typography } from "@material-ui/core";
import { DotsUniformConfig, DotsTestMultiGroup } from "./components/viz/grid_viz_configs";
import React, { useEffect, useRef, useState } from "react";

export enum OnboardingStepTypes {
    SELECT_COUNTRY = 1,
    SELECT_VALUE = 2,
    VIZ_RANDOM = 3,
    VIZ_ONE_GROUP = 4,
    SELECT_DEMO_X = 5,
    VIZ_DEMO_X = 6,
    SELECT_DEMO_Y = 7,
    VIZ_DEMO_Y = 8,
    COMPLETE_VIZ = 100,
}

export type OnboardingMessage = {
    type: OnboardingMessagesTypes,
    text: string;
    anchor: keyof OnboardingObjectPositions,
};

export type OnboardingMessagesTypes = 
    'DRAG_AND_DROP_YOURSELF' |
    'CHANGE_SECONDARY_DEMOGRAPHIC';


export interface OnboardingObjectPositions {
    yourself?: {left: number, top: number};
    plusButton?: {left: number, top: number};
}

type Features = 
    'charts' | 
    'yourself_info' | 
    'side_panel' |
    'legend' | 
    'colored_men' |
    'remove_demographic_button'
    ;

export interface Step {
    type: OnboardingStepTypes,
}

type OnboardingStep = {
    type: OnboardingStepTypes,
    messages?: OnboardingMessage[],
}

export const ONBOARDING_STEPS_LIST: OnboardingStep[] = [
    // intro and select country
    {
        type: OnboardingStepTypes.SELECT_COUNTRY,
    },

    // select value
    {
        type: OnboardingStepTypes.SELECT_VALUE,
    },

    // viz random
    {
        type: OnboardingStepTypes.VIZ_RANDOM,
    },

    // one group
    {
        type: OnboardingStepTypes.VIZ_ONE_GROUP,
    },

    // select demographic X
    {
        type: OnboardingStepTypes.SELECT_DEMO_X,
    },

    // 5. select demographic X
    {
        type: OnboardingStepTypes.VIZ_DEMO_X,
        messages: [
            {
                type: 'DRAG_AND_DROP_YOURSELF',
                text: `
                    Drag the men representing yourself in a column, the "about you" section will update to reflect
                    how your answer compares to people in the same demographic
                    `,
                anchor: 'yourself', 
            }
        ],
    },

    // 6. select demographic Y
    {
        type: OnboardingStepTypes.SELECT_DEMO_Y,
    },

    // 7. visualize demographic Y
    {
        type: OnboardingStepTypes.VIZ_DEMO_Y,
        messages: [
            {
                type: 'CHANGE_SECONDARY_DEMOGRAPHIC',
                text: `
                    Click on the arrow to change ... bla bla bla 
                    `,
                anchor: 'plusButton', 
            }
        ],
    },

    // 8. full viz is available to the user
    {
        type: OnboardingStepTypes.COMPLETE_VIZ,
    },
];

// ----------------
// selectors and helper functions
// ----------------


export const getCurrentStep = (state: RootState) => {
    return ONBOARDING_STEPS_LIST[state.rawData.currentOnboardingStepIndex];
}

export function isFeatureAvailableSelector(feature: Features) {
    return (state: RootState): boolean => isFeatureAvailableAtStep(
        getCurrentStep(state).type,
        feature,
    );
}

export function getCurrentVizConfigSelector(state: RootState) {
    const step = getCurrentStep(state);
    if (step.type < OnboardingStepTypes.VIZ_ONE_GROUP) {
        return DotsUniformConfig;
    } else {
        return DotsTestMultiGroup;
    }
}


export function getCurrentOnboardingMessageSelector(state: RootState): null|OnboardingMessage {
    const step = getCurrentStep(state);
    const messageStep = state.rawData.currentOnboardingMessageStepIndex;
    if (step.messages && messageStep != null && messageStep < step.messages.length) {
        return step.messages[messageStep];
    } else {
        return null;
    }
}


export function isFeatureAvailableAtStep(onboardingStepType: OnboardingStepTypes, feature: Features) {
    switch (feature) {
        case 'yourself_info':
            if (onboardingStepType < OnboardingStepTypes.VIZ_RANDOM) {
                return false;
            } else {
                return true;
            }
        case 'colored_men':
        case 'legend':
            if (onboardingStepType < OnboardingStepTypes.VIZ_RANDOM) {
                return false;
            } else {
                return true;
            }
        case 'charts':
            if (onboardingStepType < OnboardingStepTypes.VIZ_ONE_GROUP) {
                return false;
            } else {
                return true;
            }
        case 'remove_demographic_button':
            if (onboardingStepType < OnboardingStepTypes.VIZ_DEMO_Y) {
                return false;
            } else {
                return true;
            }
        case 'side_panel':
            if ([OnboardingStepTypes.SELECT_DEMO_X, OnboardingStepTypes.SELECT_DEMO_Y].indexOf(onboardingStepType) == -1) {
                return false;
            } else {
                return true;
            }

        default:
            return true;
    }
}


// ----------------
// helper components
// ----------------

export const NextOnboardingStepButton = (props: BoxProps & { nextLabel?: string}) => {
    const { nextLabel, ...rest} = props;
    const dispatch = useAppDispatch();
    const handleOk = (evt) => {
        dispatch(nextOnboardingStep());
    };
    return <Button accent label={nextLabel || 'Next ›'} select={false} onClick={handleOk} {...rest} />
}


export const FocusOverlay = () => {
    const currentMessage = useAppSelector(getCurrentOnboardingMessageSelector);
    const usedMessageRef = useRef<OnboardingMessage>();

    const [isVisible, setVisible] = useState<boolean>(false);

    useEffect(() => {
        if (usedMessageRef.current != currentMessage) {
            usedMessageRef.current = currentMessage;
            setTimeout(() => {
                setVisible(true);
            }, 4000);
        }

        // if we close the focus, reset the ui visible state
        if (!currentMessage && isVisible) {
            setVisible(false);
        }
    });

    const containerStyles = {
        pointerEvents: 'none',
        zIndex: 20,
    } as any;

    return (
        <Box position='absolute' width='100%' height='100%' style={containerStyles}>
            <FadeInBox visible={isVisible} position='relative' width='100%' height='100%'>
                {currentMessage ? <FocusOverlayMessage message={currentMessage} /> : null}
            </FadeInBox>
        </Box>
    )
}

function FocusOverlayMessage(props: { message: OnboardingMessage }) {
    const { anchor, text } = props.message;
    const objPositions = useAppSelector(state => {
        return state.rawData.onboardingObjectPositions;
    });
    let left = objPositions[anchor] ? objPositions[anchor].left : 0;
    let top = objPositions[anchor] ? objPositions[anchor].top : 0;
    let width = 150;
    let height = 150;
    const isCircle = true;

  const holeContainerStyles = {
        top,
        left,
        position: 'absolute',
        boxShadow: `0 0 0 99999px rgba(0, 0, 0, .8)`,
        width,
        height,
        borderRadius: isCircle ? width + 'px' : '0px',
        border: '1px solid white',
        transform: 'translateX(-50%) translateY(-50%)'
    } as any;

    const messageStyle = {
        margin: 'auto',
        marginTop: height + 10,
    };  

    return (
        <div id='hole' style={holeContainerStyles}>
            <div style={messageStyle}>
                <Typography variant='h3'>
                    {text}
                </Typography>
            </div>
        </div>
    );
}