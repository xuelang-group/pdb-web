import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import papa from 'papaparse';
import { findIndex, isEmpty, orderBy, remove, findLastIndex, map, filter, forEach, groupBy, cloneDeep } from 'lodash';
import { Col } from '@/pages/indicator/components/CONSTS'

// demo 数据
// const records = [
//   {
//     "Project Name": "Marketing",
//     "Task Name": "Market Research",
//     "Assigned To": "Alice",
//     "Start Date": "2024/01/01",
//     "Days Required": 13,
//     "End Date": "2024/01/14",
//     "Progress": 0.78
//   }, {
//     "Project Name": "Marketing",
//     "Task Name": "Content Creation",
//     "Assigned To": "Bob",
//     "Start Date": "2024/01/01",
//     "Days Required": 14,
//     "End Date": "2024/01/14",
//     "Progress": 0.68
//   }, {
//     "Project Name": "Marketing",
//     "Task Name": "Social Media Planning",
//     "Assigned To": "Charlie",
//     "Start Date": "2024/01/03",
//     "Days Required": 22,
//     "End Date": "2024/01/14",
//     "Progress": 0.58
//   }, {
//     "Project Name": "Marketing",
//     "Task Name": "Campaign Analysis",
//     "Assigned To": "Daisy",
//     "Start Date": "2024/01/03",
//     "Days Required": 25,
//     "End Date": "2024/01/14",
//     "Progress": 0.48
//   }, {
//     "Project Name": "Product Dev",
//     "Task Name": "Prototype Development",
//     "Assigned To": "Ethan",
//     "Start Date": "2024/01/01",
//     "Days Required": 18,
//     "End Date": "2024/01/14",
//     "Progress": 0.38
//   }, {
//     "Project Name": "Product Dev",
//     "Task Name": "Quality Assurance",
//     "Assigned To": "Fiona",
//     "Start Date": "2024/01/01",
//     "Days Required": 10,
//     "End Date": "2024/01/14",
//     "Progress": 0.78
//   }, {
//     "Project Name": "Product Dev",
//     "Task Name": "User Interface Design",
//     "Assigned To": "Gabriel",
//     "Start Date": "2024/01/04",
//     "Days Required": 25,
//     "End Date": "2024/01/14",
//     "Progress": 0.28
//   }, {
//     "Project Name": "Customer Svc",
//     "Task Name": "Service Improvement",
//     "Assigned To": "Hannah",
//     "Start Date": "2024/01/04",
//     "Days Required": 25,
//     "End Date": "2024/01/14",
//     "Progress": 0.18
//   }, {
//     "Project Name": "Customer Svc",
//     "Task Name": "Ticket Resolution",
//     "Assigned To": "lan",
//     "Start Date": "2024/01/01",
//     "Days Required": 22,
//     "End Date": "2024/01/14",
//     "Progress": 0.08
//   }, {
//     "Project Name": "Customer Svc",
//     "Task Name": "Customer Feedback",
//     "Assigned To": "Julia",
//     "Start Date": "2024/01/01",
//     "Days Required": 25,
//     "End Date": "2024/01/14",
//     "Progress": 0.78
//   }, {
//     "Project Name": "Financial",
//     "Task Name": "Budget Analysis",
//     "Assigned To": "Kevin",
//     "Start Date": "2024/01/01",
//     "Days Required": 30,
//     "End Date": "2024/01/14",
//     "Progress": 0.68
//   }, {
//     "Project Name": "Financial",
//     "Task Name": "Financial Reporting",
//     "Assigned To": "Mark",
//     "Start Date": "2024/01/01",
//     "Days Required": 22,
//     "End Date": "2024/01/14",
//     "Progress": 0.58
//   }, {
//     "Project Name": "Financial",
//     "Task Name": "Investment Planning",
//     "Assigned To": "Sam",
//     "Start Date": "2024/01/01",
//     "Days Required": 21,
//     "End Date": "2024/01/14",
//     "Progress": 0.48
//   }, {
//     "Project Name": "Research",
//     "Task Name": "Market Trends Analysis",
//     "Assigned To": "Nathan",
//     "Start Date": "2024/01/01",
//     "Days Required": 25,
//     "End Date": "2024/01/14",
//     "Progress": 0.38
//   }, {
//     "Project Name": "Research",
//     "Task Name": "Data Collection",
//     "Assigned To": "Olivia",
//     "Start Date": "2024/01/01",
//     "Days Required": 23,
//     "End Date": "2024/01/14",
//     "Progress": 0.28
//   }, {
//     "Project Name": "Research",
//     "Task Name": "Research Paper Writing",
//     "Assigned To": "Peter",
//     "Start Date": "2024/01/01",
//     "Days Required": 32,
//     "End Date": "2024/01/14",
//     "Progress": 0.18
//   }, {
//     "Project Name": "Development",
//     "Task Name": "Software Development",
//     "Assigned To": "Quinn",
//     "Start Date": "2024/01/01",
//     "Days Required": 27,
//     "End Date": "2024/01/14",
//     "Progress": 0.08
//   }, {
//     "Project Name": "Development",
//     "Task Name": "Feature Enhancement",
//     "Assigned To": "Rachel",
//     "Start Date": "2024/01/01",
//     "Days Required": 36,
//     "End Date": "2024/01/14",
//     "Progress": 0.88
//   }, {
//     "Project Name": "Development",
//     "Task Name": "Code Review",
//     "Assigned To": "Sam",
//     "Start Date": "2024/01/01",
//     "Days Required": 30,
//     "End Date": "2024/01/14",
//     "Progress": 0.98
//   }, {
//     "Project Name": "Production",
//     "Task Name": "Manufacturing",
//     "Assigned To": "Tim",
//     "Start Date": "2024/01/01",
//     "Days Required": 47,
//     "End Date": "2024/01/14",
//     "Progress": 0.01
//   }, {
//     "Project Name": "Production",
//     "Task Name": "Manu facture",
//     "Assigned To": "Tim Smith",
//     "Start Date": "2024/01/01",
//     "Days Required": 47,
//     "End Date": "2024/01/14",
//     "Progress": 0.01
//   }
// ]

