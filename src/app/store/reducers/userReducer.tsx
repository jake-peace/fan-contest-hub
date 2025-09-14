'use client'

import { User } from '@/types/Contest';
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UserState {
    user?: User;
}

const initialState: UserState = {
    user: {
        id: "user_alpha",
        name: "Alex Parker",
        email: "alex.parker@example.com"
    },
};

export const userSlice = createSlice({
    name: 'contest',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
        }
    },
})

export const { setUser } = userSlice.actions

// Other code such as selectors can use the imported `RootState` type
// export const selectCount = (state: RootState) => state.contest.contest

export default userSlice.reducer