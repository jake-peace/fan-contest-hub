'use client'

import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'

interface ContestState {
  contestId?: string;
  editionId?: string;
}

const initialState: ContestState = {};

export const contestSlice = createSlice({
  name: 'contest',
  initialState,
  reducers: {
    setContest: (state, action: PayloadAction<string>) => {
      state.contestId = action.payload;
    },
    clearContest: (state) => {
      state.contestId = initialState.contestId;
    },
    setEdition: (state, action: PayloadAction<string>) => {
      state.editionId = action.payload
    },
    clearEdition: (state) => {
      state.editionId = initialState.editionId;
    }
  },
})

export const { setContest, clearContest, setEdition, clearEdition } = contestSlice.actions

// Other code such as selectors can use the imported `RootState` type
export const selectCount = (state: RootState) => state.contest.contestId

export default contestSlice.reducer