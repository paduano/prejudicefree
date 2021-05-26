import React from 'react';
import { Box, useTheme } from '@material-ui/core';
import { useAppSelector } from '../hooks';
import { groupsForDemographic } from '../observation';
import { GroupLayoutInfo } from './viz/grid_viz_configs';
import styles from '../../styles/chart_annotation.module.css'
import classNames from 'classnames/bind';
import { formatPercent } from '../data/format';
import { ChartAnnotationWrapper } from './chart_annotation_wrapper';
import { colorGradientList, colorGradientListCSS } from './colors';

interface Props {
    groupLayoutInfo: GroupLayoutInfo;
    getAnnotationPos: (x: number, y: number) => { x: number, y: number },
    getSizeTransform: (v: number) => number,
}

function renderBarChart(props: { x: number, y: number, height: number, percentages: number[], direction: 'h' | 'v', key }) {
    const { x, y, height, percentages, direction, key } = props;
    const isVertical = direction == 'v';
    const isHorizontal = direction == 'h';
    const theme = useTheme();

    const bars = []
    for (let i = percentages.length - 1; i >= 0; i--) {
        const percent = percentages[i];
        const color = colorGradientListCSS(i);
        const paddingBetweenLines = 2;
        const long = `calc(${percent * 100}% - ${paddingBetweenLines}px)`;

        const percentBlock = <Box ml='4px'>
            <div className={styles.barchartPercentNumber} 
                style={{ 
                    color: color,
                    fontSize: theme.typography.h3.fontSize }
                }>
                {formatPercent(percent)}
            </div>
        </Box>

        const barStyle = {
            height: isVertical ? long : '100%',
            width: isVertical ? '100%' : long,
            marginTop: isVertical ? paddingBetweenLines : null,
            marginLeft: isHorizontal ? paddingBetweenLines : null,
            boxSizing: 'border-box',
            position: 'relative',
            borderLeft: isVertical ? `3px solid ${color}` : null,
            borderTop: isHorizontal ? `3px solid ${color}` : null,
            float: isHorizontal ? 'right' : null,
        } as any;
        bars.push(
            <div style={barStyle} key={`bar-${i}`}>
                {percent > 0.04 ? percentBlock : null}
            </div>
        );
    }

    const marginFromGroup = isVertical ? 8 : 16;
    const containerStyle = {
        position: 'absolute',
        height: isVertical ? height : undefined,
        width: isHorizontal ? height : undefined,
        left: x + (isVertical ? marginFromGroup : 0),
        top: y + (isHorizontal ? marginFromGroup : 0),
        // transform: 'translateY(-100%) translateX(-100%)'
        transform: isVertical ? 'translateY(-100%)' : null
    } as any;
    return (
        <div style={containerStyle} key={`barchart-${key}`}>
            {bars}
        </div>
    )
}

export const BarCharts = React.memo((props: Props) => {
    const { groupLayoutInfo, getAnnotationPos, getSizeTransform } = props;
    const demo = useAppSelector(state => {
        return state.rawData.primaryFilterDemographic;
    });
    const animationInProgress = useAppSelector(state => {
        return state.rawData.animationInProgress;
    });

    const demoGroups = demo ? groupsForDemographic(demo) : [0];
    const isVertical = demoGroups.length > 1;

    const currentRow = useAppSelector(state => {
        return state.rawData.currentRow
    });

    const getPos = (groupIndex: number) => {
        const x3d = groupLayoutInfo.groupPosX[groupIndex][currentRow];
        const w = isVertical ? groupLayoutInfo.rectWidths[groupIndex][currentRow] : 0;
        return getAnnotationPos(x3d + w, groupLayoutInfo.groupPosY[groupIndex][currentRow]);
    }

    const getHeight = (groupIndex: number) => getSizeTransform(groupLayoutInfo.rectHeights[groupIndex][currentRow]);
    const getWidth = (groupIndex: number) => getSizeTransform(groupLayoutInfo.rectWidths[groupIndex][currentRow]);

    const charts = demoGroups.map((_demo, i: number) => {
        const { x, y } = getPos(i);
        const length = isVertical ? getHeight(i) : getWidth(i);
        const N = groupLayoutInfo.totalObservations[i][currentRow];

        const percentages = colorGradientList.map((_, colorIndex) => {
            return N > 0 ? groupLayoutInfo.observationsByColorIndex[i][currentRow][colorIndex] / N : 0;
        })

        const direction = isVertical ? 'v' : 'h';

        return renderBarChart({ x, y, height: length, percentages, direction, key: i })
    });

    const wrapperStyles = {
        pointerEvents: 'none',
    } as any;

    return (
        <ChartAnnotationWrapper id='bar-charts' position='absolute' display='flex' flexDirection='column' style={wrapperStyles} >
            <Box position='relative'>
                {charts}
            </Box>
        </ChartAnnotationWrapper>
    );
});

