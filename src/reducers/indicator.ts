import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import papa from 'papaparse';
import { Col } from '@/pages/indicator/components/CONSTS'

interface Record {
  [key: string]: any;
}

interface IndicatorState {
  records: Record[];
  columns: Col[];
  dimention: string;  // 指标度量
  func: string;       // 统计算法
  groupBy: string[];  // Group By
}

// 使用该类型定义初始 state
const initialState: IndicatorState = {
  records: [],
  columns: [],
  dimention: '',
  func: '',
  groupBy: [],
}

export const indicatorSlice = createSlice({
  name: 'indicator',
  // `createSlice` 将从 `initialState` 参数推断 state 类型
  initialState,
  reducers: {
    setTableData: (state, action: PayloadAction<any>) => {
      const result = papa.parse<any[]>(action.payload);
      const cols: string[] = result.data[0];  // CSV的第一行：表头
      const types: string[] = result.data[1]; // CSV的第二行：数据类型
      // 指标度量在倒数第一列，若未设置将整数或浮点数作为度量列
      const index = cols.indexOf(state.dimention);
      const columns: Col[] = cols.map((field, i) => ({field, type: types[i]}));
      const records = result.data.slice(2).map((row) => {
        const item: Record = {}
        row.forEach((value, i) => {
          item[`${cols[i]}`] = value;
        })
        return item;
      })
      if (index > -1) {
        columns[index].checked = true;
        if (columns[index].type === 'float') {
          columns[index]["fieldFormat"] = (record: { Progress: number; }) => `${Math.round(record.Progress * 100)}%`;
        }
      }
      state.records = records;
      state.columns = columns;
    },
  }
})

export const { setTableData } = indicatorSlice.actions
export default indicatorSlice.reducer