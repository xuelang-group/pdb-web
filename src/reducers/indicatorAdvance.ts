import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ParamsState } from "./query";

const graphData = {
  nodes: [
    {
      id: "3",
      label: "指标C",
      x: 90,
      y: 142,
      type: "indicator",
    },
    {
      id: "4",
      label: "指标D",
      x: 90,
      y: 200,
      type: "indicator",
    },
    {
      id: "5",
      label: "指标E",
      x: 550,
      y: 55,
      type: "indicator",
    },
    {
      id: "f1",
      label: "plus",
      x: 320,
      y: 55,
      type: "symbol",
    },
    {
      id: "f2",
      label: "multiply",
      x: 320,
      y: 171,
      type: "symbol",
    },
    {
      id: "f3",
      label: "minus",
      x: 550,
      y: 113,
      type: "symbol",
    },
    {
      id: "f4",
      label: "divide",
      x: 780,
      y: 84,
      type: "symbol",
    },
    {
      id: "end",
      label: "结果",
      x: 940,
      y: 84,
      type: "indicator",
    },
    {
      id: "node-0.60029239173750181753321045627",
      label: "test_metric",
      x: 89.70000000000002,
      y: 75.80600930688212,
      type: "indicator",
      data: {
        id: 32,
        ori_id: 1,
        name: "test_metric",
        name_cn: "0714",
        type: null,
      },
    },
    {
      id: "node-0.69062023797067681753321047892",
      label: "test-qs2",
      x: 91.02433155080212,
      y: 20.184084173192247,
      type: "indicator",
      data: {
        id: 31,
        ori_id: 31,
        name: "test-qs2",
        name_cn: "测试-QS2",
        type: 1,
      },
    },
  ],
  edges: [
    {
      id: "edge-0.458387604288243541753322858250",
      source: "3",
      target: "f2",
    },
    {
      id: "edge-0.83719847530918731753322858250",
      source: "4",
      target: "f2",
    },
    {
      id: "edge-0.54975821809584291753322858250",
      source: "5",
      target: "f4",
      end: true,
    },
    {
      id: "edge-0.58682725430882391753322858250",
      source: "f1",
      target: "f3",
      end: true,
    },
    {
      id: "edge-0.88740205469810941753322858250",
      source: "f2",
      target: "f3",
    },
    {
      id: "edge-0.470166689385981941753322858250",
      source: "f3",
      target: "f4",
    },
    {
      id: "edge-0.041954108422625481753322858250",
      source: "f4",
      target: "end",
    },
    {
      id: "edge-0.93984955664310591753322858251",
      source: "node-0.69062023797067681753321047892",
      target: "f1",
    },
    {
      id: "edge-0.96441186069515841753322858251",
      source: "node-0.60029239173750181753321045627",
      target: "f1",
    },
  ],
};

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
      value: 324,
    },
    {
      group_by: [
        {
          part_level: "0",
        },
      ],
      value: 324,
    },
    {
      group_by: [
        {
          part_level: "1",
        },
      ],
      value: 331,
    },
    {
      group_by: [
        {
          part_level: "2",
        },
      ],
      value: 325,
    },
    {
      group_by: [
        {
          part_level: "0",
        },
        {
          part_type: "0",
        },
      ],
      value: 324,
    },
    {
      group_by: [
        {
          part_level: "1",
        },
        {
          part_type: "DDM",
        },
      ],
      value: 331,
    },
    {
      group_by: [
        {
          part_level: "2",
        },
        {
          part_type: "型材件",
        },
      ],
      value: 335,
    },
    {
      group_by: [
        {
          part_level: "2",
        },
        {
          part_type: "机加件",
        },
      ],
      value: 332,
    },
    {
      group_by: [
        {
          part_level: "2",
        },
        {
          part_type: "钣金件",
        },
      ],
      value: 325,
    },
  ],
};

interface IndicatorAdvanceState {
  graph_data: string;
  selected?: any;
  upstreams?: any[];
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
}

// 使用该类型定义初始 state
const initialState: IndicatorAdvanceState = {
  // graph_data: {nodes: [], edges: []},
  graph_data: JSON.stringify(graphData),
  selected: undefined,
  calc: undefined,
};

export const indicatorAdvanceSlice = createSlice({
  name: "indicatorAdvance",
  initialState,
  reducers: {
    exit: (state) => {
      state.selected = undefined;
      state.calc = undefined;
    },
    setSelected: (state, action: PayloadAction<any>) => {
      state.selected = action.payload;
    },
    setUpstreams: (state, action: PayloadAction<any[] | undefined>) => {
      state.upstreams = action.payload;
    },
    setCalc: (state, action: PayloadAction<any>) => {
      state.calc = action.payload;
    },
  },
});

export const { setSelected, exit, setCalc, setUpstreams } =
  indicatorAdvanceSlice.actions;

export default indicatorAdvanceSlice.reducer;
