import { createSelector } from "@reduxjs/toolkit";
import { countryCodeTo2, countryCodeToName } from "../data/countries";
import { AllEntriesStore } from "../observation";
import { RootState } from "../store";
import Flags from 'country-flag-icons/react/3x2'
import React, { useEffect, useState } from "react";
import { Box, BoxProps, Typography } from "@material-ui/core";
import classNames from 'classnames/bind';
import styles from '../../styles/select.module.css'
import { CSSTransition } from "react-transition-group";
import { useAccentStyles } from "./theme";
import { colorGradientList } from "./colors";

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

export function FadeInBoxWithDelay(props: BoxProps & {children: any, fadeInAfter?: number}) {
    const { children, fadeInAfter, ...rest } = props;
    const [uiVisible, setUiVisible] = useState(false);
    useEffect(() => {
        setTimeout(() => {
            setUiVisible(true);
        }, fadeInAfter);
    })

    const style = {
        opacity: uiVisible ? 1 : 0,
        transition: `opacity 1000ms linear`,
    };
    return <Box style={style} {...rest}>{children}</Box>
}

export function isLimitedWidth() {
    if (typeof document !== 'undefined' && document.documentElement && typeof window !== 'undefined') {
        const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
        return vw < 1000;
    } else return false;
}