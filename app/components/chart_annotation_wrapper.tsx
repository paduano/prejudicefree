import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Box, BoxProps } from '@material-ui/core';
import { useAppDispatch, useAppSelector } from '../hooks';
import { setCurrentRow } from '../store';
import { getReadableDescriptionForDemographic, getReadableDescriptionForGroup, groupsForDemographic } from '../observation';
import { GroupLayoutInfo } from './viz/grid_viz_configs';
import styles from '../../styles/chart_annotation.module.css'
import classNames from 'classnames/bind';

import { Plus } from './plus';
import { Minus } from './minus';

interface Props {
    hide?: boolean,
}

export const ChartAnnotationWrapper = (props: React.PropsWithChildren<BoxProps> & Props) => {
    const { children, className, style, hide, ...rest} = props;
    const animationInProgress = useAppSelector(state => {
        return state.rawData.animationInProgress;
    });

    const wrapperStyles = {
        left: 0,
        top: 0,
        pointerEvents: 'visiblePainted', 
    } as any;

    const clsWrapper = classNames(styles.axis, className, {
        [styles.axisHidden]: animationInProgress || hide,
        [styles.axisTransitionProperties]: !animationInProgress,
    });

    return (
        <Box className={clsWrapper} style={{...wrapperStyles, ...style}} {...rest} >
            {props.children}
        </Box>
    );
};

