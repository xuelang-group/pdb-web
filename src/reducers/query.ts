import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CsvHeaderState {

}
export interface CsvState {
  header: CsvHeaderState[]
}

export interface ConditionState {
  name: string
  function: string
  value: any
  not?: boolean
  connectives?: string
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
    api: '/pdb/api/v1/object/search/pql',
    params: initialParams
  },
  reducers: {
    setApi: (state, action: PayloadAction<string>) => {
      state.api = action.payload;
    },
    setQueryParams: (state, action: PayloadAction<ParamsState>) => {
      state.params = JSON.parse(JSON.stringify(action.payload));
    },
    clearQuery: (state) => {
      state.params = JSON.parse(JSON.stringify(initialParams));
    }
  }
});

export const { setQueryParams, setApi, clearQuery } = querySlice.actions;
export default querySlice.reducer;