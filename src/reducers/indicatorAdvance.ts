import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ParamsState } from "./query";

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

export const { setSelected, exit, setCalc, setUpstreams } = indicatorAdvanceSlice.actions;

export default indicatorAdvanceSlice.reducer;
