'use client'

import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UserState {
    user: {
        id?: string;
        nickname?: string;
    };
}

const initialState: UserState = {
    user: {},
};

export const userSlice = createSlice({
    name: 'contest',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<string>) => {
            state.user.id = action.payload;
        },
        setAttributes: (state, action: PayloadAction<string>) => {
            state.user.nickname = action.payload;
        }
    },
})

export const { setUser, setAttributes } = userSlice.actions

// Other code such as selectors can use the imported `RootState` type
// export const selectCount = (state: RootState) => state.contest.contest

export default userSlice.reducer