import { createSlice, PayloadAction } from '@reduxjs/toolkit';
export interface QueryItemData<T, U> {
  name: string
  type: T
  match: string
  condition: U
}

export interface IdConditionState {
  uid: Array<string>
}

export interface NameConditionState {
  match:
  'eq' | //字段名称完全相等
  'allofterms' | //  条件匹配，对象名称字段必须包含names中所有文字
  'anyofterms' // 条件匹配，对象名称包含names中任意一个文字
  names: Array<string>
}

export interface AttrConditionState {
  connectives?: string // 逻辑运算
  name: string // 属性名称，可以是用户定义的属性或者pdb内置属性 x.name, x.parent等
  function: string
  value?: any
}

export interface TypeConditionState {
  type: Array<string> // 类型列表
  attrs?: Array<AttrConditionState> // 对象属性
  constraints?: Array<AttrConditionState> // 对象关系
}

enum QueryTypes {
  Uid = 'uid',
  Name = 'x.name',
  Type = 'x.type.name'
}

export type QueryConditionState =
  QueryItemData<QueryTypes.Uid, IdConditionState> |
  QueryItemData<QueryTypes.Name, NameConditionState> |
  QueryItemData<QueryTypes.Type, TypeConditionState>;

export interface QueryItemState {
  name: string
  type: string
  match: string
  condition: any
}

export interface StatusState {
  loading: boolean
}

export interface QueryResultState {
  index: number
  name: string
  data: any
}

export interface QueryState {
  list: QueryItemState[]
  status: StatusState[]
  result: QueryResultState[]
}

// 使用该类型定义初始 state
const initialState: QueryState = {
  list: [],
  status: [],
  result: []
};

// 对象列表
export const querySlice = createSlice({
  name: 'query',
  initialState,
  reducers: {
    setQueryState: (state, action: PayloadAction<Array<QueryState>>) => {
      state.status = JSON.parse(JSON.stringify(action.payload));
    },
    setList: (state, action: PayloadAction<Array<QueryItemState>>) => {
      state.list = JSON.parse(JSON.stringify(action.payload));
    },
    setResult: (state, action: PayloadAction<Array<any>>) => {
      state.result = JSON.parse(JSON.stringify(action.payload));
    }
  }
});

export const { setQueryState, setList, setResult } = querySlice.actions;
export default querySlice.reducer;