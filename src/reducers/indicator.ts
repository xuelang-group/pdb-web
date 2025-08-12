import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import papa from 'papaparse';
import { isEmpty, orderBy, remove, findLastIndex, map, filter, forEach, findIndex } from 'lodash';
import { Col } from '@/pages/indicator/components/CONSTS'
import { funcOptionsObj } from '@/utils/common';

export interface Record {
  [key: string]: any;
}

export interface MergeCell {
  col: number[];
  row: number[];
}

interface ExtraCol {
  name: string;
  formula: string;
}

interface MetricParams {
  dimension: string;        // 指标度量
  func: string;             // 统计算法
  groupBy: string[];        // Group By
}
interface IndicatorState {
  requestId: string | null; // requestId，从门户跳转过来时带上的，后续请求会用到
  needCheckId: string | null; // 从门户跳转过来时带上需要查看的指标id，需要在拿到指标列表后查看该id的指标
  needEditId: string | null; // 从门户跳转过来时带上需要编辑的指标id，需要在拿到指标列表后编辑该id的指标
  needVersionId: string | null; // 从门户跳转过来时带上需要查看历史版本的指标id，需要在拿到指标列表后查看该id的历史版本
  checkId: string | null;   // 当前正在查看的指标id
  editId: string | null;    // 当前正在编辑的指标id
  loading: boolean;         // csv数据获取loading
  csv: any[];               // csv数据获取后暂存
  records: Record[];        // 表格数据
  columns: Col[];           // 表头数据
  extraColumns: ExtraCol[];
  selectedColumns: {[key: number]: Col}; 
  disabledField: string[];  // 禁用列的field
  dimentionInitial: string; // 指标度量(数据初始化时的默认度量)
  dimension: string;        // 指标度量
  func: string;             // 统计算法
  groupByResult: Record[];  // 分组的计算结果
  result: Record[];         // 总计的计算结果
  groupBy: string[];        // Group By
  mergeCell: MergeCell;     // 分组的计算结果在表格中合并单元格
  groupByNameDict: Record;
  funcOptions: string[]; // 统计算法选项
  list: any[];
  modalVisible: boolean;
  updateModalVisible: boolean;
  currentBuzProcess: any;
  checkVersionList: any[] | null;
  nowCheckVersion: any | null;
  nextShowConfiguration: any | null;
}

// 使用该类型定义初始 state
const initialState: IndicatorState = {
  requestId: null ,  // 暂时写死，默认值1001
  needCheckId: null,
  needEditId: null,
  needVersionId: null,
  checkId: null,
  editId: null,
  loading: false,
  csv: [],
  records: [],
  columns: [],
  extraColumns: [],
  selectedColumns: {},
  disabledField: [],
  dimentionInitial: '',
  dimension: '',
  func: '',
  groupByResult: [],
  result: [],
  groupBy: [],
  funcOptions: [],
  mergeCell: { col: [], row: [] },
  groupByNameDict: {},
  list: [],
  modalVisible: false,
  updateModalVisible: false,
  currentBuzProcess: {},
  checkVersionList: null,
  nowCheckVersion: null,
  nextShowConfiguration: null,
}

const getValue = (value: any, type: string) => {
  if (type === 'float' || type === 'int') {
    return Number(value);
  }
  if (type === 'boolean') {
    return Boolean(value);
  }
  return value;
}

