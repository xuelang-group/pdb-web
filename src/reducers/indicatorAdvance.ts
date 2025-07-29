import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ConditionState, ParamsState } from "./query";
import { MetricBasicInfo, MetricParams } from "./indicatorSimple";

const demo = {
    "name": "test",
    "name_cn": "test",
    "version": "1.0.0",
    "type": 2,
    "graph_data": {
        "nodes": [
            {
                "id": "node-0.167900026479815721753754685088",
                "type": "indicator",
                "label": "测试-QS2",
                "x": 92,
                "y": 224.3333282470703,
                "data": {
                    "id": 31,
                    "ori_id": 31,
                    "name": "test-qs2",
                    "name_cn": "测试-QS2",
                    "type": 1
                }
            },
            {
                "id": "node-0.29620202161630871753754686973",
                "type": "indicator",
                "label": "测试-QS",
                "x": 98,
                "y": 327.3333282470703,
                "data": {
                    "id": 2,
                    "ori_id": 2,
                    "name": "test-qs",
                    "name_cn": "测试-QS",
                    "type": 1
                }
            },
            {
                "id": "node-0.4296978782659041753754688436",
                "type": "symbol",
                "label": "plus",
                "x": 345,
                "y": 284.3333282470703
            },
            {
                "id": "node-0.62465069648404391753754701726",
                "type": "indicator",
                "label": "0714",
                "x": 289,
                "y": 161.3333282470703,
                "data": {
                    "id": 30,
                    "ori_id": 30,
                    "name": "test_metric",
                    "name_cn": "0714",
                    "type": null
                }
            },
            {
                "id": "node-0.491355805076706061753754713331",
                "type": "symbol",
                "label": "minus",
                "x": 471,
                "y": 247.3333282470703
            },
            {
                "id": "end",
                "type": "indicator",
                "label": "计算结果",
                "x": 624,
                "y": 246.3333282470703
            }
        ],
        "edges": [
            {
                "id": "edge-0.39466193358345791753754694016",
                "source": "node-0.167900026479815721753754685088",
                "target": "node-0.4296978782659041753754688436"
            },
            {
                "id": "edge-0.181776302635393571753754695699",
                "source": "node-0.29620202161630871753754686973",
                "target": "node-0.4296978782659041753754688436"
            },
            {
                "id": "edge-0.4737113539245471753754719327",
                "source": "node-0.4296978782659041753754688436",
                "target": "node-0.491355805076706061753754713331",
                "end": true
            },
            {
                "id": "edge-0.63899751338077841753754722273",
                "source": "node-0.62465069648404391753754701726",
                "target": "node-0.491355805076706061753754713331",
            },
            {
                "id": "edge-0.072140906311319641753754724016",
                "source": "node-0.491355805076706061753754713331",
                "target": "end"
            }
        ]
    },
    "column_config": [
        {
            "cols": [
                {
                    "attrId": "part_level",
                    "index": 0,
                    "typeId": "Type.Ov9n4bERTaIAjcbk8Ha1730272613256",
                    "attrName": "零件层级",
                    "attrType": "string",
                    "metric": {
                        "id": "2",
                        "name": "test-qs",
                        "name_cn": "测试-QS"
                    }
                },
                {
                    "attrId": "batch_number",
                    "index": 0,
                    "typeId": "Type.a",
                    "attrName": "批号",
                    "attrType": "string",
                    "metric": {
                        "id": "30",
                        "name": "test_metric",
                        "name_cn": "0714"
                    }
                },
                {
                    "attrId": "allocation_group",
                    "index": 0,
                    "typeId": "Type.c",
                    "attrName": "来源分配组",
                    "attrType": "string",
                    "metric": {
                        "id": "31",
                        "name": "test-qs2",
                        "name_cn": "测试-QS2"
                    }
                }
            ],
            "conditions": [
                {
                    "name": "TEST01",
                    "function": "=",
                    "value": "0",
                    "not": true
                }
            ],
            "name": "TEST01",
            "id": "1753754681354",
            "type": "string"
        },
        {
            "cols": [
                {
                    "attrId": "part_name",
                    "index": 0,
                    "typeId": "Type.Ov9n4bERTaIAjcbk8Ha1730272613256",
                    "attrName": "零件名称",
                    "attrType": "string",
                    "metric": {
                        "id": "2",
                        "name": "test-qs",
                        "name_cn": "测试-QS"
                    }
                },
                {
                    "attrId": "product_name",
                    "index": 0,
                    "typeId": "Type.a",
                    "attrName": "产品名称",
                    "attrType": "string",
                    "metric": {
                        "id": "30",
                        "name": "test_metric",
                        "name_cn": "0714"
                    }
                },
                {
                    "attrId": "source_department",
                    "index": 0,
                    "typeId": "Type.c",
                    "attrName": "来源部门",
                    "attrType": "string",
                    "metric": {
                        "id": "31",
                        "name": "test-qs2",
                        "name_cn": "测试-QS2"
                    }
                }
            ],
            "conditions": [
                {
                    "name": "TEST02",
                    "function": "ANYOFTERMS",
                    "value": "a",
                    "not": false
                }
            ],
            "name": "TEST02",
            "id": "1753754765923",
            "type": "string",
            "distinct": true
        }
    ],
    "metric_params": {
        "dimension": {
          "name": "1753754681354",
          "name_cn": "1753754681354",
        },
        "func": "count",
        "group_by": [
            {
                "name": "1753754765923",
                "name_cn": "1753754765923"
            }
        ]
    },
    "pql_params": {
        "api": "/pdb/api/v1/object/search/pql",
        "params": {
            "graphId": "5001",
            "pql": [
                []
            ],
            "csv": {
                "header": [
                    {
                        "attrName": "TEST01",
                        "attrType": "string",
                        "attrId": "1753754681354",
                        "typeId": "",
                        "index": 0
                    },
                    {
                        "attrName": "TEST02",
                        "attrType": "string",
                        "attrId": "1753754765923",
                        "typeId": "",
                        "index": 0
                    }
                ]
            }
        }
    }
}

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
    }
  }>;
  // 筛选条件
  conditions: ConditionState[];
  distinct?: boolean;
  // 数据类型，等同 attrType
  type?: string;
  // 别名
  name: string;
  id: string;
}

