import React, { useEffect, useRef } from 'react';
import Typography from '@material-ui/core/Typography';
import { Box } from '@material-ui/core';
import { useAppDispatch, useAppSelector } from '../hooks';
import { nextOnboardingMessage, setCurrentRow, setOnboardingObjectPositions } from '../store';
import { getReadableDescriptionForDemographic, getReadableDescriptionForGroupValue, groupsForDemographic } from '../observation';
import { GroupLayoutInfo } from './viz/grid_viz_configs';
import styles from '../../styles/chart_annotation.module.css'
import classNames from 'classnames/bind';
import { throttle } from 'throttle-debounce';

import { Plus } from './plus';
import { Minus } from './minus';
import { ChartAnnotationWrapper } from './chart_annotation_wrapper';
import { getCurrentOnboardingMessageSelector } from '../onboarding';
import { isLimitedWidthSelector } from '../selectors';

interface Props {
    groupLayoutInfo: GroupLayoutInfo;
    getAnnotationPos: (x: number, y: number) => { x: number, y: number },
    getSizeTransform: (v: number) => number,
}

export const AxisY = React.memo((props: Props) => {
    const limitedWidth = isLimitedWidthSelector();
    const { groupLayoutInfo, getAnnotationPos, getSizeTransform } = props;
    const dispatch = useAppDispatch()
    const demo = useAppSelector(state => {
        return state.rawData.secondaryFilterDemographic;
    });
    const currentRow = useAppSelector(state => {
        return state.rawData.currentRow
    });
    const currentOnboardingMessage = useAppSelector(getCurrentOnboardingMessageSelector);

    const demoGroups = groupsForDemographic(demo);
    const getSegmentPos = () => {
        if (limitedWidth) {
            return {
                x: 0,
                y: 48,
            }
        } else {
            const y3d = groupLayoutInfo.groupPosY[0][currentRow] + groupLayoutInfo.rectHeights[0][currentRow];
            return getAnnotationPos(groupLayoutInfo.groupPosX[0][currentRow], y3d);
        }
    }
    const getSegmentHeight = () => getSizeTransform(groupLayoutInfo.rectHeights[0][currentRow]);
    const { x, y } = getSegmentPos();


    // legend

    const legendTitleStyle = {
    };
    const legendTitle = (
        <Box style={legendTitleStyle} mr={limitedWidth ? 1 : 0}>
            <Typography align='left' variant='h3'>
                {getReadableDescriptionForDemographic(demo).toUpperCase()}
            </Typography>
        </Box>
    );


    // square

    const borderStyle = '1px solid #FFFFFF';
    const squareStyle = {
        borderBottom: borderStyle,
        borderTop: borderStyle,
        borderLeft: borderStyle,
        width: '20px',
        height: '100%',
    };
    const squareDiv = <div style={squareStyle}></div>


    // plus buttons
    const plusButtonEnabled = currentRow < demoGroups.length - 1;
    const minusButtonEnabled = currentRow > 0;

    const buttonStyle = (enabled: boolean, position: 'top' | 'bottom') => {
        const buttonTransform = position == 'top' ? 'translateY(-100%)' : 'translateY(100%)';
        return {
            cursor: 'pointer',
            position: 'absolute',
            top: 0,
            left: position == 'top' ? 0 : undefined,
            bottom: position == 'bottom' ? 0 : undefined,
            width: '100%',
            transform: buttonTransform,
        } as any;
    };

    const increaseRow = () => {
        if (currentOnboardingMessage && currentOnboardingMessage.anchor == 'plusButton') {
            dispatch(nextOnboardingMessage());
        }
        if (plusButtonEnabled) {
            dispatch(setCurrentRow({ row: currentRow + 1 }));
        }
    } 
    const decreaseRow = minusButtonEnabled ? () => dispatch(setCurrentRow({ row: currentRow - 1 })) : () => {};

    // update onboarding position
    const plusRef = useRef(null);
    const dispatchNewPlusButtonPosition = throttle(1000, false /* no trailing */, (pos: THREE.Vector3) => {
        if (plusRef.current) {
            const rect = plusRef.current.getBoundingClientRect();
            dispatch(setOnboardingObjectPositions({plusButton: {left: rect.left + 40, top: rect.top}}));
        }
    });

    useEffect(() => {
        dispatchNewPlusButtonPosition();
        setTimeout(dispatchNewPlusButtonPosition, 2000); // hack, should I repeat this?
    }, [plusRef]);

    const clsPlus = classNames(styles.axisButton, {[styles.buttonDisabled]: !plusButtonEnabled});
    const clsMinus = classNames(styles.axisButton, { [styles.buttonDisabled]: !minusButtonEnabled});
    const refTSHACK = { ref: plusRef};
    const plusButton = (
        <Box className={clsPlus} display='flex' justifyContent='center' onClick={increaseRow} style={buttonStyle(plusButtonEnabled, 'top')} {...refTSHACK}>
            <Plus />
        </Box>
    )

    const minusButton = (
        <Box className={clsMinus} display='flex' justifyContent='center' onClick={decreaseRow} style={buttonStyle(minusButtonEnabled, 'bottom')}>
            <Minus />
        </Box>
    )

    // segment

    const segmentStyle = {
        left: limitedWidth ? undefined : x,
        right: limitedWidth ? 0 : undefined,
        top: y,
        transform: limitedWidth ? '' : 'translateX(-100%)',
        height: limitedWidth ? undefined : getSegmentHeight(),
    };

    let ySegment = (
        <Box pr={2} position='absolute' style={segmentStyle} key={`axis-y-segment`}>
            {/* buttons container */}
            <Box position='relative' display='flex' flexDirection='row' height='100%'>
                {plusButton}
                {minusButton}
                {/* legend */}
                <Box pr={2} display='flex' flexDirection={limitedWidth ? 'row' : 'column'} justifyContent='center' minWidth='100px'>
                    {legendTitle}
                    <Typography align='left' variant='h5' noWrap>
                        {getReadableDescriptionForGroupValue(demo, currentRow)}
                    </Typography>
                </Box>
                {limitedWidth ? null : squareDiv}
            </Box>
        </Box>
    );

    // if (limitedWidth) {
    //     ySegment = (
    //         <Box display='flex'>
    //             {legendTitle}:
    //             <Typography align='left' variant='h5'>
    //                 {getReadableDescriptionForGroupValue(demo, currentRow)}
    //             </Typography>
    //         </Box>
    //     );
    // }
    return (
        <ChartAnnotationWrapper position='absolute' display='flex' flexDirection='column' width='100%' >
            <Box position='relative'>
                {ySegment}
            </Box>
        </ChartAnnotationWrapper>
    )
});

