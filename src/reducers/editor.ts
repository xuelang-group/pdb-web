import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { EdgeConfig, NodeConfig } from '@antv/g6';
import { TypeConfig } from './type';
import { ObjectConfig } from './object';
import { RelationConfig } from './relation';
import { set } from 'lodash';

export interface EdgeItemData extends EdgeConfig {
  'id': string
  'label': string
}
export interface NodeItemData extends NodeConfig {
  'id': string // 对象节点ID
  'xid'?: string // 对象节点层级ID
  'comboId'?: string // 所属combo id
  'data': ObjectConfig // 原始数据
  'isDisabled'?: boolean // 是否灰化
  'totalPage'?: number // 分页数量
  'nextDisabled'?: boolean // 下一页是否灰化
}

export interface TypeItemData extends NodeConfig {
  'id': string
  'label': string
  'data': TypeConfig
}
export interface RelationTargetConfig {
  uid: string
  'x_name': string
}
export interface ObjectRelationConig {
  target: RelationTargetConfig
  relation: string
  override?: boolean
  attrValue?: any
}

export interface RelationsConfig {
  [key: string]: Array<ObjectRelationConig>
}

export interface RelationMapConfig {
  [key: string]: RelationConfig
}

interface TypeMapConfig {
  [key: string]: TypeConfig
}
interface FilterConfig {
  target: string
  typeName: string
}

interface ToolbarItemConfig {
  relationLines: RelationsConfig
  showRelationLine: boolean
  showRelationLabel: boolean
  filters: Array<FilterConfig>
  pageSize?: number
}

interface ToolbarConfig {
  [key: string]: ToolbarItemConfig
}

// 画布当前状态
type GraphTabKey =
  "main" | // 全量的数据画布
  "explore" | // 全局搜索后的数据画布
  "vertex" // 探索后的数据画布

interface EditorState {
  currentGraphTab: string // 对象管理 - 画布当前tab
  graphDataMap: any
  multiEditModel: Array<NodeItemData> | null // 对象管理 - 多个选中编辑
  rootNode: ObjectConfig // 对象管理 - 根节点数据
  relationMap: RelationMapConfig // 对象管理 - 关系Map，根据关系ID快速获取关系信息
  typeMap: TypeMapConfig // 对象管理 - 对象类型Map，根据关系ID快速获取对象类型信息
  toolbarConfig: ToolbarConfig // 对象管理 - 工具栏,每个tab都有对应的工具栏
  currentEditModel: NodeItemData | EdgeItemData | TypeItemData | null // 所有 - 单个选中编辑
  isEditing: boolean
  showSearch: boolean
  typeRelationMap: {}
  graphLoading: boolean
  typeLoading: boolean
  relationLoading: boolean
  indicatorLoading: boolean
  searchAround: any
  screenShootTimestamp: number
  templateScreenShootTimestamp: number
}

// 使用该类型定义初始 state
const initialState: EditorState = {
  currentGraphTab: 'main',
  graphDataMap: {},
  multiEditModel: null,
  rootNode: {
    "x.type.id": "",
    "x.object.id": "",
    "x.object.name": ""
  },
  relationMap: {},
  typeMap: {},
  toolbarConfig: {
    'main': {
      relationLines: {},
      showRelationLine: false, // 显示类型连线
      showRelationLabel: false, // 显示类型名称
      filters: [],
      pageSize: undefined
    },
    'explore': {
      relationLines: {},
      showRelationLine: false,
      showRelationLabel: false,
      filters: []
    },
    'vertex': {
      relationLines: {},
      showRelationLine: false,
      showRelationLabel: false,
      filters: []
    }
  },
  currentEditModel: null,
  isEditing: true,
  typeRelationMap: {},
  showSearch: false, //显示搜索框
  graphLoading: false,
  typeLoading: false,
  relationLoading: false,
  indicatorLoading: false,
  searchAround: {
    show: false,
    options: []
  },
  screenShootTimestamp: 0,
  templateScreenShootTimestamp: 0
}

