
import { useAppSelector } from './hooks';
import { countryCodeToName } from './data/countries';

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

export const isLimitedWidthSelector = () => useAppSelector(state => {
    return state.rawData.isLimitedWidth;
});