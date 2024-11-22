import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type AttrType = 'string' | 'int' | 'float' | 'datetime' | 'bool';
type DatetimeFormat = 'YYYY-MM-DD' | 'YYYY-MM-DD hh' | 'YYYY-MM-DD hh:mm' | 'YYYY-MM-DD hh:mm:ss';

export interface AttrConfig {
  "name": string // 属性名称
  "display": string // 展示名称
  "type": AttrType // 类型
  "default"?: any // 默认值
  "required"?: true // 是否必填
  "datetimeFormat"?: DatetimeFormat // 日期时间格式
  "override"?: boolean // 类型属性是否为继承而来
}

export interface TypePrototypeConfig {
  id: string // 父对象类型ID
  versionId: string // 父对象版本ID
}
export interface TypeConfig {
  'x.type.id': string // 对象类型ID
  'x.type.name': string // 对象类型名称
  'x.type.metadata': string // 元数据
  'x.type.editor': string // 创建人
  'x.type.prototype': Array<TypePrototypeConfig> // 继承类型
  'x.type.version': boolean // 开启类型版本控制
  'x.type.attrs': Array<AttrConfig | null> // 属性列表
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
          if (newData[i]['x.type.id'] === name) {
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
  const timestamp = new Date().getTime();

  return {
    "x.type.name": '新类型',
    "x.type.attrs": [],
    "x.type.last_change": timestamp,
    "x.type.created": timestamp,
    "x.type.prototype": []
  }
};

export const { setTypes, setTypeDetail, reset } = typeSlice.actions
export default typeSlice.reducer