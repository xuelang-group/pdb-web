import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import appDefaultScreenshotPath from '@/assets/images/no_image_xly.png';

interface systemInfoState {
  userId: number | null
  appId: number | null
  nodeId: string
  graphId: number | null
}
interface ListState {
  systemInfo: systemInfoState
  collapsed: boolean
  catalog: any
  pageLoading: boolean
}

const initialState: ListState = {
  systemInfo: {
    userId: null,
    appId: null,
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