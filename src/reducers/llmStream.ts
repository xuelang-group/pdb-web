import { createSlice, PayloadAction } from '@reduxjs/toolkit';


// 对象列表
export const llmStreamSlice = createSlice({
  name: 'llmStream',
  initialState: {
    open: true,
    stream: []
  },
  reducers: {
    toggle: (state, action: PayloadAction<boolean>) => {
      state.open = action.payload;
    },
    setStream: (state, action: PayloadAction<any>) => {
      state.stream = action.payload;
    }
  }
});

export const { toggle, setStream } = llmStreamSlice.actions;
export default llmStreamSlice.reducer;