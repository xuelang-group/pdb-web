import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ossState {
  bucket: string
  endpoint: string
  ossAccessKey: string
  ossAccessSecret: string
}
interface systemInfoState {
  userId: number | null
  appId: number | null
  nodeId: string
  graphId: number | null
  ossBucket: string
  ossEndpoint: string
  ossType: string
}
interface ListState {
  systemInfo: systemInfoState
  collapsed: boolean
  catalog: any
}

const initialState: ListState = {
  systemInfo: {
    userId: null,
    appId: null,
    nodeId: "",
    graphId: null,
    ossBucket: "suanpan",
    ossEndpoint: "",
    ossType: "minio"
  },
  collapsed: true,
  catalog: [{ "id": 2, "label": "我的项目", "folder": true, "children": [] }]
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
    }
  }
});

export const { setCollapsed, setCatalog, setSystemInfo } = listSlice.actions;
export default listSlice.reducer;