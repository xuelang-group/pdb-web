import { queryApi } from '@/actions/query';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CsvHeaderState {

}
export interface CsvState {
  header: CsvHeaderState[]
}

export interface ConditionState {
  'name': string // 属性名称
  'function': string // 属性条件
  'value': any // 属性值
  'not'?: boolean // 不具备条件
  'connectives'?: string // 连接关系
}

export interface BindState {
  'source': string // 源对象类型ID
  'source.attr': string // 源对象属性名称
  'target': string // 目标对象类型ID
  'target.attr': string // 目标对象属性名称
}

export interface PqlState {
  'id': string // 对象类型或关系类型ID
  'type': string // 类型，object或relation
  'name'?: string // 类型名称
  'conditions'?: ConditionState[] // 过滤条件
  'binds'?: BindState[] // 数据联接
  'bindtype'?: string // 数据连接计算方式
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
    api: queryApi['pql'],
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