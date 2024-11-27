import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AttrConfig } from './type';

// 废弃字段
// interface ConstraintsConfig {
//   'r.binds': Array<any>
//   [key: string]: any
// }

interface BindConfig {
  source: string
  target: string
  override?: boolean
}
export interface RelationConfig {
  'r.type.id': string
  'r.type.name': string
  'r.type.binds': BindConfig[]
  'r.type.attrs': AttrConfig[]
  // 'r.type.constraints': ConstraintsConfig 废弃字段
  'r.type.prototype'?: Array<string | null>
  'r.type.last_change'?: number
  'r.type.created'?: number
}

interface RelationState {
  data: Array<RelationConfig>
}

// 使用该类型定义初始 state
const initialState: RelationState = {
  data: []
}

// 对象列表
export const typeSlice = createSlice({
  name: 'type',
  initialState,
  reducers: {
    reset: (state) => initialState,
    setRelations: (state, action: PayloadAction<Array<RelationConfig>>) => {
      state.data = JSON.parse(JSON.stringify(action.payload));
    },
    setRelationDetail: (state, action: PayloadAction<{ name?: string, options: any, index?: number }>) => {
      const { name, options, index } = action.payload;
      if (!name && (typeof index !== 'number' || index < 0)) return;
      const newData = JSON.parse(JSON.stringify(state.data));
      if (name) {
        for (let i = 0; i < newData.length; i++) {
          if (newData[i]['r.type.id'] === name) {
            Object.assign(newData[i], options);
            break;
          }
        }
      } else if (index && index >= 0) {
        Object.assign(newData[index], options);
      }
      state.data = newData;
    }
  }
});

export const getDefaultRelationConfig = () => {
  const timestamp = new Date().getTime();

  return {
    "r.type.name": '新类型',
    "r.type.attrs": [],
    "r.type.binds": [],
    "r.type.prototype": [],
    "r.type.last_change": timestamp,
    "r.type.created": timestamp,
  }
};

export const { setRelations, setRelationDetail, reset } = typeSlice.actions
export default typeSlice.reducer