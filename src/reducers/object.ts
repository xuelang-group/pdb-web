import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { VersionState } from './type';

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

export const PAGINATION_TYPE = 'PAGINATION';

// 父对象信息
export interface ObjectParentInfo {
  'x.object.id': string // 父对象ID
  'x.object.version.id'?: string // 父对象版本ID
  'x.object.index'?: number // 顺序号
}

export interface ObjectRelationInfo {
  'r.type.id': string // 关系类型ID
  'r.object.source.id': string // 源对象ID
  'r.object.target.id': string // 目标对象ID
  'r.object.attrvalue'?: any // 关系属性键值对
}

export interface ObjectVersionConfig {
  'x.object.version'?: boolean // 开启版本控制
  'x.object.version.id'?: string // 对象版本ID
  'x.object.version.name'?: string // 对象版本名称
  'x.object.version.description'?: string // 对象版本描述
  'x.object.version.attrvalue'?: any // 属性值
  'x.object.version.created'?: number // 对象版本创建时间
  'x.object.version.updated'?: number // 对象版本修改时间
  'x.object.version.state'?: VersionState // 对象版本修改时间
  'x.object.version.parent'?: ObjectParentInfo // 父对象信息
  'x.object.version.relations'?: ObjectRelationInfo[] // 对象关系信息
  'x.object.version.childs'?: number // 子对象个数
}

export interface ObjectConfig extends ObjectVersionConfig {
  'x.type.id': string // 对象类型ID
  'x.type.version.id'?: string // 对象类型版本ID
  'x.object.id': string // 对象ID
  'x.object.name': string // 对象名称
  'x.object.metadata'?: string // 元数据
  'x.object.created'?: number // 对象创建时间
  'x.object.updated'?: number // 对象修改时间
  'x.object.editor'?: string // 创建人
}

export interface CustomObjectConfig extends ObjectConfig {
  'xid'?: string // 对象节点层级ID
  'collapsed'?: boolean // 是否折叠
  'totalPage'?: number // 分页数量
  'nextDisabled'?: boolean // 下一页是否灰化
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
    setObjectDetail: (state, action: PayloadAction<{ id: string, options: any }>) => {
      const { id, options } = action.payload;
      if (!id) return;
      const newData = JSON.parse(JSON.stringify(state.data)) as CustomObjectConfig[];
      for (let i = 0; i < newData.length; i++) {
        if (newData[i]['x.object.id'] === id) {
          Object.assign(newData[i], options);
          break;
        }
      }
      state.data = newData;
    }
  }
})

export const { setObjects, setObjectDetail, reset, setGraphData } = objectSlice.actions
export default objectSlice.reducer