interface IndicatorAdvanceState {
  basic_info: MetricBasicInfo;
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
  metric_params: MetricParams;
  pql_params: {
    api: string;
    params: ParamsState;
  };
  // 对齐配置
  column_config: Array<ColumnConfig>;
}

// 使用该类型定义初始 state
const initialState: IndicatorAdvanceState = {
  graph_data: JSON.stringify(demo.graph_data),
  selected: undefined,
  upstreams: undefined,
  calc: undefined,
  // 基本指标信息
  basic_info: {
    name: '',
    name_cn: '',
    type: 2, // 指标类型 1-初级指标 2-高级指标 xx-前端自定义  
  },
  metric_params: demo.metric_params || {
    dimension: {
      name: "",
      name_cn: "",
    },
    func: "",
    group_by: [],
  },
  pql_params: demo.pql_params || {
    api: "/pdb/api/v1/object/search/pql",
    params: {
      graphId: "5001",
      pql: [[]],
      csv: {
        header: [],
      },
    },
  },
  column_config: demo.column_config || []
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
    updateColumnConfig: (state, action: PayloadAction<ColumnConfig[]>) => {
      state.column_config = action.payload;
    },
    setMetricInfo: (state, action: PayloadAction<MetricBasicInfo>) => {
      state.basic_info = action.payload
    },
    setMetricParams: (state, action: PayloadAction<MetricParams>) => {
      state.metric_params = action.payload;
    },
    setPqlParams: (state, action: PayloadAction<{
      api: string;
      params: ParamsState;
    }>) => {
      state.pql_params = action.payload;
    },
  },
});

export const { setSelected, exit, setCalc, setMetricInfo, setUpstreams, updateColumnConfig, setMetricParams, setPqlParams } =
  indicatorAdvanceSlice.actions;

export default indicatorAdvanceSlice.reducer;
