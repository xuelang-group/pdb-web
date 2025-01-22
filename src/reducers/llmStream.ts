import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Params {
  query: string;
  data: any;
}

interface llmStreamState {
  open: boolean;
  params?: any;
  stream: string[];
}

const initialState: llmStreamState = {
  open: false,
  stream: []
}
// 对象列表
export const llmStreamSlice = createSlice({
  name: 'llmStream',
  initialState,
  reducers: {
    toggle: (state, action: PayloadAction<boolean>) => {
      state.open = action.payload;
    },
    setStream: (state, action: PayloadAction<any>) => {
      state.stream = action.payload;
    },
    setParams: (state, action: PayloadAction<any>) => {
      state.params = action.payload
    }
  }
});

export const { toggle, setStream, setParams } = llmStreamSlice.actions;
export default llmStreamSlice.reducer;