// const columns: Col[] = [{
//   "field": "Project Name",
//   "type": "string",
//   "mergeCell": true,
// }, {
//   "field": "Start Date",
//   "type": "datetime",
//   "mergeCell": true,
// }, {
//   "field": "Task Name",
//   "type": "string"
// }, {
//   "field": "Assigned To",
//   "type": "string",
//   "disabled": true
// }, {
//   "field": "Days Required",
//   "type": "int"
// }, {
//   "field": "End Date",
//   "type": "datetime"
// }, {
//   "field": "Progress",
//   "type": "float",
//   "checked": true,
//   "fieldFormat": (record: { Progress: number; }) => `${Math.round(record.Progress * 100)}%`,
// }]

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

interface IndicatorState {
  dataSource: Record[];
  checkId: string | null;
  editId: string | null;
  records: Record[];        // 表格数据
  columns: Col[];           // 表头数据
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
  dataSource: [],
  checkId: null,
  editId: null,
  records: [],
  columns: [],
  dimention: '',
  func: '',
  groupByResult: [
    // {"Project Name": "Customer Svc", "Progress_sum": 1}, {"Project Name": "Customer Svc", "Start Date": "2024/01/01", "Progress_sum": 1}, {"Project Name": "Development", "Progress_sum": 2}
  ],
  result: [],
  groupBy: [
    // 'Project Name', 'Start Date'
  ],
  funcOptions: [],
  mergeCell: { col: [], row: [] },
  list: [],
}

const getRecords = (source: Record[], func: string, groupBy: string[], groupByResult: Record[]) => {
  let records: Record[] = cloneDeep(source);
  // groupBy 不为空时，根据groupBy排序
  if (!isEmpty(groupBy)) {
    records = orderBy(records, groupBy)
  }
  if (!isEmpty(groupByResult)) {
    forEach(groupByResult, item => {
      // 计算结果中的分组
      const keys = Object.keys(item).filter(key => key.indexOf(`_${func}`) == -1);
      const record: Record = {
        ...item,
        merge: keys.length
      }
      const index = findLastIndex(records, (row: any) => {
        const count = filter(keys, (gb) => row[gb] === record[gb])
        return count.length === keys.length
      })
      records.splice(index+1, 0, record)
    })
  }
  return records
}

