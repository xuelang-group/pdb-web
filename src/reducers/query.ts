import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CsvHeaderState {

}
export interface CsvState {
  header: CsvHeaderState[]
}

interface ConditionState {
  name: string
  function: string
  value: any
  not: boolean
}

export interface PqlState {
  id: string
  type: string
  name: string
  conditionRaw: string
  conditions: ConditionState[]
}

export interface ParamsState {
  graphId: string
  pql: PqlState[][]
  csv: CsvState
}

export interface QueryState {
  params: ParamsState
}

export const initialParams = {
  graphId: '',
  pql: [[]],
  csv: {
    header: []
  }
};

// 对象列表
export const querySlice = createSlice({
  name: 'query',
  initialState: {
    params: initialParams
  },
  reducers: {
    setQueryState: (state, action: PayloadAction<ParamsState>) => {
      state.params = JSON.parse(JSON.stringify(action.payload));
    }
  }
});

export const { setQueryState } = querySlice.actions;
export default querySlice.reducer;