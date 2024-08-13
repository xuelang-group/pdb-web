import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AttrConfig {
  // 属性类型，包括 int, float, string, text, boolean, datetime, list, refer
  "type": string
  // 主键
  "name": string
  // 展示名称
  "label": string
  // 是否必填
  "required": true
  // 默认值
  "default"?: any
  "search": string  // 索引类型，动态扩展
  // string 类型时
  "stringMaxLength"?: number
  // datetime 类型时
  "datetimeFormat"?: string
  // list 类型时，字段类型，包括 int， float， string
  "listType"?: string
  // list 类型时，枚举列表
  "listEnums"?: Array<any>
  // refer 类型时，选择对象
  "referObject"?: string
  // refer 类型时，选择属性
  "referProperty"?: string
  "override"?: string
}
export interface TypeConfig {
  'x_type_name': string
  'x.type.label': string
  'x.type.metadata'?: string
  'x.type.attrs': Array<AttrConfig | null>
  'x.type.prototype': Array<string | null>
  'x.type.version': boolean
  'x.type.last_change': number
  'x.type.created': number
}

interface TypeState {
  data: Array<TypeConfig>
}

// 使用该类型定义初始 state
const initialState: TypeState = {
  data: []
}

// 对象列表
export const typeSlice = createSlice({
  name: 'type',
  initialState,
  reducers: {
    reset: (state) => initialState,
    setTypes: (state, action: PayloadAction<Array<TypeConfig>>) => {
      state.data = JSON.parse(JSON.stringify(action.payload));
    },
    setTypeDetail: (state, action: PayloadAction<{ name?: string, options: any, index?: number }>) => {
      const { name, options, index } = action.payload;
      if (!name && (typeof index !== 'number' || index < 0)) return;
      const newData = JSON.parse(JSON.stringify(state.data));
      if (name) {
        for (let i = 0; i < newData.length; i++) {
          if (newData[i]['x_type_name'] === name) {
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

export const getDefaultTypeConfig = () => {
  const timestamp = new Date();

  return {
    "x.type.label": '新类型',
    "x.type.attrs": [],
    "x.type.last_change": timestamp,
    "x.type.created": timestamp,
    "x.type.prototype": []
  }
};

export const { setTypes, setTypeDetail, reset } = typeSlice.actions
export default typeSlice.reducer