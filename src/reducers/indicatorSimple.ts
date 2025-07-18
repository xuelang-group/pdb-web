import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import papa from "papaparse";
import { ParamsState } from "./query";

interface MetricParams {
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

interface MetricItem {
  id: number;
  name: string;
  name_cn: string;
  desc?: string;
  created_at?: string;
  updated_at?: string;
  version?: string;
  ori_id?: number;
  online?: boolean;
  unit?: string;
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
    unit: "",
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
              conditionRaw: "NOT part_level = '0'",
              conditions: [
                {
                  name: "part_level",
                  function: "=",
                  value: "0",
                  not: true,
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
  }

const calc = {
  dimension: {
    name: "id",
    name_cn: "ID_EBOM-零部件",
  },
  group_by_name_dict: {
    part_type: "零件类型_EBOM-零部件",
    part_version: "零件版本_EBOM-零部件",
  },
  result: [
    {
      group_by: [],
      value: 82.5,
    },
    {
      group_by: [
        {
          part_type: "0",
        },
      ],
      value: 2,
    },
    {
      group_by: [
        {
          part_type: "DDM",
        },
      ],
      value: 85.8,
    },
    {
      group_by: [
        {
          part_type: "型材件",
        },
      ],
      value: 69.6046511627907,
    },
    {
      group_by: [
        {
          part_type: "机加件",
        },
      ],
      value: 80.05555555555556,
    },
    {
      group_by: [
        {
          part_type: "钣金件",
        },
      ],
      value: 92.08333333333333,
    },
    {
      group_by: [
        {
          part_type: "0",
        },
        {
          part_version: "0",
        },
      ],
      value: 2,
    },
    {
      group_by: [
        {
          part_type: "DDM",
        },
        {
          part_version: "B",
        },
      ],
      value: 47,
    },
    {
      group_by: [
        {
          part_type: "DDM",
        },
        {
          part_version: "C",
        },
      ],
      value: 134.8,
    },
    {
      group_by: [
        {
          part_type: "DDM",
        },
        {
          part_version: "D",
        },
      ],
      value: 61,
    },
    {
      group_by: [
        {
          part_type: "DDM",
        },
        {
          part_version: "E",
        },
      ],
      value: 36.5,
    },
    {
      group_by: [
        {
          part_type: "DDM",
        },
        {
          part_version: "F",
        },
      ],
      value: 3,
    },
    {
      group_by: [
        {
          part_type: "型材件",
        },
        {
          part_version: "B",
        },
      ],
      value: 81.23076923076923,
    },
    {
      group_by: [
        {
          part_type: "型材件",
        },
        {
          part_version: "C",
        },
      ],
      value: 64.56666666666666,
    },
    {
      group_by: [
        {
          part_type: "机加件",
        },
        {
          part_version: "A",
        },
      ],
      value: 102,
    },
    {
      group_by: [
        {
          part_type: "机加件",
        },
        {
          part_version: "B",
        },
      ],
      value: 77.45454545454545,
    },
    {
      group_by: [
        {
          part_type: "机加件",
        },
        {
          part_version: "C",
        },
      ],
      value: 73.07692307692308,
    },
    {
      group_by: [
        {
          part_type: "机加件",
        },
        {
          part_version: "D",
        },
      ],
      value: 96.33333333333333,
    },
    {
      group_by: [
        {
          part_type: "机加件",
        },
        {
          part_version: "E",
        },
      ],
      value: 9,
    },
    {
      group_by: [
        {
          part_type: "钣金件",
        },
        {
          part_version: "A",
        },
      ],
      value: 60,
    },
    {
      group_by: [
        {
          part_type: "钣金件",
        },
        {
          part_version: "B",
        },
      ],
      value: 122.73170731707317,
    },
    {
      group_by: [
        {
          part_type: "钣金件",
        },
        {
          part_version: "C",
        },
      ],
      value: 56.40909090909091,
    },
    {
      group_by: [
        {
          part_type: "钣金件",
        },
        {
          part_version: "D",
        },
      ],
      value: 37.125,
    },
  ],
};

// 使用该类型定义初始 state
const initialState: IndicatorSimpleState = {
  current: undefined,
  calc: calc,
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
      state.current = action.payload && JSON.parse(JSON.stringify(action.payload));
    },
    setReadonly: (state, action: PayloadAction<boolean>) => {
      state.readonly = action.payload;
    },
  },
});

export const { setCurrent, exit, setReadonly } = indicatorSimpleSlice.actions;

export default indicatorSimpleSlice.reducer;
