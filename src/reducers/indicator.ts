import { createSlice, PayloadAction } from '@reduxjs/toolkit';


// 使用该类型定义初始 state
const initialState: any = {
  list: [],
  disableType: {}, // 左侧对象类型列表不可拖拽项
  graphData: {},
  graphSavedMsg: {
    status: '',
    msg: ''
  }
}

export const indicatorSlice = createSlice({
  name: 'indicator',
  // `createSlice` 将从 `initialState` 参数推断 state 类型
  initialState,
  reducers: {
    getCsv: (state, action: PayloadAction<any>) => {
      state.graphSavedMsg = JSON.parse(JSON.stringify({ ...state.graphSavedMsg, ...action.payload }));
    },
    setMetrics: (state, action: PayloadAction<any>) => {
      state.list = action.payload;
    }
  }
})

export const { getCsv, setMetrics } = indicatorSlice.actions
export default indicatorSlice.reducer