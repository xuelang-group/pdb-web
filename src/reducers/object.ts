import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Parent {
  uid?: string
  id?: string
  src: string
  dst: number
  type: number
  name: string
  ranking: number
  props: any
}

interface LatestVersionConfig {
  uid: string
  'v_version': string
}

export interface ObjectConfig {
  'uid': string
  'x_name': string
  'e_x_parent': Array<Parent>
  'x_type_name': string
  'x_last_change': any
  'x_created': any
  'x_children': number
  'x_metadata': string
  'x_version'?: boolean
  'x_checkout'?: boolean
  'x_latest_version': LatestVersionConfig
  [key: string]: any
}


export interface CustomObjectConfig extends ObjectConfig {
  'currentParent': any
  'collapsed'?: boolean
  'x_id': string
  'id': string
}

interface GraphDataState {
  'url': string // 图数据库地址
  'space': string // 图数据库命名空间
}
export interface ObjectGraphDataState {
  'id': number | null // 项目ID
  'userId': string // 用户ID
  'appId': string // 应用ID
  'nodeId': string // 节点ID
  'name': string // 项目名称
  'description': string // 项目描述
  'data': GraphDataState
  'created': string // 项目创建时间
  'updated': string // 项目修改时间
  // 'type': string
  // 'dir': number
}

interface ObjectState {
  data: Array<CustomObjectConfig>
  graphData: ObjectGraphDataState
}

// 使用该类型定义初始 state
const initialState: ObjectState = {
  data: [],
  graphData: {
    id: null,
    userId: "",
    appId: "",
    nodeId: "",
    name: "",
    description: "",
    data: {
      url: "",
      space: ""
    },
    created: "",
    updated: ""
  }
}

// 对象列表
export const objectSlice = createSlice({
  name: 'object',
  initialState,
  reducers: {
    reset: (state) => initialState,
    setObjects: (state, action: PayloadAction<Array<CustomObjectConfig>>) => {
      state.data = JSON.parse(JSON.stringify(action.payload));
    },
    setGraphData: (state, action: PayloadAction<any>) => {
      state.graphData = JSON.parse(JSON.stringify(action.payload));
    },
    setObjectDetail: (state, action: PayloadAction<{ uid?: string, options: any, index?: number }>) => {
      const { uid, options, index } = action.payload;
      if (!uid && (typeof index !== 'number' || index < 0)) return;
      const newData = JSON.parse(JSON.stringify(state.data));
      if (uid) {
        for (let i = 0; i < newData.length; i++) {
          if (newData[i].uid === uid) {
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
})

export const { setObjects, setObjectDetail, reset, setGraphData } = objectSlice.actions
export default objectSlice.reducer