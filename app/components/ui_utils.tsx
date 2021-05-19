import { createSelector } from "@reduxjs/toolkit";
import { countryCodeTo2, countryCodeToName } from "../data/countries";
import { AllEntriesStore } from "../observation";
import { RootState } from "../store";
import Flags from 'country-flag-icons/react/3x2'

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
    [234, 28, 28],
    [78, 73, 73, 1],
    [52, 72, 246],
]

export const colorGradientListCSS = (index: number) => {
    const color = colorGradientList[index];
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}


export const getColorIndex = (v: number) => {
    if (v < 0 || v > 1) {
        throw `${v} not a valid color gradient value`
    }

    const cListIndex = Math.round(v * (colorGradientList.length - 1));
    return cListIndex;
}