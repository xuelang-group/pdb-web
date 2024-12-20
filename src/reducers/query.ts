import { queryApi } from '@/actions/query';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CsvHeaderState {
  'index': number
  'typeId': string
  'attrId': string
  'attrName'?: string
  'attrType'?: string
}
export interface CsvState {
  'header': CsvHeaderState[]
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
  'graphId': number | null
  'pql': PqlState[][]
  'csv': CsvState
}


export interface PqlResultParamsState {
  'children': string[]
  'relations': string[]
}

export interface QueryState {
  'api': string
  'params': ParamsState
  'pqlResultParams': PqlResultParamsState
}

export const initialParams = {
  'graphId': null,
  'pql': [[]],
  'csv': {
    'header': []
  }
};

const initialState: QueryState = {
  'api': queryApi['pql'],
  'params': initialParams,
  'pqlResultParams': {
    'children': [],
    'relations': []
  } // 根据搜索结果获取子对象需要的数据
}

export const querySlice = createSlice({
  name: 'query',
  initialState,
  reducers: {
    setApi: (state, action: PayloadAction<string>) => {
      state.api = action.payload;
    },
    setQueryParams: (state, action: PayloadAction<ParamsState>) => {
      state.params = JSON.parse(JSON.stringify(action.payload));
    },
    setPqlResultParams: (state, action: PayloadAction<PqlResultParamsState>) => {
      state.pqlResultParams = JSON.parse(JSON.stringify(action.payload));
    },
    clearQuery: (state) => {
      state.params = JSON.parse(JSON.stringify(initialParams));
      state.pqlResultParams = {
        children: [],
        relations: []
      };
    }
  }
});

export const { setQueryParams, setApi, clearQuery, setPqlResultParams } = querySlice.actions;
export default querySlice.reducer;