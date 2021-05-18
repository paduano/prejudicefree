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