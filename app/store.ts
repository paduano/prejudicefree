import { configureStore, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import thunk from 'redux-thunk';

import { createSlice } from '@reduxjs/toolkit'
import { AllEntriesStore, AltObservationQuery, AltStatsAndQuery, filterAndStatsObservations, filterByCountryAndAvailableDemographics, populateEntriesStoreWithLatestWave, getEmptyStats, getGroupStats, GroupStats, Observation, ObservationDemographics, ObservationQuery, StatsAccumulator, ValuesQuery, populateEntriesStoreWithTimeData, ValuesMap } from './observation';
import { OnboardingObjectPositions, ONBOARDING_STEPS_LIST } from './onboarding';
import { useAppSelector } from './hooks';
import { countryCodeToName } from './data/countries';
import { isLimitedWidth, viewportWidth } from './components/ui_utils';
import { analyticsMiddleware, getAnalytics } from './analytics';
import { StoryContents } from './components/story';
import { availableWavesForValueAndCountry, getCountryCode } from './selectors';
import { LATEST_WAVE } from './data/legend';

interface UserPreferences {
    userCountry: string,
    userValue: keyof typeof ValuesMap,
    numericValue: {
        [id: string]: number
    },
    demographicGroup: {
        [id: string]: number
    }
}

// Define a type for the slice state
export interface StoreState {
    allEntries: AllEntriesStore,
    filteredEntries: Observation[]
    valuesQuery: ValuesQuery;
    filterQuery: ObservationQuery;
    filterStats: StatsAccumulator;
    altStatsAndQueries: AltStatsAndQuery[];
    loadingState: 'idle' | 'pending' | 'complete' | 'error'
    uiSelect: UISelect,
    primaryFilterDemographic?: ObservationDemographics,
    secondaryFilterDemographic?: ObservationDemographics,
    selectedObservationId: number | null;
    selectedObservation: Observation | null;
    wave: string,

    currentRow: number,
    currentColumn: number,
    currentGroupStats: GroupStats | null,
    animationInProgress: boolean,

    currentOnboardingStepIndex: number,
    currentOnboardingMessageStepIndex: number,
    onboardingObjectPositions: OnboardingObjectPositions,

    isLimitedWidth: boolean,
    viewportWidth: number,

    zoomedIn: boolean,
    collapseAboutYou: boolean,

    userPreferences: UserPreferences,
}

export type SelectTypes = 'country' | 'value' | 'demographic';

export interface UISelect {
    current?: SelectTypes;
    params: any;
}

interface RequestError {
    errorMessage: string
}

export const fetchAllVizData = createAsyncThunk<any /* ret value*/, { smallDataset?: boolean } | void/* req parameter */, { rejectValue: RequestError }>(
    'vizdata/all',
    async (params, thunkAPI) => {
        try {
            const { smallDataset } = params ? params : { smallDataset: false };
            const url = smallDataset ? './out_100.json' : './out.json';
            const response = await fetch(url);
            return await response.json()
        } catch (err) {
            thunkAPI.rejectWithValue({ errorMessage: 'failed to request out.json' })
        }
    }
)

export const fetchTimeData = createAsyncThunk<any /* ret value*/, void/* req parameter */, { rejectValue: RequestError }>(
    'vizdata/all_time',
    async (params, thunkAPI) => {
        try {
            const url = './out_time.json';
            const response = await fetch(url);
            return await response.json()
        } catch (err) {
            thunkAPI.rejectWithValue({ errorMessage: 'failed to request out_time.json' })
        }
    }
)

// Define the initial state using that type
const initialState: StoreState = {
    allEntries: {},
    filteredEntries: [],
    filterQuery: {},
    valuesQuery: {
        selectedValue: undefined,
        value: 0,
    },

    primaryFilterDemographic: undefined,
    secondaryFilterDemographic: undefined,
    wave: LATEST_WAVE,

    filterStats: getEmptyStats(),
    altStatsAndQueries: [],

    loadingState: 'idle',
    uiSelect: {
        current: undefined,
        params: {},
    },
    currentRow: 0,
    currentColumn: 0, // used for placing you
    selectedObservationId: null,
    selectedObservation: null,
    animationInProgress: true,
    currentGroupStats: null,

    // onboarding
    currentOnboardingStepIndex: 0,
    currentOnboardingMessageStepIndex: 0,

    onboardingObjectPositions: {},
    isLimitedWidth: isLimitedWidth(),
    viewportWidth: viewportWidth(),

    zoomedIn: false,
    collapseAboutYou: true,

    userPreferences: {
        userCountry: '840',
        userValue: 'justify_abortion',
        numericValue: {},
        demographicGroup: {},
    },
    
}

// overrides
// initialState.currentOnboardingStepIndex = 12;
// initialState.primaryFilterDemographic = 'age';
// initialState.secondaryFilterDemographic = 'education';
// initialState.valuesQuery.selectedValue = 'justify_abortion';
// initialState.valuesQuery.value = 6;

// const applyObservationsQueryReducer = (state: StoreState, allEntries: AllEntriesStore, filterQuery: ObservationQuery) => {
//     const { filteredEntries, stats, altStatsAndQuery } = filterAndStatObservationsWithVariations(allEntries, filterQuery);
//     state.filteredEntries = filteredEntries;
//     state.filterStats = stats;
//     state.altStatsAndQueries = altStatsAndQuery;
//     console.log(`alt stats: ${altStatsAndQuery}`)
// }

const applyFilterCountryAndDemographicsReducer = (state: StoreState, allEntries: AllEntriesStore, filterQuery: ObservationQuery, demo1: ObservationDemographics | null, demo2: ObservationDemographics | null) => {
    if (filterQuery.country_codes == undefined || filterQuery.country_codes.length == 0) {
        state.filteredEntries = [];
    } else {
        state.filteredEntries = filterByCountryAndAvailableDemographics(
            allEntries,
            filterQuery.country_codes[0],
            state.wave,
            [demo1, demo2]
        );
    }
    console.log(`filtered entries for country and demo ${demo1}, ${demo2}: ${state.filteredEntries.length}`)
}

const applyCurrentGroupStats = (state: StoreState) => {
    state.currentGroupStats = getGroupStats(
        state.filteredEntries,
        state.currentColumn,
        state.currentRow,
        state.primaryFilterDemographic,
        state.secondaryFilterDemographic,
        state.valuesQuery,
    );
}

const applyDeselect = (state: StoreState) => {
    state.selectedObservation = null;
    state.selectedObservationId = null;
}

const applyOnboardingStep = (state: StoreState, step: number) => {
    if (typeof window !== 'undefined') {
        window.location.hash = ''+step;
    }
    state.currentOnboardingStepIndex = step;
    const currentType = ONBOARDING_STEPS_LIST[step];
    const c = StoryContents[currentType.type];

    if (c.primaryDemographic !== undefined) {
        state.primaryFilterDemographic = c.primaryDemographic;
        state.currentRow = 0;
        state.currentColumn = state.userPreferences.demographicGroup[state.primaryFilterDemographic] || 0;
    }
    if (c.secondaryDemographic !== undefined) {
        state.secondaryFilterDemographic = c.secondaryDemographic;
        state.currentRow = 0;
        state.currentColumn = state.userPreferences.demographicGroup[state.primaryFilterDemographic] || 0;;
    }
    if (c.useSelectedValue) {
        state.valuesQuery.selectedValue = state.userPreferences.userValue;
    }

    const newObservationQuery: Partial <ObservationQuery> = state.filterQuery;

    // country select
    let country = c.countryCode;
    if (c.useSelectedCountry) {
        country = state.userPreferences.userCountry;
    };
    if (country && country != getCountryCode(state)) {
        newObservationQuery.country_codes = [country];
    }
    state.zoomedIn = c.zoomedIn;
    state.collapseAboutYou = true;
    state.selectedObservation = null;
    state.selectedObservationId = null;
    state.currentOnboardingMessageStepIndex = 0;
    state.wave = LATEST_WAVE;

    if (c.beforeReducer !== undefined) {
        c.beforeReducer(state);
    }

    applyUpdateObservationsQuery(state, newObservationQuery);
}

const applyBeforeLeaveOnboardingStep = (state: StoreState, step: number) => {
    const currentType = ONBOARDING_STEPS_LIST[step];
    const c = StoryContents[currentType.type];
    if (c.afterReducer !== undefined) {
        c.afterReducer(state);
    }
}


const applyPrimaryFilterDemographic = (state: StoreState, demographic: ObservationDemographics | null) => {
    state.primaryFilterDemographic = demographic;
    // fallback to defaults
    state.currentRow = state.userPreferences.demographicGroup[state.secondaryFilterDemographic] || 0;
    state.currentColumn = state.userPreferences.demographicGroup[state.primaryFilterDemographic] || 0;;
    applyFilterCountryAndDemographicsReducer(
        state,
        state.allEntries,
        state.filterQuery,
        demographic,
        state.secondaryFilterDemographic
    );
    applyCurrentGroupStats(state);
}

const applySecondaryFilterDemographic = (state: StoreState, demographic: ObservationDemographics | null) => {
    state.secondaryFilterDemographic = demographic;
    // fallback to defaults
    state.currentRow = state.userPreferences.demographicGroup[state.secondaryFilterDemographic] || 0;
    state.currentColumn = state.userPreferences.demographicGroup[state.primaryFilterDemographic] || 0;;
    applyFilterCountryAndDemographicsReducer(
        state,
        state.allEntries,
        state.filterQuery,
        demographic,
        state.secondaryFilterDemographic
    );
    applyCurrentGroupStats(state);
}

const applyUpdateObservationsQuery = (state: StoreState, query: Partial<ObservationQuery>) => {
    state.filterQuery = Object.assign({}, state.filterQuery, query);
    state.wave = validWaveOrLatest(state, state.wave);
    // applyObservationsQueryReducer(state, state.allEntries, state.filterQuery);
    applyFilterCountryAndDemographicsReducer(
        state,
        state.allEntries,
        query,
        state.primaryFilterDemographic,
        state.secondaryFilterDemographic
    );
    applyCurrentGroupStats(state);
}

function validWaveOrLatest(state: StoreState, wave: string) {
    const available = availableWavesForValueAndCountry(state);
    if (available.indexOf(wave) == -1) {
        return LATEST_WAVE;
    } else {
        return wave;
    }
}

export const rawDataSlice = createSlice({
    name: 'counter',
    initialState,
    reducers: {
        updateObservationsQuery: (state, action: PayloadAction<Partial<ObservationQuery>>) => {
            applyUpdateObservationsQuery(state, action.payload);
        },
        updateValuesQuery: (state, action: PayloadAction<ValuesQuery>) => {
            state.valuesQuery = Object.assign({}, state.valuesQuery, action.payload);
            if (state.valuesQuery.selectedValue && action.payload.value) {
                state.userPreferences.numericValue[state.valuesQuery.selectedValue] = action.payload.value;
            } else if (state.valuesQuery.selectedValue) {
                state.valuesQuery.value = state.userPreferences.numericValue[state.valuesQuery.selectedValue] || null;
            }
            const validWave = validWaveOrLatest(state, state.wave);
            if (state.wave != validWave) {
                state.wave = validWave;
                applyFilterCountryAndDemographicsReducer(
                    state,
                    state.allEntries,
                    state.filterQuery,
                    state.primaryFilterDemographic,
                    state.secondaryFilterDemographic
                );
            }
            applyCurrentGroupStats(state);
        },
        updateUserPreferences: (state, action: PayloadAction<Partial<UserPreferences>>) => {
            state.userPreferences = Object.assign({}, state.userPreferences, action.payload);
        },
        uiSetSelect: (state, action: PayloadAction<Partial<UISelect>>) => {
            state.uiSelect = Object.assign({}, state.uiSelect, { current: action.payload.current, params: action.payload.params ?? {} });
        },
        setPrimaryFilterDemographic: (state, action: PayloadAction<{ demographic: ObservationDemographics | null }>) => {
            applyPrimaryFilterDemographic(state, action.payload.demographic);
        },
        setSecondaryFilterDemographic: (state, action: PayloadAction<{ demographic: ObservationDemographics | null }>) => {
            applySecondaryFilterDemographic(state, action.payload.demographic);
        },
        setWave: (state, action: PayloadAction<{ wave: string}>) => {
            state.wave = action.payload.wave;
            applyFilterCountryAndDemographicsReducer(
                state,
                state.allEntries,
                state.filterQuery,
                state.primaryFilterDemographic,
                state.secondaryFilterDemographic
            );
            applyCurrentGroupStats(state);
        },
        setSelectedObservationId: (state, action: PayloadAction<{ id: number | null }>) => {
            state.selectedObservationId = action.payload.id;
        },
        setSelectedObservation: (state, action: PayloadAction<{ o: Observation | null }>) => {
            if (action.payload.o) {
                state.selectedObservationId = action.payload.o.id;
                state.selectedObservation = action.payload.o;
            } else {
                applyDeselect(state);
            }
        },
        setCurrentRow: (state, action: PayloadAction<{ row: number }>) => {
            state.currentRow = action.payload.row;
            applyDeselect(state);
            applyCurrentGroupStats(state);
        },
        setCurrentColumn: (state, action: PayloadAction<{ column: number }>) => {
            state.currentColumn = action.payload.column;
            applyDeselect(state);
            applyCurrentGroupStats(state);

            if (state.primaryFilterDemographic != null) {
                state.userPreferences.demographicGroup[state.primaryFilterDemographic] = state.currentColumn;
            }
        },
        setAnimationInProgress: (state, action: PayloadAction<{ value: boolean }>) => {
            state.animationInProgress = action.payload.value;
        },
        nextOnboardingStep: (state, action: PayloadAction<void>) => {
            if (state.currentOnboardingStepIndex < ONBOARDING_STEPS_LIST.length - 1) {
                applyBeforeLeaveOnboardingStep(state, state.currentOnboardingStepIndex);
                applyOnboardingStep(state, state.currentOnboardingStepIndex + 1)
            } else {
                console.warn('no more onboarding steps available');
            }
        },
        previousOnboardingStep: (state, action: PayloadAction<void>) => {
            if (state.currentOnboardingStepIndex > 0) {
                applyBeforeLeaveOnboardingStep(state, state.currentOnboardingStepIndex);
                applyOnboardingStep(state, state.currentOnboardingStepIndex - 1)
            } else {
                console.warn('no more onboarding steps available');
            }
        },
        skipOnboarding: (state, action: PayloadAction<void>) => {
            if (!state.valuesQuery.selectedValue) {
                state.valuesQuery.selectedValue = 'justify_homosexuality';
            }
            applyOnboardingStep(state, ONBOARDING_STEPS_LIST.length - 1);
        },
        restartOnboarding: (state, action: PayloadAction<void>) => {
            applyOnboardingStep(state, 0);
        },
        setOnboardingObjectPositions: (state, action: PayloadAction<Partial<OnboardingObjectPositions>>) => {
            state.onboardingObjectPositions = Object.assign({}, state.onboardingObjectPositions, action.payload);
        },
        nextOnboardingMessage: (state, action: PayloadAction<void>) => {
            const step = ONBOARDING_STEPS_LIST[state.currentOnboardingStepIndex];
            if (step && step.messages && state.currentOnboardingMessageStepIndex < step.messages.length - 1) {
                state.currentOnboardingMessageStepIndex += 1;
            } else {
                state.currentOnboardingMessageStepIndex = null;
                console.log('no more onboarding steps available');
            }
        },
        setViewportWidth: (state, action: PayloadAction<{ width: number }>) => {
            state.viewportWidth = action.payload.width;
        },
        zoomIn: (state, action: PayloadAction<boolean>) => {
            state.zoomedIn = action.payload;
            if (!action.payload) {
                state.selectedObservationId = null;
                state.selectedObservation = null;
            }
        },
        setCollapseAboutYou: (state, action: PayloadAction<boolean>) => {
            state.collapseAboutYou = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchAllVizData.pending, (state, action) => {
            if (state.loadingState === 'idle') {
                state.loadingState = 'pending'
            }
        });

        builder.addCase(fetchAllVizData.fulfilled, (state, action) => {
            state.loadingState = 'complete';
            state.allEntries = populateEntriesStoreWithLatestWave(state.allEntries, action.payload);
            // state.filterQuery = {country_codes: ['840'], sex: 'M'}; // ZZZ
            state.filterQuery = { country_codes: ['840'] };
            // applyObservationsQueryReducer(state, state.allEntries, state.filterQuery);
            applyFilterCountryAndDemographicsReducer(
                state,
                state.allEntries,
                state.filterQuery,
                state.primaryFilterDemographic,
                state.secondaryFilterDemographic
            );
            applyCurrentGroupStats(state);
        });

        builder.addCase(fetchAllVizData.rejected, (state, action) => {
            state.loadingState = 'error';
        });

        builder.addCase(fetchTimeData.fulfilled, (state, action) => {
            state.allEntries = populateEntriesStoreWithTimeData(state.allEntries, action.payload);
        });
    }
});

// actions
export const {
    setViewportWidth,
    setCurrentColumn,
    setSelectedObservation,
    setAnimationInProgress,
    updateObservationsQuery,
    updateValuesQuery,
    updateUserPreferences,
    uiSetSelect,
    setPrimaryFilterDemographic,
    setSecondaryFilterDemographic,
    setWave,
    setSelectedObservationId,
    setCurrentRow,
    nextOnboardingStep,
    setOnboardingObjectPositions,
    nextOnboardingMessage,
    skipOnboarding,
    restartOnboarding,
    previousOnboardingStep,
    zoomIn,
    setCollapseAboutYou,
} = rawDataSlice.actions;

// store set up in store_definition
// export const store = configureStore({
//     middleware: [thunk, analyticsMiddleware],
//     reducer: {
//         rawData: rawDataSlice.reducer,
//     },
// })

// export type RootState = ReturnType<typeof store.getState>
// export type AppDispatch = typeof store.dispatch
