import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import papa from 'papaparse';
import { isEmpty, orderBy, remove, findLastIndex, map, filter, forEach } from 'lodash';
import { Col } from '@/pages/indicator/components/CONSTS'

const funcOptionsObj = {
  'string': ["count", "most frequent"],
  'int': ["sum", "avg", "median", "min", "max"],
  'float': ["sum", "avg", "median", "min", "max"],
  'datetime': ["最早", "最晚"],
  'boolean': ["count", "占比"],
}

interface Record {
  [key: string]: any;
}

interface MergeCell {
  col: number[];
  row: number[];
}


interface MetricParams {
  dimention: string;        // 指标度量
  func: string;             // 统计算法
  groupBy: string[];        // Group By
}
interface IndicatorState {
  checkId: string | null;
  editId: string | null;
  csv: any[];               // csv数据获取后暂存
  records: Record[];        // 表格数据
  columns: Col[];           // 表头数据
  disabledField: string[];    // 禁用列的field
  dimention: string;        // 指标度量
  func: string;             // 统计算法
  groupByResult: Record[];  // 分组的计算结果
  result: Record[];         // 总计的计算结果
  groupBy: string[];        // Group By
  mergeCell: MergeCell;     // 分组的计算结果在表格中合并单元格
  funcOptions: string[]; // 统计算法选项
  list: any[];
}

// 使用该类型定义初始 state
const initialState: IndicatorState = {
  checkId: null,
  editId: null,
  csv: [],
  records: [],
  columns: [],
  disabledField: [],
  dimention: '',
  func: '',
  groupByResult: [],
  result: [],
  groupBy: [],
  funcOptions: [],
  mergeCell: { col: [], row: [] },
  list: [],
}

const updateData = (data: any[], metricParams: MetricParams, groupByResult: Record[], disabledField:string[]) => {
  const cols: string[] = data[0];  // CSV的第一行：表头
  const types: string[] = data[1]; // CSV的第二行：数据类型
  const rows = data.slice(2);  

  const { dimention, func, groupBy } = metricParams;
      
  /** 表头数据 */
  const columns: Col[] = map(cols, (field, i) => {
    const col: Col = {
      field,
      type: types[i],
      disabled: disabledField.includes(field),
      checked: dimention === field,
    };
    if (!isEmpty(groupBy)) {
      // 分组合并单元格
      col.mergeCell = groupBy.includes(field)
    }
    // if (col.type === 'float') {
    //   col["fieldFormat"] = (record: { Progress: number; }) => `${Math.round(record.Progress * 100)}%`;
    // }
    return col;
  });

  // 指标度量在倒数第一列，若未设置将整数或浮点数作为度量列
  if (dimention) {
    const col = remove(columns, (item) => item.field === dimention);
    if (!isEmpty(col)) {
      columns.push(col[0])
    }
  }
  // 分组在右侧，指标度量在左侧
  if (!isEmpty(groupBy)) {
    forEach(groupBy, (field, i) => {
      const col = remove(columns, (item) => item.field === field);
      if (!isEmpty(col)) {
        columns.splice(i, 0, col[0])
      }
    })
  } 

  let records: Record[] = map(rows, (row) => {
    const item: Record = {}
    row.forEach((value: any, i: number) => {
      item[`${cols[i]}`] = value;
    })
    return item;
  });
  // groupBy 不为空时，根据groupBy排序
  if (!isEmpty(groupBy)) {
    records = orderBy(records, groupBy)
  }
  if (!isEmpty(groupByResult)) {
    forEach(groupByResult, item => {
      // 计算结果中的分组
      const keys = Object.keys(item).filter(key => key !== dimention);
      const record: Record = {
        ...item,
        merge: keys.length
      }
      const index = findLastIndex(records, (row: any) => {
        const count = filter(keys, (gb) => row[gb] == record[gb])
        return count.length === keys.length
      })
      records.splice(index+1, 0, record)
    })
  }
  
  const mergeCell: MergeCell = { col: groupBy.map((gb, i) => i), row: [] }
  records.forEach((row, i) => {
    if (row["merge"]) mergeCell.row.push(i+1)
  })

  return { columns, records, mergeCell}
}

