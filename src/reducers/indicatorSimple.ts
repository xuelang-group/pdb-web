import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ParamsState } from "./query";

export interface MetricParams {
  dimension: {
    name: string;
    name_cn: string;
  };
  func: string;
  group_by: Array<{
    name: string;
    name_cn: string;
  }>;
}

export interface MetricBasicInfo {  
  id?: number;
  name: string;
  name_cn: string;
  desc?: string;
  created_at?: string;
  updated_at?: string;
  version?: string;
  ori_id?: number;
  online?: boolean;
  unit?: string;
  requestId?: string | null;
  buzProcess?: string | null;
  type: number; // 指标类型 1-初级指标 2-高级指标 xx-前端自定义
}

export interface MetricItem extends MetricBasicInfo {
  metric_params: MetricParams;
  pql_params: {
    api: string;
    params: ParamsState;
  };
}

interface IndicatorSimpleState {
  current?: MetricItem;
  calc?: {
    dimension: { name: string; name_cn: string };
    group_by_name_dict: {
      part_type: string;
      part_version: string;
    };
    result: Array<{
      group_by: { [prop: string]: any }[];
      value: number;
    }>;
    success?: boolean;
  };
  readonly: boolean;
}

// 使用该类型定义初始 state
const initialState: IndicatorSimpleState = {
  current: undefined,
  calc: undefined,
  readonly: false,
};

export const indicatorSimpleSlice = createSlice({
  name: "indicatorSimple",
  initialState,
  reducers: {
    setCurrent: (state, action: PayloadAction<MetricItem | undefined>) => {
      state.current =
        action.payload && JSON.parse(JSON.stringify(action.payload));
      state.calc = undefined;
      state.readonly = false;
    },
    updateCurrent: (state, action: PayloadAction<any>) => {
      state.current = Object.assign({}, state.current, action.payload)
    },
    setReadonly: (state, action: PayloadAction<boolean>) => {
      state.readonly = action.payload;
    },
    setCalc: (state, action: PayloadAction<any>) => {
      state.calc = JSON.parse(JSON.stringify(action.payload));
    },
    exitSimple: (state) => {
      state.current = undefined
      state.calc = undefined
      state.readonly = false
    }
  },
});

export const { setCurrent, updateCurrent, exitSimple, setReadonly, setCalc } = indicatorSimpleSlice.actions;

export default indicatorSimpleSlice.reducer;
