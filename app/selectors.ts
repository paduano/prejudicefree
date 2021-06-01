
import { useAppSelector } from './hooks';
import { countryCodeToName } from './data/countries';
import { RootState } from './store_definition';
import { LATEST_WAVE, VALUES_WITH_LIMITED_AVAILABLE_YEARS, WAVE_TO_YEAR } from './data/legend';
import { StoreState } from './store';

// Selectors
export const countryNameAppSelector = () => useAppSelector(state => {
    if (state.rawData.filterQuery.country_codes && state.rawData.filterQuery.country_codes.length > 0) {
        const code = state.rawData.filterQuery.country_codes[0];
        let article = '';
        // should I append 'the'? 
        if (['840', '826', '784'].indexOf(code) != -1) {
            article = 'the ';
        }
        return article + countryCodeToName[code];
    } else {
        return '';
    }
});

export const countryCodeAppSelector = () => useAppSelector(state => getCountryCode(state.rawData));

export const isCountryPreferred = (state: RootState) => {
    return getCountryCode(state.rawData) == state.rawData.userPreferences.userCountry;
}

export const getCountryCode = (state: StoreState) => {
    if (state.filterQuery.country_codes && state.filterQuery.country_codes.length > 0) {
        return state.filterQuery.country_codes[0];
    } else {
        return '';
    }
}


export const isLimitedWidthSelector = () => useAppSelector(state => {
    return state.rawData.isLimitedWidth;
});

export const isHorizontalViz = (state: RootState ) => {
    return false;
    // return !state.rawData.isLimitedWidth && state.rawData.primaryFilterDemographic == null;
}

export const availableWavesForValueAndCountrySelector = () => useAppSelector(s => availableWavesForValueAndCountry(s.rawData));

export function availableWavesForValueAndCountry(state: StoreState) : string[] {
    if (state.filterQuery.country_codes && state.filterQuery.country_codes.length > 0) {
        const code = state.filterQuery.country_codes[0];
        const value = state.valuesQuery.selectedValue;
        const waves = Object.keys(state.allEntries[code]);
        return waves
            .filter((v) => !VALUES_WITH_LIMITED_AVAILABLE_YEARS[value] || VALUES_WITH_LIMITED_AVAILABLE_YEARS[value].indexOf(v) != -1)
            .sort((a, b) => WAVE_TO_YEAR[b] - WAVE_TO_YEAR[a]);

    } else {
        return [LATEST_WAVE];
    }
}