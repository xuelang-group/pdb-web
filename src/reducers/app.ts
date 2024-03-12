import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ossState {
  bucket: string
  endpoint: string
  ossAccessKey: string
  ossAccessSecret: string
}
interface appConfigState {
  userId: string
  ossType: string
  appDataStoreType: string
  oss: ossState
}
interface ListState {
  appConfig: appConfigState
  collapsed: boolean
  catalog: any
}

const initialState: ListState = {
  appConfig: {
    userId: "",
    ossType: "",
    appDataStoreType: "",
    oss: {
      bucket: "",
      endpoint: "",
      ossAccessKey: "",
      ossAccessSecret: ""
    }
  },
  collapsed: true,
  catalog: [ { "id": 2, "label": "我的项目", "folder": true, "children": [{ "id": 3, "label": "nanfeng", "folder": true, "children": [{ "id": 6, "label": "nanfeng_test", "folder": true, "children": [] }] }, { "id": 4, "label": "商飞制造", "folder": true, "children": [{ "id": 5, "label": "backup", "folder": true, "children": [] }] }] }]
}

// 对象列表
export const listSlice = createSlice({
  name: 'list',
  initialState,
  reducers: {
    setAppConfig: (state, action: PayloadAction<appConfigState>) => {
      state.appConfig = JSON.parse(JSON.stringify(action.payload));
    },
    setCollapsed: (state, action: PayloadAction<boolean>) => {
      state.collapsed = action.payload;
    },
    setCatalog: (state, action: PayloadAction<any>) => {
      state.catalog = JSON.parse(JSON.stringify(action.payload));
    }
  }
});

export const { setCollapsed, setCatalog, setAppConfig } = listSlice.actions;
export default listSlice.reducer;