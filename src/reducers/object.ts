import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Parent {
  uid: string
  id?: string
  'x_index'?: number
  'x_name'?: string
  'x_children'?: number
}

interface LatestVersionConfig {
  uid: string
  'v.version': string
}

export interface ObjectConfig {
  'uid': string
  'x_name': string
  'e_x_parent': Array<Parent>
  'x_type_name': string
  'x.last_change': any
  'x.created': any
  'x_children': number
  'x_metadata': string
  'x_version'?: boolean
  'x_checkout'?: boolean
  'x_latest_version': LatestVersionConfig
  [key: string]: any
}


export interface CustomObjectConfig extends ObjectConfig {
  'currentParent': Parent
  'collapsed'?: boolean
  'x.id': string
  'id': string
}

interface GraphDataState {
  'templateId': number
  'namespace': number
}
export interface ObjectGraphDataState {
  'id': number
  'data': GraphDataState
  'name': string
  'type': string
  'dir': number
  'description': string
  'gmt_modified'?: string
  'gmt_create'?: string
}

interface ObjectState {
  data: Array<CustomObjectConfig>
  graphData: ObjectGraphDataState | {}
}

// 使用该类型定义初始 state
const initialState: ObjectState = {
  data: [],
  graphData: {}
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