const updateFuncOptions = (columns: any[], dimention: string) => {
  const colObj = columns.find(item => item.field === dimention)
  let funcOptions: string[] = [];
  if (colObj && colObj.type in funcOptionsObj) {
    funcOptions = funcOptionsObj[colObj.type as keyof typeof funcOptionsObj];
  } else {
    funcOptions = []
  }

  return funcOptions
}

export const indicatorSlice = createSlice({
  name: 'indicator',
  initialState,
  reducers: {
    setTableData: (state, action: PayloadAction<any>) => {
      const result = papa.parse<any[]>(action.payload);
      state.csv = result.data;
      
      const { dimention, func, groupBy, groupByResult, disabledField } = state;
      const { columns, records, mergeCell } = updateData(state.csv, {dimention, func, groupBy}, groupByResult, disabledField);

      state.mergeCell = mergeCell;
      state.records = records;
      state.columns = columns;
      state.funcOptions = updateFuncOptions(columns, dimention);
    },
    updateDisabledField: (state, action: PayloadAction<any>) => {
      const { col, value } = action.payload;
      let disabledField: string[] = [];
      const field = state.columns[col].field;
      if (value) {
        // 禁用
        disabledField = [...state.disabledField, field]
      } else {
        // 启用
        disabledField = filter(state.disabledField, item => item != field)
      }
      state.disabledField = disabledField;
      state.columns = map(state.columns, (item,i) => ({
        ...item,
        disabled: disabledField.includes(item.field)
      }))
    },
    setFuncResult: (state, action: PayloadAction<any>) => {
      const { group_by_result, result } = action.payload;
      
      state.groupByResult = group_by_result;
      state.result = result;

      const { dimention, func, groupBy, groupByResult, disabledField } = state;
      const { columns, records, mergeCell } = updateData(state.csv, {dimention, func, groupBy}, groupByResult, disabledField);
    
      state.mergeCell = mergeCell;
      state.records = records;
      state.columns = columns;
      state.funcOptions = updateFuncOptions(columns, dimention);
    },
    setMetrics: (state, action: PayloadAction<any>) => {
      state.list = action.payload;
    },
    setGroupBy: (state, action: PayloadAction<any>) => {
      state.groupBy = action.payload; 

      const { dimention, func, groupBy, groupByResult, disabledField } = state;
      console.log('group by disabled: ', disabledField)
      const { columns, records, mergeCell } = updateData(state.csv, {dimention, func, groupBy}, groupByResult, disabledField);
    
      state.mergeCell = mergeCell;
      state.records = records;
      state.columns = columns;
      state.funcOptions = updateFuncOptions(columns, dimention);
    },
    setDimention: (state, action: PayloadAction<any>) => {
      state.dimention = action.payload;
      
      state.func = '';

      const { dimention, func, groupBy, groupByResult, disabledField } = state;
      const { columns, records, mergeCell } = updateData(state.csv, {dimention, func, groupBy}, groupByResult, disabledField);
    
      state.mergeCell = mergeCell;
      state.records = records;
      state.columns = columns;
      state.funcOptions = updateFuncOptions(columns, dimention);
    },
    setFunc: (state, action: PayloadAction<any>) => {
      state.func = action.payload;
    },
    setCheckId: (state, action: PayloadAction<any>) => {
      state.checkId = action.payload;
      state.editId = null;
    },
    setEditId: (state, action: PayloadAction<any>) => {
      state.editId = action.payload;
      state.checkId = null;
    },
    exit: (state) => {
      state.editId = null;
      state.checkId = null;
    },
  }
})

export const { setTableData, updateDisabledField, setFuncResult, setMetrics, setGroupBy, setDimention, setFunc, setCheckId, setEditId, exit } = indicatorSlice.actions
export default indicatorSlice.reducer