export const updateData = (data: any[], metricParams: MetricParams, groupByResult: Record[], groupByNameDict: Record, disabledField: string[] =[]) => {
  const cols: string[] = data[0];  // CSV的第一行：表头
  const types: string[] = data[1]; // CSV的第二行：数据类型
  const rows = data.slice(2);

  const { dimension, groupBy } = metricParams;
  /** 表头数据 */
  const columns: Col[] = map(cols, (field, i) => {
    const col: Col = {
      field,
      type: types[i],
      disabled: disabledField.includes(field),
      checked: dimension === field,
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
  if (dimension) {
    const col = remove(columns, (item) => item.field === dimension);
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
      item[`${cols[i]}`] = getValue(value, types[i]);
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
      const record: Record = {        
        [`${dimension}`]: item.value,
        merge: item.group_by.length
      }
      // const keys = Object.keys(item).filter(key => key !== dimension);
      const keys: string[] = [];
      forEach(item.group_by, gb => {
        Object.keys(gb).forEach(key => {
          const dimens = groupByNameDict[key];
          keys.push(dimens);
          record[`${dimens}`] = gb[key];
        })
      })
      const index = findLastIndex(records, (row: any) => {
        const count = filter(keys, (gb) => row[gb] == record[gb])
        return count.length === keys.length
      })
      if (index > -1) {
        records.splice(index + 1, 0, record)        
      }
    })
  }

  const mergeCell: MergeCell = { col: groupBy.map((gb, i) => i), row: [] }
  records.forEach((row, i) => {
    if (row["merge"]) mergeCell.row.push(i + 1)
  })

  return { columns, records, mergeCell }
}

const updateFuncOptions = (columns: any[], dimension: string) => {
  const colObj = columns.find(item => item.field === dimension)
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
    resetData: (state) => {
      state.csv = [];
      state.mergeCell = { col: [], row: [] };
      state.records = [];
      state.columns = [];
      state.disabledField = [];
      state.dimentionInitial = '';
      state.dimension = '';
      state.func = '';
      state.groupByResult = [];
      state.result = [];
      state.groupBy = [];
      state.groupByNameDict = {};
      state.funcOptions = [];
      state.selectedColumns = {}
    },
    setTableData: (state, action: PayloadAction<any>) => {
      if (action.payload) {
        const result = papa.parse<any[]>(action.payload);
        state.csv = result.data;
        // 数据初始化，默认将整数或浮点数类型作为度量列，若无则最后一列做为度量列
        const index = findLastIndex(state.csv[1], (type: string) => ['int', 'float', 'number'].includes(type));
        const endIndex = state.csv[0].length - 1;
        const dimension = index > -1 ? state.csv[0][index] : state.csv[0][endIndex];
        state.dimentionInitial = dimension;
        state.dimension = dimension;
        
        const { func, groupBy, groupByResult, groupByNameDict, disabledField } = state;
        const { columns, records, mergeCell } = updateData(state.csv, {dimension, func, groupBy}, groupByResult, groupByNameDict, disabledField);

        state.mergeCell = mergeCell;
        state.records = records;
        state.columns = columns;
        state.funcOptions = updateFuncOptions(columns, dimension);
      }
    },
    addRecords: (state, action: PayloadAction<any>) => {
      const result = papa.parse<any[]>(action.payload);
      const data = result.data.slice(2);
      state.csv = state.csv.concat(data);

      const { dimension, func, groupBy, groupByResult, groupByNameDict, disabledField } = state;
      const { records, mergeCell } = updateData(state.csv, {dimension, func, groupBy}, groupByResult, groupByNameDict, disabledField);

      state.mergeCell = mergeCell;
      state.records = records;
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
        disabledField = filter(state.disabledField, item => item !== field)
      }
      state.disabledField = disabledField;
      state.columns = map(state.columns, (item, i) => ({
        ...item,
        disabled: disabledField.includes(item.field)
      }))
    },
    setFuncResult: (state, action: PayloadAction<any>) => {
      const { result, group_by_name_dict } = action.payload;
      // const { name, name_cn } = action.payload.dimension;
      state.groupByNameDict = group_by_name_dict;
      // 使用解构赋值
      const [first, ...group_by_result] = result;
      state.groupByResult = group_by_result;
      state.result = [first];

      const { func, groupBy, groupByResult, groupByNameDict, disabledField, dimension } = state;
      const { columns, records, mergeCell } = updateData(state.csv, { dimension, func, groupBy }, groupByResult, groupByNameDict, disabledField);

      state.mergeCell = mergeCell;
      state.records = records;
      state.columns = columns;
      state.funcOptions = updateFuncOptions(columns, dimension);
    },
    setMetrics: (state, action: PayloadAction<any>) => {
      state.list = action.payload;
    },
    updateExtraColumns: (state, action: PayloadAction<any>) => {
      const { name, formula } = action.payload
      const index = findIndex(state.extraColumns, {name: name})
      if (index === -1) {
        state.extraColumns = [...state.extraColumns, {name, formula}]
      } else {
        state.extraColumns = map(state.extraColumns, (item, i) => index === i ? ({...item, formula}) : {...item})
      }
    },
    setExtraColumns: (state, action: PayloadAction<any>) => {
      state.extraColumns = action.payload || []; 
    },
    updateSelectedColumns: (state, action: PayloadAction<any>) => {
      if(!action.payload) {
        state.selectedColumns = {}
      } else {
        const { col, value } = action.payload
        const selectedCols: {[key:number]: Col} = { ...state.selectedColumns }
        if (!value) {
          delete selectedCols[col]
        } else {
          selectedCols[col] = value
        }
        state.selectedColumns = selectedCols
      }
    },
    setGroupBy: (state, action: PayloadAction<any>) => {
      state.groupBy = action.payload; 
      
      if (isEmpty(state.csv)) return

      const { func, groupBy, groupByResult, groupByNameDict, disabledField, dimension } = state;
      const { columns, records, mergeCell } = updateData(state.csv, {dimension, func, groupBy}, groupByResult, groupByNameDict, disabledField);
    
      state.mergeCell = mergeCell;
      state.records = records;
      state.columns = columns;
      state.funcOptions = updateFuncOptions(columns, dimension);
    },
    setDimension: (state, action: PayloadAction<any>) => {
      state.dimension = action.payload;
      state.func = '';
      state.groupByResult = [];
      state.result = [];
      
      if (isEmpty(state.csv)) return

      const { func, groupBy, groupByResult, groupByNameDict, disabledField, dimension } = state;
      const { columns, records, mergeCell } = updateData(state.csv, { dimension, func, groupBy }, groupByResult, groupByNameDict, disabledField);
      
      state.mergeCell = mergeCell;
      state.records = records;
      state.columns = columns;
      state.funcOptions = updateFuncOptions(columns, dimension);
    },
    setFunc: (state, action: PayloadAction<any>) => {
      state.func = action.payload;
      if (!action.payload) {
        state.groupByResult = [];
        state.result = [];
        if (state.csv) {
          const { func, groupBy, groupByResult, groupByNameDict, disabledField, dimension } = state;
          const { columns, records, mergeCell } = updateData(state.csv, { dimension, func, groupBy }, groupByResult, groupByNameDict, disabledField);
          
          state.mergeCell = mergeCell;
          state.records = records;
          state.columns = columns;
          state.funcOptions = updateFuncOptions(columns, dimension);
        }
      }
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
    setUpdateModalVisible: (state, action: PayloadAction<any>) => {
      state.updateModalVisible = action.payload;
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
    setNeedVersionId: (state, action: PayloadAction<any>) => {
      state.needVersionId = action.payload;
    },
    setCurrentBuzProcess: (state, action: PayloadAction<any>) => {
      state.currentBuzProcess = action.payload;
    },
    setcheckVersionList: (state, action: PayloadAction<any>) => {
      state.checkVersionList = action.payload;
    },
    setNowCheckVersion: (state, action: PayloadAction<any>) => {
      state.nowCheckVersion = action.payload;
    },
    setNextShowConfiguration: (state, action: PayloadAction<any>) => {
      state.nextShowConfiguration = action.payload;
    }
  }
})

export const { setLoading, resetData, setTableData, addRecords, updateDisabledField, setFuncResult, setMetrics, setGroupBy, setDimension, 
  setFunc, setCheckId, setEditId, setModalVisible, setRequestId, setNeedCheckId, setNeedEditId, setCurrentBuzProcess,
  setUpdateModalVisible, setcheckVersionList, setNowCheckVersion, setNeedVersionId, setNextShowConfiguration, exit, updateSelectedColumns, updateExtraColumns, setExtraColumns
} = indicatorSlice.actions

export default indicatorSlice.reducer