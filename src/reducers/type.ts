import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type AttrType = 'string' | 'int' | 'float' | 'datetime' | 'bool';
type DatetimeFormat = 'YYYY-MM-DD' | 'YYYY-MM-DD hh' | 'YYYY-MM-DD hh:mm' | 'YYYY-MM-DD hh:mm:ss';
/**
 * 版本状态暂定
 * 0-草稿
 * 1-待审核
 * 2-已发布
 */
export type VersionState = 0 | 1 | 2;
export interface AttrConfig {
  "name": string // 属性名称
  "display": string // 展示名称
  "type": AttrType // 类型
  "required": true // 是否必填
  "default"?: any // 默认值
  "datetimeFormat"?: DatetimeFormat // 日期时间格式
  "override"?: boolean // 类型属性是否为继承而来
}

export interface TypePrototypeConfig {
  'x.type.id': string // 父对象类型ID
  'x.type.version.id': string // 父对象版本ID
}

export interface TypeVersionConfig {
  'x.type.version'?: boolean // 开启类型版本控制
  'x.type.version.id': string  // 类型版本ID
  'x.type.version.name': string // 类型版本名称
  'x.type.version.description': string // 类型版本描述
  'x.type.prev.version.id': string // 上个版本对象类型版本ID
  'x.type.next.version.id': string // 下个版本对象类型版本ID
  'x.type.version.created': number // 版本创建时间
  'x.type.version.updated': number // 版本修改时间
  'x.type.version.state': VersionState // 版本状态
  'x.type.version.editor': string // 版本创建人
  'x.type.version.prototype'?: TypePrototypeConfig // 继承类型
  'x.type.version.attrs'?: Array<AttrConfig> // 属性列表
}
export interface TypeConfig extends TypeVersionConfig {
  'x.type.id': string // 对象类型ID
  'x.type.name': string // 对象类型名称
  'x.type.metadata': string // 元数据
  'x.type.editor': string // 创建人
  'x.type.created': number // 类型创建时间
  'x.type.updated': number // 类型修改时间
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
    setTypeDetail: (state, action: PayloadAction<{ id: string, options: any }>) => {
      const { id, options } = action.payload;
      if (!id) return;
      const newData = JSON.parse(JSON.stringify(state.data));
      for (let i = 0; i < newData.length; i++) {
        if (newData[i]['x.type.id'] === id) {
          Object.assign(newData[i], options);
          break;
        }
      }
      state.data = newData;
    }
  }
});

export const getDefaultTypeConfig = () => {
  const timestamp = new Date().getTime();

  return {
    "x.type.name": '新类型',
    "x.type.version.attrs": [],
    "x.type.updated": timestamp,
    "x.type.created": timestamp,
    "x.type.version.prototype": {}
  }
};

export const { setTypes, setTypeDetail, reset } = typeSlice.actions
export default typeSlice.reducer