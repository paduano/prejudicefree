import { configureStore, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import thunk from 'redux-thunk';

import { createSlice } from '@reduxjs/toolkit'
import { AllEntriesStore, AltObservationQuery, AltStatsAndQuery, filterAndStatObservationsWithVariations, filterAndStatsObservations, filterByCountryAndAvailableDemographics, formatAllEntriesStore, getEmptyStats, getGroupStats, GroupStats, Observation, ObservationDemographics, ObservationQuery, StatsAccumulator, ValuesQuery } from './observation';
import { OnboardingObjectPositions, ONBOARDING_STEPS_LIST } from './onboarding';
import { useAppSelector } from './hooks';
import { countryCodeToName } from './data/countries';
import { isLimitedWidth, viewportWidth } from './components/ui_utils';

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
    currentRow: number,
    currentColumn: number,
    currentGroupStats: GroupStats|null,
    animationInProgress: boolean,

    currentOnboardingStepIndex: number,
    currentOnboardingMessageStepIndex: number,
    onboardingObjectPositions: OnboardingObjectPositions,

    isLimitedWidth: boolean,
    viewportWidth: number,
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
}

// overrides
// initialState.currentOnboardingStepIndex = 2;
// initialState.primaryFilterDemographic = 'age';
// initialState.secondaryFilterDemographic = 'education';
// initialState.valuesQuery.selectedValue = 'justify_abortion';
// initialState.valuesQuery.value = 6;

const applyObservationsQueryReducer = (state: StoreState, allEntries: AllEntriesStore, filterQuery: ObservationQuery) => {
    const { filteredEntries, stats, altStatsAndQuery } = filterAndStatObservationsWithVariations(allEntries, filterQuery);
    state.filteredEntries = filteredEntries;
    state.filterStats = stats;
    state.altStatsAndQueries = altStatsAndQuery;
    console.log(`alt stats: ${altStatsAndQuery}`)
}

const applyFilterCountryAndDemographicsReducer = (state: StoreState, allEntries: AllEntriesStore, filterQuery: ObservationQuery, demo1: ObservationDemographics | null, demo2: ObservationDemographics | null) => {
    if (filterQuery.country_codes == undefined || filterQuery.country_codes.length == 0) {
        state.filteredEntries = [];
    } else {
        state.filteredEntries = filterByCountryAndAvailableDemographics(
            allEntries,
            filterQuery.country_codes[0],
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

export const rawDataSlice = createSlice({
    name: 'counter',
    initialState,
    reducers: {
        updateObservationsQuery: (state, action: PayloadAction<Partial<ObservationQuery>>) => {
            state.filterQuery = Object.assign({}, state.filterQuery, action.payload);
            // applyObservationsQueryReducer(state, state.allEntries, state.filterQuery);
            applyFilterCountryAndDemographicsReducer(
                state,
                state.allEntries,
                action.payload,
                state.primaryFilterDemographic,
                state.secondaryFilterDemographic
            );
            applyCurrentGroupStats(state);
        },
        updateValuesQuery: (state, action: PayloadAction<ValuesQuery>) => {
            state.valuesQuery = Object.assign({}, state.valuesQuery, action.payload);
            applyCurrentGroupStats(state);
        },
        uiSetSelect: (state, action: PayloadAction<Partial<UISelect>>) => {
            state.uiSelect = Object.assign({}, state.uiSelect, { current: action.payload.current, params: action.payload.params ?? {} });
        },
        setPrimaryFilterDemographic: (state, action: PayloadAction<{ demographic: ObservationDemographics|null }>) => {
            state.primaryFilterDemographic = action.payload.demographic;
            state.currentRow = 0;
            state.currentColumn = 0;
            applyFilterCountryAndDemographicsReducer(
                state,
                state.allEntries,
                state.filterQuery,
                action.payload.demographic,
                state.secondaryFilterDemographic
            );
            applyCurrentGroupStats(state);
        },
        setSecondaryFilterDemographic: (state, action: PayloadAction<{ demographic: ObservationDemographics|null }>) => {
            state.secondaryFilterDemographic = action.payload.demographic;
            state.currentRow = 0;
            state.currentColumn = 0;
            applyFilterCountryAndDemographicsReducer(
                state,
                state.allEntries,
                state.filterQuery,
                state.primaryFilterDemographic,
                action.payload.demographic
            );
            applyCurrentGroupStats(state);
        },
        setSelectedObservationId: (state, action: PayloadAction<{ id: number|null }>) => {
            state.selectedObservationId = action.payload.id;
        },
        setSelectedObservation: (state, action: PayloadAction<{ o: Observation|null }>) => {
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
        },
        setAnimationInProgress: (state, action: PayloadAction<{ value: boolean }>) => {
            state.animationInProgress = action.payload.value;
        },
        nextOnboardingStep: (state, action: PayloadAction<void>) => {
            if (state.currentOnboardingStepIndex < ONBOARDING_STEPS_LIST.length - 1) {
                state.currentOnboardingStepIndex += 1;
                state.currentOnboardingMessageStepIndex = 0;
                state.selectedObservationId = null;
            } else {
                console.warn('no more onboarding steps available');
            }
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
        setViewportWidth: (state, action: PayloadAction<{width: number}>) => {
            state.viewportWidth = action.payload.width;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchAllVizData.pending, (state, action) => {
            if (state.loadingState === 'idle') {
                state.loadingState = 'pending'
            }
        }),
            builder.addCase(fetchAllVizData.fulfilled, (state, action) => {
                state.loadingState = 'complete';
                state.allEntries = formatAllEntriesStore(action.payload);
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
            }),
            builder.addCase(fetchAllVizData.rejected, (state, action) => {
                state.loadingState = 'error';
            })
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
    uiSetSelect,
    setPrimaryFilterDemographic,
    setSecondaryFilterDemographic,
    setSelectedObservationId,
    setCurrentRow,
    nextOnboardingStep,
    setOnboardingObjectPositions,
    nextOnboardingMessage,
} = rawDataSlice.actions

// store set up
export const store = configureStore({
    middleware: [thunk],
    reducer: {
        rawData: rawDataSlice.reducer,
    },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
