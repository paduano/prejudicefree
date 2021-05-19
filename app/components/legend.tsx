import React, { useEffect } from 'react';
import Typography from '@material-ui/core/Typography';
import { Box } from '@material-ui/core';
import { useAppDispatch, useAppSelector } from '../hooks';
import { getReadableDescriptionForDemographic, getReadableDescriptionForGroup, groupsForDemographic } from '../observation';
import { GroupLayoutInfo } from './viz/grid_viz_configs';
import styles from '../../styles/axis.module.css'
import classNames from 'classnames/bind';
import { colorGradientList, colorGradientListCSS } from './ui_utils';

interface Props {
}

export const Legend = React.memo((props: Props) => {

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

    // refactor and reuse code below

    const animationInProgress = useAppSelector(state => {
        return state.rawData.animationInProgress;
    });
    
    const clsWrapper = classNames(styles.axis, {
        [styles.axisHidden]: animationInProgress,
        [styles.axisTransitionProperties]: !animationInProgress,
    });

    const wrapperStyles = {
        width: '200px',
    } as any;

    return (
        <Box className={clsWrapper} style={wrapperStyles} >
            <Box display='flex' flexDirection='columns'>
                {colorDivs}
            </Box>
        </Box>
    );
});

