import React, { useEffect } from 'react';
import Typography from '@material-ui/core/Typography';
import { Box } from '@material-ui/core';
import { useAppDispatch, useAppSelector } from '../hooks';
import { getReadableDescriptionForDemographic, getReadableDescriptionForGroup, groupsForDemographic } from '../observation';
import { GroupLayoutInfo } from './viz/grid_viz_configs';
import styles from '../../styles/axis.module.css'
import classNames from 'classnames/bind';

interface Props {
    groupLayoutInfo: GroupLayoutInfo;
    getAnnotationPos: (x: number, y: number) => {x: number, y: number},
    getSizeTransform: (v: number) => number,
}

export const AxisX = React.memo((props: Props) => {
    const { groupLayoutInfo, getAnnotationPos, getSizeTransform} = props;
    const dispatch = useAppDispatch()
    const demo = useAppSelector(state => {
        return state.rawData.primaryFilterDemographic;
    });
    const animationInProgress = useAppSelector(state => {
        return state.rawData.animationInProgress;
    });

    const demoGroups = groupsForDemographic(demo);

    console.count('render');

   
    const currentRow = useAppSelector(state => {
        return state.rawData.currentRow
    });

    const getSegmentPos = (groupIndex: number) => {
        const x3d = groupLayoutInfo.groupPosX[groupIndex][currentRow];
        return getAnnotationPos(x3d, groupLayoutInfo.groupPosY[groupIndex][currentRow]);
    }
    const getSegmentWidth = (groupIndex: number) => getSizeTransform(groupLayoutInfo.rectWidths[groupIndex][currentRow]);

    const xSegments = groupLayoutInfo.groupPosX.map((_label, groupIndex) => {
        const { x, y } = getSegmentPos(groupIndex);
        const width = getSegmentWidth(groupIndex);
        const segmentStyle = {
            left: x,
            top: y,
            width,
        };
        const borderStyle = '1px solid #FFFFFF';
        const squareStyle =  {
            borderBottom: borderStyle,
            // borderLeft: borderStyle,
            // borderRight: borderStyle,
            height: '20px',
        };
        return (
            <Box pt={2} position='absolute' display='flex' flexDirection='column' style={segmentStyle} key={`axis-x-segment-${groupIndex}`}>
                <div style={squareStyle}></div>
                <Box mt={1}>
                    <Typography align='center' variant='h5'>
                        {getReadableDescriptionForGroup(demo, groupIndex)}
                    </Typography>
                </Box>
            </Box>
        )
    });

    const lastGroupIndex = groupLayoutInfo.groupPosX.length - 1;
    const lastSegmentPos = getSegmentPos(lastGroupIndex);
    const width = getSegmentWidth(lastGroupIndex);
    const legendTitleStyle = {
        left: lastSegmentPos.x + width + 20, 
        top: lastSegmentPos.y + 20,
    }
    const legendTitle = (
        <Box position='absolute' style={legendTitleStyle}>
            <Typography align='center' variant='h3'>
                {getReadableDescriptionForDemographic(demo).toUpperCase()}
            </Typography>
        </Box>
    );

    const clsAxis = classNames(styles.axis, {
        [styles.axisHidden]: animationInProgress,
        [styles.axisTransitionProperties]: !animationInProgress, // since the fade out makes the animation jump
    });

    const wrapperStyles = {
        left: 0,
        top: 0,
        pointerEvents: 'none',
        color: 'white'
    } as any;

    return (
        <Box className={clsAxis} position='absolute' display='flex' flexDirection='column' style={wrapperStyles} >
            <Box position='relative'>
                {xSegments}
                {legendTitle}
            </Box>
        </Box>
    );
});

