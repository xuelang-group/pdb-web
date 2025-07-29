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
  };
  readonly: boolean;
}

const demoCurrent = {
  id: 3,
  ori_id: 3,
  version: "1.0.0",
  created_at: "2025-07-18T13:36:29.290609+08:00",
  updated_at: "2025-07-18T13:36:29.290609+08:00",
  name: "qiushui-filter",
  name_cn: "qiushui-filter",
  desc: "秋水的测试用例，包含filter",
  unit: "件",
  type: 1,
  online: false,
  metric_params: {
    dimension: {
      name: "id",
      name_cn: "ID_BBOM-零部件",
    },
    func: "min",
    group_by: [
      {
        name: "part_level",
        name_cn: "零件层级_BBOM-零部件",
      },
      {
        name: "part_type",
        name_cn: "零件类型_BBOM-零部件",
      },
    ],
  },
  pql_params: {
    api: "/pdb/api/v1/object/search/pql",
    params: {
      graphId: "5002",
      pql: [
        [
          {
            name: "BBOM-零部件",
            type: "object",
            conditionRaw:
              "NOT part_level = '0' AND part_version = 'B' AND part_version = 'C'",
            conditions: [
              {
                name: "part_level",
                function: "=",
                value: "0",
                not: true,
              },
              {
                connectives: "AND",
                name: "part_version",
                function: "=",
                value: "B",
              },
              {
                connectives: "AND",
                name: "part_version",
                function: "=",
                value: "C",
              },
              {
                connectives: "AND",
                name: "part_version",
                function: "=",
                value: "D",
              },
            ],
            id: "Type.pio4QvFpgfLNbL1sTto1730272621312",
          },
        ],
      ],
      csv: {
        header: [
          {
            attrName: "ID_BBOM-零部件",
            typeId: "Type.pio4QvFpgfLNbL1sTto1730272621312",
            attrId: "id",
            attrType: "int",
            index: 0,
          },
          {
            attrName: "零件层级_BBOM-零部件",
            typeId: "Type.pio4QvFpgfLNbL1sTto1730272621312",
            attrId: "part_level",
            attrType: "string",
            index: 0,
          },
          {
            attrName: "零件号_BBOM-零部件",
            typeId: "Type.pio4QvFpgfLNbL1sTto1730272621312",
            attrId: "part_no",
            attrType: "string",
            index: 0,
          },
          {
            attrName: "模块号_BBOM-零部件",
            typeId: "Type.pio4QvFpgfLNbL1sTto1730272621312",
            attrId: "module_no",
            attrType: "string",
            index: 0,
          },
          {
            attrName: "零件名称_BBOM-零部件",
            typeId: "Type.pio4QvFpgfLNbL1sTto1730272621312",
            attrId: "part_name",
            attrType: "string",
            index: 0,
          },
          {
            attrName: "零件版本_BBOM-零部件",
            typeId: "Type.pio4QvFpgfLNbL1sTto1730272621312",
            attrId: "part_version",
            attrType: "string",
            index: 0,
          },
          {
            attrName: "零件类型_BBOM-零部件",
            typeId: "Type.pio4QvFpgfLNbL1sTto1730272621312",
            attrId: "part_type",
            attrType: "string",
            index: 0,
          },
          {
            attrName: "零组件工程路径_BBOM-零部件",
            typeId: "Type.pio4QvFpgfLNbL1sTto1730272621312",
            attrId: "part_path",
            attrType: "string",
            index: 0,
          },
          {
            attrName: "架次_BBOM-零部件",
            typeId: "Type.pio4QvFpgfLNbL1sTto1730272621312",
            attrId: "fly_no",
            attrType: "string",
            index: 0,
          },
          {
            attrName: "机型_BBOM-零部件",
            typeId: "Type.pio4QvFpgfLNbL1sTto1730272621312",
            attrId: "plane_type",
            attrType: "string",
            index: 0,
          },
          {
            attrName: "制造单位_BBOM-零部件",
            typeId: "Type.pio4QvFpgfLNbL1sTto1730272621312",
            attrId: "manu_dept",
            attrType: "string",
            index: 0,
          },
          {
            attrName: "使用单位_BBOM-零部件",
            typeId: "Type.pio4QvFpgfLNbL1sTto1730272621312",
            attrId: "use_dept",
            attrType: "string",
            index: 0,
          },
          {
            attrName: "落实文件_BBOM-零部件",
            typeId: "Type.pio4QvFpgfLNbL1sTto1730272621312",
            attrId: "imp_of_documents",
            attrType: "string",
            index: 0,
          },
          {
            attrName: "展示字段_BBOM-零部件",
            typeId: "Type.pio4QvFpgfLNbL1sTto1730272621312",
            attrId: "show_col",
            attrType: "string",
            index: 0,
          },
          {
            attrName: "parent_id_BBOM-零部件",
            typeId: "Type.pio4QvFpgfLNbL1sTto1730272621312",
            attrId: "parent_id",
            attrType: "string",
            index: 0,
          },
        ],
      },
    },
  },
};

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
    exit: (state) => {
      state.current = undefined;
      state.calc = undefined;
      state.readonly = false;
    },
    setCurrent: (state, action: PayloadAction<MetricItem | undefined>) => {
      state.current =
        action.payload && JSON.parse(JSON.stringify(action.payload));
    },
    setReadonly: (state, action: PayloadAction<boolean>) => {
      state.readonly = action.payload;
    },
    setCalc: (state, action: PayloadAction<any>) => {
      state.calc = action.payload;
    },
  },
});

export const { setCurrent, exit, setReadonly, setCalc } = indicatorSimpleSlice.actions;

export default indicatorSimpleSlice.reducer;