export const editorSlice = createSlice({
  name: 'editor',
  // `createSlice` 将从 `initialState` 参数推断 state 类型
  initialState,
  reducers: {
    reset: (state) => initialState,
    setRootNode: (state, action: PayloadAction<ObjectConfig>) => {
      state.rootNode = action.payload;
    },
    setGraphDataMap: (state, action: PayloadAction<any>) => {
      state.graphDataMap = JSON.parse(JSON.stringify(action.payload));
    },
    setTypeRelationMap: (state, action: PayloadAction<any>) => {
      state.typeRelationMap = JSON.parse(JSON.stringify(action.payload));
    },
    setCurrentGraphTab: (state, action: PayloadAction<string>) => {
      state.currentGraphTab = action.payload;
    },
    setCurrentEditModel: (state, action: PayloadAction<NodeItemData | EdgeItemData | TypeItemData | null>) => {
      state.currentEditModel = JSON.parse(JSON.stringify(action.payload));
    },
    setIsEditing: (state, action: PayloadAction<boolean>) => {
      // state.isEditing = action.payload;
    },
    setMultiEditModel: (state, action: PayloadAction<Array<NodeItemData | EdgeItemData | TypeItemData> | null>) => {
      state.multiEditModel = JSON.parse(JSON.stringify(action.payload));
    },
    setRelationMap: (state, action: PayloadAction<RelationMapConfig>) => {
      state.relationMap = JSON.parse(JSON.stringify(action.payload));
    },
    setTypeMap: (state, action: PayloadAction<TypeMapConfig>) => {
      state.typeMap = JSON.parse(JSON.stringify(action.payload));
    },
    setToolbarConfig: (state, action: PayloadAction<{ config: any, key: string }>) => {
      const { key, config } = action.payload;
      const newToolbarConfig = JSON.parse(JSON.stringify(state.toolbarConfig));
      Object.assign(newToolbarConfig[key], { ...config });
      state.toolbarConfig = newToolbarConfig;
    },
    setShowSearch: (state, action: PayloadAction<boolean>) => {
      state.showSearch = action.payload;
    },
    addToolbarConfig: (state, action: PayloadAction<string>) => {
      const newToolbarConfig = JSON.parse(JSON.stringify(state.toolbarConfig));
      Object.assign(newToolbarConfig, {
        [action.payload.toString()]: {
          relationLines: {},
          showRelationLine: false,
          showRelationLabel: false,
          filters: [],
          filterMap: {
            type: {},
            relation: {}
          }
        }
      });
      state.toolbarConfig = newToolbarConfig;
    },
    deleteToolbarConfig: (state, action: PayloadAction<string>) => {
      const newToolbarConfig = JSON.parse(JSON.stringify(state.toolbarConfig));
      delete newToolbarConfig[action.payload];
      state.toolbarConfig = newToolbarConfig;
    },
    setGraphLoading: (state, action: PayloadAction<boolean>) => {
      state.graphLoading = action.payload;
    },
    setTypeLoading: (state, action: PayloadAction<boolean>) => {
      state.typeLoading = action.payload;
    },
    setRelationLoading: (state, action: PayloadAction<boolean>) => {
      state.relationLoading = action.payload;
    },
    setIndicatorLoading: (state, action: PayloadAction<boolean>) => {
      state.indicatorLoading = action.payload;
    },
    setSearchAround: (state, action: PayloadAction<any>) => {
      state.searchAround = action.payload;
    },
    setScreenShootTimestamp: (state, action: PayloadAction<number>) => {
      state.screenShootTimestamp = action.payload;
    },
    setTScreenShootTimestamp: (state, action: PayloadAction<number>) => {
      state.templateScreenShootTimestamp = action.payload;
    },
    // setRelationLines: (state, action: PayloadAction<RelationsConfig>) => {
    //   state.relationLines = JSON.parse(JSON.stringify(action.payload));
    // },
    // setShowRelationLine: (state, action: PayloadAction<boolean>) => {
    //   state.showRelationLine = action.payload;
    // },
    // setShowRelationLable: (state, action: PayloadAction<boolean>) => {
    //   state.showRelationLabel = action.payload;
    // },
  }
});

export const { setCurrentEditModel, reset, setRootNode, setRelationMap, setTypeMap, setMultiEditModel, setToolbarConfig, setSearchAround,
  addToolbarConfig, deleteToolbarConfig, setCurrentGraphTab, setShowSearch, setTypeRelationMap, setGraphLoading,
  setRelationLoading, setTypeLoading, setGraphDataMap, setScreenShootTimestamp, setTScreenShootTimestamp, setIsEditing, setIndicatorLoading
} = editorSlice.actions
export default editorSlice.reducer