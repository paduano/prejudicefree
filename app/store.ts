import { configureStore, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import thunk from 'redux-thunk';

import { createSlice } from '@reduxjs/toolkit'
import { AllEntriesStore, AltObservationQuery, AltStatsAndQuery, filterAndStatObservationsWithVariations, filterAndStatsObservations, formatAllEntriesStore, getEmptyStats, Observation, ObservationDemographics, ObservationQuery, StatsAccumulator, ValuesQuery } from './observation';


// Define a type for the slice state
interface StoreState {
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
    selectedObservationId: number|null;
}

export type SelectTypes = 'country' | 'value' | 'demographic';

export interface UISelect {
        current ?: SelectTypes;
        params: any;
}

interface RequestError {
    errorMessage: string
}

export const fetchAllVizData = createAsyncThunk<any /* ret value*/, {smallDataset?: boolean} | void/* req parameter */, { rejectValue: RequestError }>(
    'vizdata/all',
    async (params, thunkAPI) => {
        try {
            const {smallDataset} = params ? params : {smallDataset: false};
            const url = smallDataset ? 'http://localhost:3000/out_100.json' : 'http://localhost:3000/out.json';
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
    filterStats: getEmptyStats(),
    altStatsAndQueries: [],

    loadingState: 'idle',
    uiSelect: {
        current: undefined,
        params: {},
    },
    // primaryFilterDemographic: undefined,
    primaryFilterDemographic: 'age',
    secondaryFilterDemographic: undefined,
    selectedObservationId: null,
}

const applyObservationsQueryReducer = (state: StoreState, allEntries: AllEntriesStore, filterQuery: ObservationQuery) => {
    const {filteredEntries, stats, altStatsAndQuery} = filterAndStatObservationsWithVariations(allEntries, filterQuery);
    state.filteredEntries = filteredEntries;
    state.filterStats = stats;
    state.altStatsAndQueries = altStatsAndQuery;
    console.log(`alt stats: ${altStatsAndQuery}`)
}

export const rawDataSlice = createSlice({
    name: 'counter',
    initialState,
    reducers: {
        updateObservationsQuery: (state, action: PayloadAction<Partial<ObservationQuery>>) => {
            state.filterQuery = Object.assign({}, state.filterQuery, action.payload);
            applyObservationsQueryReducer(state, state.allEntries, state.filterQuery);
        },
        updateValuesQuery: (state, action: PayloadAction<ValuesQuery>) => {
            state.valuesQuery = Object.assign({}, state.valuesQuery, action.payload);
        },
        uiSetSelect: (state, action: PayloadAction<Partial<UISelect>>) => {
            state.uiSelect = Object.assign({}, state.uiSelect, {current: action.payload.current, params: action.payload.params ?? {}});
        },
        setPrimaryFilterDemographic: (state, action: PayloadAction<{demographic?: ObservationDemographics}>) => {
            state.primaryFilterDemographic = action.payload.demographic;
        },
        setSecondaryFilterDemographic: (state, action: PayloadAction<{ demographic?: ObservationDemographics }>) => {
            state.secondaryFilterDemographic = action.payload.demographic;
        },
        setSelectedObservationId: (state, action: PayloadAction<{ id?: number}>) => {
            state.selectedObservationId = action.payload.id;
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
            state.filterQuery = {country_codes: ['840']};
            applyObservationsQueryReducer(state, state.allEntries, state.filterQuery);
        }),
        builder.addCase(fetchAllVizData.rejected, (state, action) => {
            state.loadingState = 'error';
        })
    }
});

// actions
export const { updateObservationsQuery, updateValuesQuery, uiSetSelect, setPrimaryFilterDemographic, setSecondaryFilterDemographic, setSelectedObservationId} = rawDataSlice.actions

// store set up
export const store = configureStore({
    middleware: [thunk],
    reducer: {
        rawData: rawDataSlice.reducer,
    },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch