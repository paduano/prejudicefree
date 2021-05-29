
import { Typography } from '@material-ui/core'
import React, { useRef, useState } from 'react';
import styles from '../../styles/value_range.module.css'
import { clamp } from '../../utils/utils';
import { mousePos } from './ui_utils';
import classNames from 'classnames/bind';
import { useAccentStyles } from './theme';

interface ValueRangeProps {
    value: number
    onValueSet: (value: number) => void;
    horizontal?: boolean;
}


export function ValueRange(props: ValueRangeProps) {
    const { value, horizontal } = props;
    const accentClasses = useAccentStyles();
    const [mouseDown, setMouseDown] = useState(false);
    const containerRef = useRef(null);
    const backgroundRef = useRef(null);


    const onMouseDown = (evt: React.MouseEvent<HTMLElement>) => {
        setMouseDown(true);
    }
    const onMouseMove = (evt: React.MouseEvent<HTMLElement>) => {
    }
    const onClick = (evt: React.MouseEvent<HTMLElement>) => {

    }
    const dismiss = (evt: React.MouseEvent<HTMLElement>) => {
        setMouseDown(false);
    }
    const values = new Array(10).fill(null).map((_, i) => i);
    const sepDivs = values.map(i => { 
        const v = horizontal ? i + 1 : 10 - i;
        const w = (1 + (v) * 0.8) * 10;
        const onSepClick = () => props.onValueSet(v);
        const sepDivSelected = v == value;
        const cls = classNames(styles.sepDiv, { [styles.sepDivSelected]: sepDivSelected});
        const sepDivStyle = {
            height: horizontal ? undefined : '10%',
            width: horizontal ? '10%' : undefined,
        }

        const lineSizeValue = `${w}%`;
        const sepDivLineStyle = {
            height: horizontal ? lineSizeValue : undefined,
            width: horizontal ? undefined : lineSizeValue,
        }
        const typoCls = sepDivSelected ? accentClasses.accentText : '';
        const setV = () => {
            if (mouseDown) {
                props.onValueSet(v);
            }
        }
        return (
            <div style={sepDivStyle} className={cls} key={i} onClick={onSepClick} onMouseMove={setV} onMouseDown={setV}>
                <div className={styles.sepDivLine} style={sepDivLineStyle}></div>
                <div className={styles.sepDivNumber}>
                    <Typography variant='h3' className={typoCls}> {v} </Typography>
                </div>
            </div>
    )})
    const percSizeValue = `${value * 10}%`;
    const whiteBackgroundStyle = {
        height: horizontal ? undefined : percSizeValue,
        width: horizontal ? percSizeValue : undefined,
    }

    const innerContainerStyle = {
        flexDirection: horizontal ? 'row' : 'column',
    } as any;

    const cls = classNames(styles.container, { [styles.horizontal]: horizontal});
    return (
        <div
            ref={containerRef}
            className={cls} 
            onClick={onClick} 
            onMouseDown={onMouseDown} 
            onMouseUp={dismiss} 
            onMouseLeave={dismiss} 
            // onMouseMove={onMouseMove}
            >
            <div className={styles.innerContainer} style={innerContainerStyle}>
                {sepDivs}
                <div className={styles.whiteBackground} style={whiteBackgroundStyle} ref={backgroundRef} />
            </div>
        </div>
    );
}
