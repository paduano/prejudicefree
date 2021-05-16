import { configureStore, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import thunk from 'redux-thunk';

import { createSlice } from '@reduxjs/toolkit'
import { AllEntriesStore, AltObservationQuery, AltStatsAndQuery, filterAndStatObservationsWithVariations, filterAndStatsObservations, formatAllEntriesStore, getEmptyStats, Observation, ObservationQuery, StatsAccumulator, ValuesQuery } from './observation';


// Define a type for the slice state
interface StoreState {
    allEntries: AllEntriesStore,
    filteredEntries: Observation[]
    valuesQuery: ValuesQuery;
    filterQuery: ObservationQuery; 
    filterStats: StatsAccumulator; 
    altStatsAndQueries: AltStatsAndQuery[];
    loadingState: 'idle' | 'pending' | 'complete' | 'error'
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
    valuesQuery: {},
    filterStats: getEmptyStats(),
    altStatsAndQueries: [],
    loadingState: 'idle',
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
        updateValuesQuery: (state, action: PayloadAction<Partial<ValuesQuery>>) => {
            state.valuesQuery = Object.assign({}, state.valuesQuery, action.payload);
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
export const {updateObservationsQuery, updateValuesQuery} = rawDataSlice.actions

// store set up
export const store = configureStore({
    middleware: [thunk],
    reducer: {
        rawData: rawDataSlice.reducer,
    },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch