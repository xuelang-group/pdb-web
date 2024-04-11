import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ConstraintsConfig {
  'r.binds': Array<any>
  [key: string]: any
}
export interface RelationConfig {
  'r.type.name': string
  'r.type.label': string
  'r.type.constraints': ConstraintsConfig
  'r.type.prototype': Array<string | null>
  'r.type.last_change': number
  'r.type.created': number
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
          if (newData[i]['r.type.name'] === name) {
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
  const timestamp = new Date();

  return {
    "r.type.label": '新类型',
    "r.type.constraints": { 'r.binds': [] },
    "r.type.prototype": [],
    "r.type.last_change": timestamp,
    "r.type.created": timestamp,
  }
};

export const { setRelations, setRelationDetail, reset } = typeSlice.actions
export default typeSlice.reducer