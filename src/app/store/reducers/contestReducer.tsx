'use client'

import { Contest, Edition } from '@/types/Contest';
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'

interface ContestState {
  contest?: Contest;
  edition?: Edition;
}

const initialState: ContestState = {};

export const contestSlice = createSlice({
  name: 'contest',
  initialState,
  reducers: {
    setContest: (state, action: PayloadAction<Contest>) => {
      state.contest = action.payload;
    },
    clearContest: (state) => {
      state.contest = initialState.contest;
    },
    setEdition: (state, action: PayloadAction<Edition>) => {
      state.edition = action.payload
    },
    clearEdition: (state) => {
      state.edition = initialState.edition;
    }
  },
})

export const { setContest, clearContest, setEdition, clearEdition } = contestSlice.actions

// Other code such as selectors can use the imported `RootState` type
export const selectCount = (state: RootState) => state.contest.contest

export default contestSlice.reducer