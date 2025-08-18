import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import papa from "papaparse";
import { isArray, isEmpty, map } from "lodash";
import { ConditionState, ParamsState } from "./query";
import { MetricBasicInfo, MetricParams } from "./indicatorSimple";
import { Col } from "@/pages/indicator/components/CONSTS";
import { updateData, Record, MergeCell } from "./indicator";

export interface ColumnConfig {
  // 对齐列
  cols: Array<{
    typeId: any;
    attrId: string;
    attrName: string;
    attrType: string;
    metric: {
      id: string | number;
      name: string;
      name_cn: string;
    };
  }>;
  // 筛选条件
  conditions: ConditionState[];
  // 数据类型，等同 attrType
  type?: string;
  // 别名
  name: string;    // 默认为第一个col的 attrId
  name_cn: string; // 默认为第一个col的 attrName
  id: string;
}

interface IndicatorAdvanceState {
  basic_info?: MetricBasicInfo;
  graph_data: string;
  selected?: any;
  upstreams?: any[];
  calc?: {
    csv: Array<any[]>;
    records: Record[]; // 表格数据
    columns: Col[]; // 表头数据
    mergeCell: MergeCell; // 分组的计算结果在表格中合并单元格
    groupBy: string[];
    value: string | number;
    dimension: string;
  };  // 计算结果: 进行维度对齐后，计算结果有csv和result数组
  metric_params?: MetricParams;
  pql_params?: {
    api: string;
    params: ParamsState;
  };
  // 对齐配置
  column_config: Array<ColumnConfig>;
  // 代码编辑
  codeMode: boolean;
  readonly: boolean;
}

// 使用该类型定义初始 state
const initialState: IndicatorAdvanceState = {
  graph_data: "",
  selected: undefined,
  upstreams: undefined,
  calc: undefined,
  // 基本指标信息
  basic_info: {
    name: "",
    name_cn: "",
    type: 2, // 指标类型 1-初级指标 2-高级指标 xx-前端自定义
  },
  metric_params: {
    dimension: {
      name: "",
      name_cn: "",
    },
    func: "",
    group_by: [{ name: "", name_cn: "" }],
  },
  pql_params: undefined,
  column_config: [],
  codeMode: false,
  readonly: false,
};

export const indicatorAdvanceSlice = createSlice({
  name: "indicatorAdvance",
  initialState,
  reducers: {
    exitAdv: (state) => {
      state.selected = undefined;
      state.upstreams = undefined;
      state.calc = undefined;
      state.column_config = [];
      state.basic_info = undefined;
      state.metric_params = undefined;
      state.pql_params = undefined;
      state.graph_data = "";
      state.readonly = false;
      state.codeMode = false;
    },
    setSelected: (state, action: PayloadAction<any>) => {
      state.selected = action.payload;
    },
    setUpstreams: (state, action: PayloadAction<any[] | undefined>) => {
      state.upstreams = action.payload;
    },
    setCalc: (state, action: PayloadAction<any>) => {
      if (action.payload) {
        const { csv, result, dimension, group_by_name_dict } = action.payload;
        const { data } = papa.parse<any[]>(csv.trim());
        const groupBy = map(state.metric_params?.group_by, 'name');
        const [first, ...group_by_result] = result;
        const { columns, records, mergeCell } = updateData(
          data,
          { dimension: dimension.name, func: "", groupBy },
          group_by_result,
          group_by_name_dict,
        );
        state.calc = {
          csv: data,
          columns,
          records,
          mergeCell,
          groupBy,
          dimension: dimension.name,
          value: first?.value,
        };
      } else {
        state.calc = undefined;
      }
    },
    updateColumnConfig: (state, action: PayloadAction<ColumnConfig[]>) => {
      state.column_config = action.payload;
    },
    setMetricInfo: (state, action: PayloadAction<MetricBasicInfo>) => {
      state.basic_info = action.payload;
    },
    setMetricParams: (state, action: PayloadAction<MetricParams>) => {
      state.metric_params = action.payload;
    },
    setGraphData: (state, action: PayloadAction<any>) => {
      state.graph_data = isEmpty(action.payload)
        ? ""
        : JSON.stringify(action.payload);
    },
    setPqlParams: (
      state,
      action: PayloadAction<{
        api: string;
        params: ParamsState;
      }>
    ) => {
      state.pql_params = action.payload;
    },
    setCodeMode: (state, action: PayloadAction<boolean>) => {
      state.codeMode = action.payload;
    },
    setAdvReadonly: (state, action: PayloadAction<boolean>) => {
      state.readonly = action.payload;
    },
  },
});

export const {
  setSelected,
  exitAdv,
  setCalc,
  setGraphData,
  setMetricInfo,
  setUpstreams,
  updateColumnConfig,
  setMetricParams,
  setPqlParams,
  setCodeMode,
  setAdvReadonly,
} = indicatorAdvanceSlice.actions;

export default indicatorAdvanceSlice.reducer;
