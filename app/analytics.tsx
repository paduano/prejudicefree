import type { AnalyticsInstance } from 'analytics'
import { countryCodeToName } from './data/countries';
import { nextOnboardingStep, setCurrentColumn, setCurrentRow, setPrimaryFilterDemographic, setSecondaryFilterDemographic, setSelectedObservation, updateObservationsQuery, updateValuesQuery } from './store';

export const getAnalytics = () => {
    if (typeof window !== 'undefined' && typeof (window as any).Analytics !== 'undefined') {
        return (window as any).Analytics as AnalyticsInstance
    } else {
        console.error('analytics not initialized');
    }
}

// /* Initialize analytics */
// export const initAnalytics = () => {
//     debugger
//     return Analytics({
//         app: 'prejudice-free',
//         version: '1',
//         plugins: [
//             googleAnalytics({
//                 trackingId: 'UA-121991291',
//             }),
//         ],
//         debug: true
//     });
// }

// export const addGlobals = () => {
//     debugger
//     if (typeof window !== 'undefined' && typeof window.initAnalytics !== 'undefined') {
//         window.initAnalytics = initAnalytics;
//     }
// }

export const analyticsMiddleware = storeAPI => next => (action: { type: any, payload: any }) => {

    try {
        let category = undefined;
        let value = undefined;
        let label = undefined;
        switch (action.type) {
            case setCurrentRow.type:
                category = 'set-row';
                label = action.payload.row;
                break;

            case setCurrentColumn.type:
                category = 'set-column';
                label = action.payload.column;
                break;

            case nextOnboardingStep.type:
                category = 'next-onboarding-step';
                break;

            case updateObservationsQuery.type:
                category = 'select-country';
                label = countryCodeToName[action.payload.country_codes?.[0]];
                break;

            case updateValuesQuery.type:
                category = 'select-topic-value';
                label = action.payload.selectedValue;
                break;

            case setPrimaryFilterDemographic.type:
                category = 'set-primary-demographic';
                label = action.payload.demographic;
                break;

            case setSecondaryFilterDemographic.type:
                category = 'set-primary-demographic';
                label = action.payload.demographic;
                break;

            // case setSelectedObservation.type:
            //     category = 'set-observation';
            // break;
        }

        if (category !== undefined) {
            getAnalytics().track('ui-interaction', {
                category,
                value,
                label,
            });
        }
    } catch (err) {
        console.error(err);
    }

    return next(action)
}