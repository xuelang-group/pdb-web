import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface systemInfoState {
  reqUserId: string // 请求用户ID
  userId: string // 用户ID
  appId: string // 应用ID
  nodeId: string // 节点ID
  graphId: number | null // 项目ID
}
interface ListState {
  systemInfo: systemInfoState // 系统信息
  collapsed: boolean
  catalog: any
  pageLoading: boolean
}

const initialState: ListState = {
  systemInfo: {
    reqUserId: "",
    userId: "",
    appId: "",
    nodeId: "",
    graphId: null
  },
  pageLoading: false,
  collapsed: true,
  catalog: [{ "id": 2, "label": "我的项目", "folder": true, "children": [] }],
}

// 对象列表
export const listSlice = createSlice({
  name: 'list',
  initialState,
  reducers: {
    setSystemInfo: (state, action: PayloadAction<systemInfoState>) => {
      state.systemInfo = JSON.parse(JSON.stringify(action.payload));
    },
    setCollapsed: (state, action: PayloadAction<boolean>) => {
      state.collapsed = action.payload;
    },
    setCatalog: (state, action: PayloadAction<any>) => {
      state.catalog = JSON.parse(JSON.stringify(action.payload));
    },
    setPageLoading: (state, action: PayloadAction<boolean>) => {
      state.pageLoading = action.payload;
    },
  }
});

export const { setCollapsed, setCatalog, setSystemInfo, setPageLoading } = listSlice.actions;
export default listSlice.reducer;