import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ParamsState } from "./query";
import { MetricItem, MetricParams } from "./indicatorSimple";

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

interface IndicatorAdvanceState extends MetricItem {
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
  upstreams: undefined,
  calc: undefined,
  // 基本指标信息
  name: '',
  name_cn: '',
  type: 2, // 指标类型 1-初级指标 2-高级指标 xx-前端自定义  
  // metric_params: {
  //   dimension: {
  //     name: "",
  //     name_cn: "",
  //   },
  //   func: "",
  //   group_by: [],
  // },
  // pql_params: {
  //   api: "/pdb/api/v1/object/search/pql",
  //   params: {
  //     graphId: "5001",
  //     pql: [[]],
  //     csv: {
  //       header: [],
  //     },
  //   },
  // },
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