export const indicatorSlice = createSlice({
  name: 'indicator',
  initialState,
  reducers: {
    setTableData: (state, action: PayloadAction<any>) => {
      const result = papa.parse<any[]>(action.payload);
      const cols: string[] = result.data[0];  // CSV的第一行：表头
      const types: string[] = result.data[1]; // CSV的第二行：数据类型
      const rows = result.data.slice(2);
      
      /** 表头数据 */
      const columns: Col[] = map(cols, (field, i) => {
        const col: Col = { field, type: types[i] };
        if (!isEmpty(state.groupBy)) {
          // 分组合并单元格
          col.mergeCell = state.groupBy.includes(field)
        }
        if (state.dimention && state.dimention === field) {
          // 指标度量
          col.checked = true
        }
        if (col.type === 'float') {
          col["fieldFormat"] = (record: { Progress: number; }) => `${Math.round(record.Progress * 100)}%`;
        }
        return col;
      });
      // 指标度量在倒数第一列，若未设置将整数或浮点数作为度量列
      if (state.dimention) {
        const col = remove(columns, (item) => item.field === state.dimention);
        if (!isEmpty(col)) {
          columns.push(col[0])
        }
      }
      // 分组在右侧，指标度量在左侧
      if (!isEmpty(state.groupBy)) {
        forEach(state.groupBy, (field, i) => {
          const col = remove(columns, (item) => item.field === field);
          if (!isEmpty(col)) {
            columns.splice(i, 0, col[0])
          }
        })
      } 

      /** 表格数据 */
      const dataSource = rows.map((row) => {
        const item: Record = {}
        row.forEach((value, i) => {
          item[`${cols[i]}`] = value;
        })
        return item;
      })

      state.dataSource = dataSource;

      const records = getRecords(dataSource, state.func, state.groupBy, state.groupByResult);

      const mergeCell: MergeCell = { col: state.groupBy.map((gb, i) => i), row: [] }
      records.forEach((row, i) => {
        if (row["merge"]) mergeCell.row.push(i+1)
      })

      state.mergeCell = mergeCell;
      state.records = records;
      state.columns = columns;
    },
    setFuncResult: (state, action: PayloadAction<any>) => {
      const { group_by_result, result } = action.payload;
      state.groupByResult = group_by_result;
      state.result = result;

      const records = getRecords(state.dataSource, state.func, state.groupBy, state.groupByResult);

      const mergeCell: MergeCell = { col: state.groupBy.map((gb, i) => i), row: [] }
      records.forEach((row, i) => {
        if (row["merge"]) mergeCell.row.push(i+1)
      })
    
      state.mergeCell = mergeCell;
      state.records = records;
    },
    setMetrics: (state, action: PayloadAction<any>) => {
      state.list = action.payload;
    },
    setGroupBy: (state, action: PayloadAction<any>) => {
      state.groupBy = action.payload; 
      // 分组在右侧列
      if (!isEmpty(state.groupBy)) {
        state.groupBy.forEach((field, i) => {
          const col = remove(state.columns, (item) => item.field === field);
          if (!isEmpty(col)) {
            state.columns.splice(i, 0, col[0])
          }
        })

        // 根据分组排序
        const records = getRecords(state.dataSource, state.func, state.groupBy, state.groupByResult);

        const mergeCell: MergeCell = { col: state.groupBy.map((gb, i) => i), row: [] }
        records.forEach((row, i) => {
          if (row["merge"]) mergeCell.row.push(i+1)
        })
        state.mergeCell = mergeCell;
        state.records = records;
        // 分组列合并单元格
        state.columns = map(state.columns, (col) => ({...col, mergeCel: state.groupBy.includes(col.field)}))
      } 

    },
    setDimention: (state, action: PayloadAction<any>) => {
      const dimention = action.payload;
      // 度量列调整
      const col = remove(state.columns, (item) => item.field === dimention);
      if (!isEmpty(col)) {
        state.columns.push(col[0])
      }
      state.dimention = dimention;
      state.columns = map(state.columns, col => ({...col, checked: col.field === dimention}));
      state.func = '';
      const colObj = state.columns.find(item => item.field === dimention)
      if (colObj && colObj.type in funcOptionsObj) {
        state.funcOptions = funcOptionsObj[colObj.type as keyof typeof funcOptionsObj];
      } else {
        state.funcOptions = []
      }
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

export const { setTableData, setMetrics, setGroupBy, setDimention, setFunc, setCheckId, setEditId, exit } = indicatorSlice.actions
export default indicatorSlice.reducer