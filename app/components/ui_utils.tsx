import { createSelector } from "@reduxjs/toolkit";
import { countryCodeTo2, countryCodeToName } from "../data/countries";
import { AllEntriesStore } from "../observation";
import { RootState } from "../store_definition";
import Flags from 'country-flag-icons/react/3x2'
import React, { useEffect, useState } from "react";
import { Box, BoxProps, Typography } from "@material-ui/core";
import classNames from 'classnames/bind';
import styles from '../../styles/select.module.css'
import { CSSTransition } from "react-transition-group";
import { useAccentStyles } from "./theme";
import { colorGradientList } from "./colors";
import { isLimitedWidthSelector } from "../selectors";
import { useAppSelector } from "../hooks";

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


export const Button = (props: { frame?: boolean, label: string, medium?: boolean, small?: boolean, select: boolean, className?: string, onClick: (evt: any) => void, accent?: boolean } & BoxProps) => {
    const { frame, label, small, children, medium, className, select, accent, ...rest } = props;
    const [white, setWhite] = useState(false);
    const accentClasses = useAccentStyles();
    const typographyCls = accent ? accentClasses.accentText : '';

    const cls = classNames(styles.buttonContainer, props.className ?? '', {
        [styles.frame]: frame,
        [styles.small]: small,
        [styles.medium]: medium
    });
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
        // }, fadeInAfter); // YYYY
        }, fadeInAfter / 10); // YYYY
    })

    const style = {
        opacity: uiVisible ? 1 : 0,
        transition: `opacity 1000ms linear`,
    };
    return <Box style={style} {...rest}>{children}</Box>
}

export function updateWhenViewportChanges() {
    const vW = useAppSelector(state => {
        return state.rawData.viewportWidth
    });
}

export function isMobile() {
    let check = false;
    // @ts-ignore
    (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
}
export function isLimitedWidth() {
    if (typeof document !== 'undefined' && document.documentElement && typeof window !== 'undefined') {
        const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
        return vw < 1000 && isMobile();
    } else return false;
}

export function viewportWidth() {
    if (typeof document !== 'undefined' && document.documentElement && typeof window !== 'undefined') {
        const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
        return vw;
    } else return 0;
}