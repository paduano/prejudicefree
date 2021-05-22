
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
}


export function ValueRange(props: ValueRangeProps) {
    const { value } = props;
    const accentClasses = useAccentStyles();
    // const [value, setValue] = useState(initialValue);
    const [hoverValue, setHoverValue] = useState(value);
    const [numericValueBottom, setNumericValueBottom] = useState(value);
    const [mouseDown, setMouseDown] = useState(false);
    const containerRef = useRef(null);
    const backgroundRef = useRef(null);

    const updateValueBackgroundAndCallback = (evt: React.MouseEvent<HTMLElement>, updateOnlyNumber) => {
        const { y } = mousePos(evt, containerRef.current);
        const h = containerRef.current.getBoundingClientRect().height;
        const p = clamp(1 - (y / h), 0, 1);
        const v = Math.ceil(p * 10);
        if (!updateOnlyNumber) {
            // setValue(v);
            setNumericValueBottom((v/10) * h)
            props.onValueSet(v);
        }
        if (value == 0 || value == undefined) {
            setNumericValueBottom((v/10) * h)
        }
        setHoverValue(v);
    }

    const onMouseDown = (evt: React.MouseEvent<HTMLElement>) => {
        updateValueBackgroundAndCallback(evt, false);
        setMouseDown(true);
    }
    const onMouseMove = (evt: React.MouseEvent<HTMLElement>) => {
        updateValueBackgroundAndCallback(evt, !mouseDown);
    }
    const onClick = (evt: React.MouseEvent<HTMLElement>) => {

    }
    const dismiss = (evt: React.MouseEvent<HTMLElement>) => {
        setMouseDown(false);
    }
    const values = new Array(10).fill(null).map((_, i) => i);
    const sepDivs = values.map(i => { 
        const v = 10 - i;
        const w = (1 + (v) * 0.8) * 10;
        const onSepClick = () => props.onValueSet(v);
        const sepDivSelected = v == value;
        const cls = classNames(styles.sepDiv, { [styles.sepDivSelected]: sepDivSelected});
        const typoCls = sepDivSelected ? accentClasses.accentText : '';
        return (
            <div className={cls} key={i} onClick={onSepClick}>
                <div className={styles.sepDivLine} style={{ width: `${w}%` }}></div>
                <div className={styles.sepDivNumber}>
                    <Typography variant='h3' className={typoCls} >
                        {10-i}
                    </Typography>
                </div>
            </div>
    )})
    const whiteBackgroundStyle = {
        height: `${value * 10}%`,
    }

    return (
        <div
            ref={containerRef}
            className={styles.container} 
            onClick={onClick} 
            onMouseDown={onMouseDown} 
            onMouseUp={dismiss} 
            onMouseLeave={dismiss} 
            onMouseMove={onMouseMove}>
            <div className={styles.innerContainer}>
                {sepDivs}
                <div className={styles.whiteBackground} style={whiteBackgroundStyle} ref={backgroundRef} />
            </div>
        </div>
    );
}
