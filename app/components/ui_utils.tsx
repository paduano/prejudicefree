import { createSelector } from "@reduxjs/toolkit";
import { countryCodeTo2, countryCodeToName } from "../data/countries";
import { AllEntriesStore } from "../observation";
import { RootState } from "../store";
import Flags from 'country-flag-icons/react/3x2'
import React, { useState } from "react";
import { Box, BoxProps, Typography } from "@material-ui/core";
import classNames from 'classnames/bind';
import styles from '../../styles/select.module.css'
import { CSSTransition } from "react-transition-group";
import { useAccentStyles } from "./theme";

export const MAIN_CONTAINER_ID = 'main-container';

export const selectAvailableCountries = createSelector<RootState, AllEntriesStore, any>(
    state => state.rawData.allEntries,
    entries => {
        console.count('[selector] selectAvailableCountries');
        const countriesMap = {};
        Object.keys(entries).forEach((code) => {
            if (!countriesMap[code]) {
                countriesMap[code] = true;
            }
        });
        return Object.keys(countriesMap);
    }
)

export const getFlagFromCountryCode = (code: string, className: string = 'country-flag') => {
    let name = countryCodeTo2[code];
    const C = Flags[name] as any;
    if (!C) {
        debugger
    }
    return (
        <C title={countryCodeToName[code]} className={className} />
    );
}

export function mousePos(evt: React.MouseEvent<HTMLElement>, parent: HTMLDivElement) {
    return {
        x: evt.clientX - parent.offsetLeft, y: evt.clientY - parent.offsetTop
    };
}

export const color = {
    // background: '#040728', // blue
    // accent: '#f7ed5c', // bright yellow 
    accent: '#fec419', // orangy yellow
    background: '#030622', // dark blue
    backgroundWithOpacity: 'rgba(4, 6, 34, 0.8)', // dark blue
}

export const colorGradientList = [
    // inverted
    // [117, 189, 255],
    // // [158, 202, 225],
    // [255, 255, 204],
    // // [255, 237, 160],
    // [254, 217, 118],
    // // [254, 178, 76],
    // // [253, 141, 60],
    // [252, 78, 42],
    // // [227, 26, 28],
    // [177, 0, 38],

    // from red to blue
    // [177, 0, 38],
    // [252, 78, 42],
    // [254, 217, 118],
    // [255, 255, 204],
    // [117, 189, 255],


    // 3 steps
    // [234, 28, 28],
    // [78, 73, 73, 1],
    // [52, 72, 246],

    // 3 steps for blue background
    [234, 28, 28],
    [131, 111, 111],
    [89, 78, 255],
]

export const colorGradientListCSS = (index: number) => {
    const color = colorGradientList[index];
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}


export const getColorIndex = (v: number) => {
    // if (v < 0 || v > 1) {
    //     throw `${v} not a valid color gradient value`
    // }
    // const cListIndex = Math.round(v * (colorGradientList.length - 1));
    let cListIndex = 1;
    if (v <= 4) {
        cListIndex = 0
    } else if (v >= 7) {
        cListIndex = 2
    }
    return cListIndex;
}

export const FadeGradient = (props: BoxProps & {orientation: 'top' | 'bottom', destinationColor: string}) => {
    const { orientation, destinationColor, ...rest} = props;

    const shadowStyle = (orientation: 'top' | 'bottom') => {
        return {
            background: `linear-gradient(${orientation == 'top' ? '0deg' : '180deg'}, rgba(2,0,36,1) 0%, rgba(0,0,0,0) 0%, ${destinationColor} 100%)`,
            pointerEvents: 'none',
        } as any
    };

    const shadowHeight = 100;
        return <Box height={shadowHeight} width='100%' style={shadowStyle(orientation)} {...rest} />;
}


export const Button = (props: { label: string, select: boolean, className?: string, onClick: (evt: any) => void, accent?: boolean } & BoxProps) => {
    const { label, children, className, select, accent, ...rest } = props;
    const [white, setWhite] = useState(false);
    const accentClasses = useAccentStyles();
    const typographyCls = accent ? accentClasses.accentText : '';

    const cls = classNames(styles.buttonContainer, props.className ?? '');
    const clsWhite = classNames(styles.buttonWhite, { [styles.buttonWhiteVisible]: white || select });
    const onMouseDown = () => {
        setWhite(true);
    };
    const dismissHover = () => {
        setWhite(false);
    }

    return (
        <Box className={cls} onClick={props.onClick} {...rest} onMouseDown={onMouseDown} onMouseUp={dismissHover} onMouseLeave={dismissHover} >
            <div className={styles.buttonInnerContainer}>
                <div className={styles.buttonUnderlineContainer} />
                <div className={clsWhite}>
                    <Typography className={typographyCls} variant='h3' noWrap>
                        {label}
                    </Typography>
                </div>
                <Typography className={typographyCls} variant='h3' noWrap>
                    {label}
                </Typography>
            </div>
        </Box>
    );
}

export function FadeInBox(props: BoxProps & { visible: boolean }) {
    const { visible, className, children, ...rest } = props;
    const cls = classNames(className, styles.fadeHidden);
    return (
        <CSSTransition in={visible} timeout={1000} classNames={{
            enter: styles.enterFade,
            enterActive: styles.enterActiveFadeWidthDelay,
        }}>
            <Box {...rest} className={cls} key='key'>
                {visible ? children : null}
            </Box>
        </CSSTransition>
    )
}