import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RelationConfig } from './relation';
import { TypeConfig } from './type';

export interface ConstraintState {
  type: string
  [key: string]: any
}
export interface TemplateMetadataState extends TypeConfig {
  'x.type.constraints': Array<ConstraintState>
}
export interface ObjectState {
  type: string // 类型唯一id
  metadata: TemplateMetadataState
}

export interface ConnectionObjectState {
  process: string // 类型的实例化id
  'x.type.label': string
}

export interface TemplateRelationConfig extends RelationConfig {
  'r.constraints': ConstraintState
}
export interface ConnectionState {
  'r.type.name': string
  // source 和 target 是模板中线（关系）的一个表征，当一键实例化模板时，在对象实例间进行一个初步的关系建立
  src: ConnectionObjectState
  tgt: ConnectionObjectState
  metadata: TemplateRelationConfig
}
export interface ProcessState {
  [key: string]: ObjectState
}
export interface TemplateGraphDataState {
  version: string
  tid: string // 模板id
  name: string
  description: string
  processes: ProcessState // 对象类型实例化
  connections: Array<ConnectionState> // 关系连线
  last_change?: string
  created?: string
}

export interface GraphSavedMsgState {
  status: string,
  msg: string
}

export interface TemplateListState {
  id: string
  gmt_create: string
  gmt_modified: string
  user_id: string
  name: string
  description: string
  dir: number
  type: string
}

export interface TemplateState {
  list: TemplateListState[]
  disableType: any
  graphData: TemplateGraphDataState | {}
  graphSavedMsg: GraphSavedMsgState
}

// 使用该类型定义初始 state
const initialState: TemplateState = {
  list: [],
  disableType: {}, // 左侧对象类型列表不可拖拽项
  graphData: {},
  graphSavedMsg: {
    status: '',
    msg: ''
  }
}

export const templateSlice = createSlice({
  name: 'template',
  // `createSlice` 将从 `initialState` 参数推断 state 类型
  initialState,
  reducers: {
    reset: (state) => initialState,
    setTemplateList: (state, action: PayloadAction<TemplateListState[]>) => {
      state.list = JSON.parse(JSON.stringify(action.payload));
    },
    setGraphData: (state, action: PayloadAction<any>) => {
      state.graphData = JSON.parse(JSON.stringify({ ...state.graphData, ...action.payload }));
    },
    addDisableType: (state, action: PayloadAction<any>) => {
      state.disableType = { ...state.disableType, ...action.payload };
    },
    removeDisableType: (state, action: PayloadAction<any>) => {
      if (state.disableType[action.payload]) {
        delete state.disableType[action.payload];
      }
    },
    setGraphSavedMsg: (state, action: PayloadAction<any>) => {
      state.graphSavedMsg = JSON.parse(JSON.stringify({ ...state.graphSavedMsg, ...action.payload }));
    },
  }
})

export const { addDisableType, removeDisableType, reset, setGraphData, setGraphSavedMsg, setTemplateList } = templateSlice.actions
export default templateSlice.reducer