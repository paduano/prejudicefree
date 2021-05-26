import React, { useEffect } from 'react';
import Typography from '@material-ui/core/Typography';
import { Box } from '@material-ui/core';
import { useAppDispatch, useAppSelector } from '../hooks';
import { getReadableDescriptionForDemographic, getReadableDescriptionForGroupValue, groupsForDemographic } from '../observation';
import { GroupLayoutInfo } from './viz/grid_viz_configs';
import styles from '../../styles/chart_annotation.module.css'
import classNames from 'classnames/bind';
import { ChartAnnotationWrapper } from './chart_annotation_wrapper';
import { colorGradientList, colorGradientListCSS } from './colors';
import { isLimitedWidthSelector } from '../selectors';

interface Props {
}

export const Legend = React.memo((props: Props) => {
    const limitedWidth = isLimitedWidthSelector();

    const colorDivs = colorGradientList.map((c, i) => {
        const color = colorGradientListCSS(i);
        const style = {
            flex: i == (colorGradientList.length - 1)/2 ? 2 : 1,
            borderTop: `2px solid ${color}`,
            fontFamily: 'News Cycle',
            fontSize: '0.8rem',
            color: color,
            fontWeight: 700,
            textAlign: 'left',
        } as any;
        let text;
        if (i == 0) {
            text = 'OPPOSE';
        } else if (i == colorGradientList.length - 1) {
            text = 'TOLERATE';
            style.textAlign = 'right';
        }

        return (
            <div style={style} key={`legend-divs-${i}`}>
                {text}
            </div>
        )
    })

    const wrapperStyles = {
        width: limitedWidth ? '120px' : '200px',
    } as any;

    return (
        <ChartAnnotationWrapper display='flex' flexDirection='columns' style={wrapperStyles} >
            {colorDivs}
        </ChartAnnotationWrapper>
    );
});

