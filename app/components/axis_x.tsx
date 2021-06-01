import React, { Fragment, useEffect } from 'react';
import Typography from '@material-ui/core/Typography';
import { Box } from '@material-ui/core';
import { useAppDispatch, useAppSelector } from '../hooks';
import { getReadableDescriptionForDemographic, getReadableDescriptionForGroupValue, groupsForDemographic } from '../observation';
import { GroupLayoutInfo } from './viz/grid_viz_configs';
import styles from '../../styles/chart_annotation.module.css'
import classNames from 'classnames/bind';
import { ChartAnnotationWrapper } from './chart_annotation_wrapper';
import { updateWhenViewportChanges } from './ui_utils';
import { isLimitedWidthSelector } from '../selectors';
import { isFeatureAvailableSelector } from '../onboarding';
import { LATEST_WAVE } from '../data/legend';

interface Props {
    groupLayoutInfo: GroupLayoutInfo;
    getAnnotationPos: (x: number, y: number) => { x: number, y: number },
    getSizeTransform: (v: number) => number,
}

export const AxisX = React.memo((props: Props) => {
    const limitedWidth = isLimitedWidthSelector();
    const { groupLayoutInfo, getAnnotationPos, getSizeTransform } = props;
    const demo = useAppSelector(state => {
        return state.rawData.primaryFilterDemographic;
    });

    updateWhenViewportChanges();
    // console.count('render axis');

    const currentRow = useAppSelector(state => {
        return state.rawData.currentRow
    });
    const currentWave = useAppSelector(state => {
        return state.rawData.wave;
    });
    const featureShowBirthYear = useAppSelector(isFeatureAvailableSelector('show_birth_year'));
    const isPast = LATEST_WAVE != currentWave || featureShowBirthYear;

    const getSegmentPos = (groupIndex: number) => {
        const x3d = groupLayoutInfo.groupPosX[groupIndex][currentRow];
        return getAnnotationPos(x3d, groupLayoutInfo.groupPosY[groupIndex][currentRow]);
    }
    const getSegmentWidth = (groupIndex: number) => getSizeTransform(groupLayoutInfo.rectWidths[groupIndex][currentRow]);
    const getSegmentHeight = (groupIndex: number) => getSizeTransform(groupLayoutInfo.rectHeights[groupIndex][currentRow]);

    const xSegments = groupLayoutInfo.groupPosX.map((_label, groupIndex) => {
        const { x, y } = getSegmentPos(groupIndex);
        const width = getSegmentWidth(groupIndex);
        const height = getSegmentHeight(groupIndex);
        const segmentStyle = {
            left: x,
            top: y,
            width,
        };
        const borderStyle = '1px solid #FFFFFF';
        const squareStyle = {
            borderBottom: borderStyle,
            height: '20px',
        };

        let noData = null;
        if (groupLayoutInfo.totalObservations[groupIndex][currentRow] == 0) {
            const whiteColor = "rgba(255, 255, 255, 0.3)";
            const noDataStyle = {
                backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 10px, ${whiteColor} 10px, ${whiteColor} 12px)`
            }
            noData =
                <Box position='absolute' display='flex' alignItems='center' justifyContent='center' key={`no-data-${groupIndex}`}
                    left={x} top={y - height} height={height} width={width} style={noDataStyle}>
                    <Typography variant='h5'>No data</Typography>
                </Box>
        }
        return (
            <Fragment key={`fragment-${groupIndex}`}>
                {noData}
                <Box pt={limitedWidth ? 0 : 2} position='absolute' display='flex' flexDirection='column' style={segmentStyle} key={`axis-x-segment-${groupIndex}`}>
                    <div style={squareStyle}></div>
                    <Box mt={1}>
                        <Typography align='center' variant='h5'>
                            {getReadableDescriptionForGroupValue(demo, groupIndex, isPast)}
                        </Typography>
                    </Box>
                </Box>
            </Fragment>
        )
    });

    const lastGroupIndex = groupLayoutInfo.groupPosX.length - 1;
    const lastSegmentPos = getSegmentPos(lastGroupIndex);
    const width = getSegmentWidth(lastGroupIndex);
    const legendTitleStyle = {
        left: lastSegmentPos.x + width + (limitedWidth ? 0 : 20),
        top: lastSegmentPos.y + 20 + (limitedWidth ? 30 : 0),
        transform: limitedWidth ? 'translateX(-100%)' : undefined,
    }
    const legendTitle = (
        <Box position='absolute' style={legendTitleStyle}>
            <Typography align='center' variant='h3' noWrap={limitedWidth}>
                {getReadableDescriptionForDemographic(demo, isPast).toUpperCase()}
            </Typography>
        </Box>
    );

    return (
        <ChartAnnotationWrapper hideDuringAnimation position='absolute' display='flex' flexDirection='column' >
            <Box position='relative'>
                {xSegments}
                {legendTitle}
            </Box>
        </ChartAnnotationWrapper>
    )
});

