import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Box, BoxProps } from '@material-ui/core';
import { useAppDispatch, useAppSelector } from '../hooks';
import { setCurrentRow } from '../store';
import { getReadableDescriptionForDemographic, getReadableDescriptionForGroupValue, groupsForDemographic } from '../observation';
import { GroupLayoutInfo } from './viz/grid_viz_configs';
import styles from '../../styles/chart_annotation.module.css'
import classNames from 'classnames/bind';

import { Plus } from './plus';
import { Minus } from './minus';

interface Props {
    hide?: boolean,
    hideDuringAnimation?: boolean,
    showWhenZoomedIn?: boolean,
}

export const ChartAnnotationWrapper = (props: React.PropsWithChildren<BoxProps> & Props) => {
    const { hideDuringAnimation, children, className, style, hide, showWhenZoomedIn, ...rest} = props;
    const animationInProgress = useAppSelector(state => {
        return state.rawData.animationInProgress;
    });
    const isZoomedIn = useAppSelector(state => {
        return state.rawData.zoomedIn;
    });

    const hidden = (hideDuringAnimation && animationInProgress) || (!showWhenZoomedIn && isZoomedIn) || hide;

    const wrapperStyles = {
        left: 0,
        top: 0,
        pointerEvents: hidden ? 'none' : 'visiblePainted',
    } as any;

    const clsWrapper = classNames(styles.axis, className, {
        [styles.axisHidden]: hidden,
        [styles.axisTransitionProperties]: hideDuringAnimation && !animationInProgress,
    });

    return (
        <Box className={clsWrapper} style={{...wrapperStyles, ...style}} {...rest} >
            {props.children}
        </Box>
    );
};

