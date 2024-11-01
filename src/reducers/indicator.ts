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
  requestId: string | null; // requestId，从门户跳转过来时带上的，后续请求会用到
  needCheckId: string | null; // 从门户跳转过来时带上需要查看的指标id，需要在拿到指标列表后查看该id的指标
  needEditId: string | null; // 从门户跳转过来时带上需要编辑的指标id，需要在拿到指标列表后编辑该id的指标
  checkId: string | null;   // 当前正在查看的指标id
  editId: string | null;    // 当前正在编辑的指标id
  loading: boolean;         // csv数据获取loading
  csv: any[];               // csv数据获取后暂存
  records: Record[];        // 表格数据
  columns: Col[];           // 表头数据
  disabledField: string[];  // 禁用列的field
  dimentionInitial: string; // 指标度量(数据初始化时的默认度量)
  dimention: string;        // 指标度量
  func: string;             // 统计算法
  groupByResult: Record[];  // 分组的计算结果
  result: Record[];         // 总计的计算结果
  groupBy: string[];        // Group By
  mergeCell: MergeCell;     // 分组的计算结果在表格中合并单元格
  funcOptions: string[]; // 统计算法选项
  list: any[];
  modalVisible: boolean;
  currentBuzProcess: String;
}

// 使用该类型定义初始 state
const initialState: IndicatorState = {
  requestId: null ,  // 暂时写死，默认值1001
  needCheckId: null,
  needEditId: null,
  checkId: null,
  editId: null,
  loading: false,
  csv: [],
  records: [],
  columns: [],
  disabledField: [],
  dimentionInitial: '',
  dimention: '',
  func: '',
  groupByResult: [],
  result: [],
  groupBy: [],
  funcOptions: [],
  mergeCell: { col: [], row: [] },
  list: [],
  modalVisible: false,
  currentBuzProcess: '',
}

const updateData = (data: any[], metricParams: MetricParams, groupByResult: Record[], disabledField: string[]) => {
  const cols: string[] = data[0];  // CSV的第一行：表头
  const types: string[] = data[1]; // CSV的第二行：数据类型
  const rows = data.slice(2);

  const { dimention, groupBy } = metricParams;

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
  // 指标度量在倒数第一列
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
      records.splice(index + 1, 0, record)
    })
  }

  const mergeCell: MergeCell = { col: groupBy.map((gb, i) => i), row: [] }
  records.forEach((row, i) => {
    if (row["merge"]) mergeCell.row.push(i + 1)
  })

  return { columns, records, mergeCell }
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
    setLoading: (state, action: PayloadAction<any>) => {
      state.loading = action.payload;
    },
    setTableData: (state, action: PayloadAction<any>) => {
      if (action.payload) {
        const result = papa.parse<any[]>(action.payload);
        state.csv = result.data;

        // 数据初始化，默认将整数或浮点数类型作为度量列，若无则最后一列做为度量列
        const index = findLastIndex(state.csv[1], (type: string) => ['int', 'float', 'number'].includes(type));
        const endIndex = state.csv[0].length - 1;
        const dimention = index > -1 ? state.csv[0][index] : state.csv[0][endIndex];
        state.dimentionInitial = dimention;
        state.dimention = dimention;
        
        const { func, groupBy, groupByResult, disabledField } = state;
        const { columns, records, mergeCell } = updateData(state.csv, {dimention, func, groupBy}, groupByResult, disabledField);

        state.mergeCell = mergeCell;
        state.records = records;
        state.columns = columns;
        state.funcOptions = updateFuncOptions(columns, dimention);
      } else {
        state.csv = [];
        state.mergeCell = { col: [], row: [] };
        state.records = [];
        state.columns = [];
        state.disabledField = [];
        state.dimentionInitial = '';
        state.dimention = '';
        state.func = '';
        state.groupByResult = [];
        state.result = [];
        state.groupBy = [];
        state.funcOptions = [];
      }
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
      state.columns = map(state.columns, (item, i) => ({
        ...item,
        disabled: disabledField.includes(item.field)
      }))
    },
    setFuncResult: (state, action: PayloadAction<any>) => {
      const { group_by_result, result } = action.payload;

      state.groupByResult = group_by_result;
      state.result = result;

      const { func, groupBy, groupByResult, disabledField, dimention } = state;
      const { columns, records, mergeCell } = updateData(state.csv, { dimention, func, groupBy }, groupByResult, disabledField);

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
      
      if (isEmpty(state.csv)) return

      const { func, groupBy, groupByResult, disabledField, dimention } = state;
      const { columns, records, mergeCell } = updateData(state.csv, {dimention, func, groupBy}, groupByResult, disabledField);
    
      state.mergeCell = mergeCell;
      state.records = records;
      state.columns = columns;
      state.funcOptions = updateFuncOptions(columns, dimention);
    },
    setDimention: (state, action: PayloadAction<any>) => {
      state.dimention = action.payload;
      state.func = '';
      state.groupByResult = [];
      state.result = [];
      
      if (isEmpty(state.csv)) return

      const { func, groupBy, groupByResult, disabledField, dimention } = state;
      const { columns, records, mergeCell } = updateData(state.csv, { dimention, func, groupBy }, groupByResult, disabledField);
      
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
    setModalVisible: (state, action: PayloadAction<any>) => {
      state.modalVisible = action.payload;
    },
    exit: (state) => {
      state.editId = null;
      state.checkId = null;
    },
    setRequestId: (state, action: PayloadAction<any>) => {
      state.requestId = action.payload;
    },
    setNeedCheckId: (state, action: PayloadAction<any>) => {
      state.needCheckId = action.payload;
    },
    setNeedEditId: (state, action: PayloadAction<any>) => {
      state.needEditId = action.payload;
    },
    setCurrentBuzProcess: (state, action: PayloadAction<any>) => {
      state.currentBuzProcess = action.payload;
    },
  }
})

export const { setLoading, setTableData, updateDisabledField, setFuncResult, setMetrics, setGroupBy, setDimention, setFunc, setCheckId, setEditId, setModalVisible, setRequestId, setNeedCheckId, setNeedEditId, setCurrentBuzProcess, exit } = indicatorSlice.actions

export default indicatorSlice.reducer