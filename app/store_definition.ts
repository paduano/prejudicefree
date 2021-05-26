import { configureStore } from "@reduxjs/toolkit"
import { analyticsMiddleware } from "./analytics"
import { rawDataSlice } from "./store"
import thunk from 'redux-thunk';

export const store = configureStore({
    middleware: [thunk, analyticsMiddleware],
    reducer: {
        rawData: rawDataSlice.reducer,
    },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
