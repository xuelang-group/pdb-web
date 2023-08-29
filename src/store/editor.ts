import { NodeConfig, TreeGraphData } from '@antv/g6'
import { defineStore } from 'pinia'

export interface ItemData {
  uid: string
  name: string
  nodeType?: string
  parent?: string
  children?: Array<string>
  fans?: Array<string>
  params?: any
}
interface EditorData {
  [key: string]: Array<ItemData>
}

export interface NodeItemData extends NodeConfig {
  id: string
  label: string
  name: string
  level: string // 层级
  rootKey: string // 最顶层id，即data数据第一层key
  comboId?: string // 所属combo id
  data?: any // 原始数据
  dataIndex?: number // 该数据在原始数据对应rootKey中的位置
  nodeType?: string // 节点类型，区分节点样式
  params?: any // 属性，用于右侧面板显示
  parent?: string // 当前数据上级id
  fans?: Array<string> // 当前数据与其他数据ids，用于连线
  onlyChild?: boolean // 子级有且只有一个，该子级也没有子级
  root?: boolean // 根节点
}

interface EditorState {
  data: EditorData
  currentEditModel: NodeItemData | null
}

export const useEditorStore = defineStore('editor', {
  state: (): EditorState => {
    return {
      data: {
        "EBOM": [
          {
            "uid": "PM1",
            "name": "PM111111111111111111111111111111",
            "children": ["PG1", "PG2"],
            "params": {
              "PM1": "123"
            },
            "nodeType": 'type1'
          },
          {
            "uid": "PM2",
            "name": "PM2",
            "params": {
              "PM2": "123"
            },
            "nodeType": 'type1'
          },
          {
            "uid": "PM3",
            "name": "PM3",
            "nodeType": 'type1'
          },
          {
            "uid": "PG1",
            "name": "PG1",
            "parent": "PM1",
            "children": ["CZ1", "CZ2"],
            "nodeType": 'type2'
          },
          {
            "uid": "PG2",
            "name": "PG2",
            "parent": "PM1",
            "nodeType": 'type2',
            "children": ["CZ3", "CZ4"]
          },
          {
            "uid": "CZ1",
            "name": "CZ1",
            "parent": "PG1",
            "nodeType": 'type3',
            "children": ["CN1"]
          }, {
            "uid": "CZ2",
            "name": "CZ2",
            "parent": "PG1",
            "nodeType": 'type3'
          }, {
            "uid": "CN1",
            "name": "CN1",
            "parent": "CZ1",
            "nodeType": 'type5'
          }, {
            "uid": "CZ3",
            "name": "CZ3",
            "parent": "PG2",
            "nodeType": 'type3',
            "children": ["PW1", "PW2"]
          }, {
            "uid": "CZ4",
            "name": "CZ4",
            "parent": "PG2",
            "nodeType": 'type3',
            "children": ["GR1"]
          }, {
            "uid": "PW1",
            "name": "PW1",
            "parent": "CZ3",
            "nodeType": 'type7',
            "children": ["DN1", "DN2"],
            "fans": ["PW1-BOP"]
          }, {
            "uid": "PW2",
            "name": "PW2",
            "parent": "CZ3",
            "nodeType": 'type8',
            "fans": ["PW2-BOP"]
          }, {
            "uid": "DN1",
            "name": "DN1",
            "parent": "PW1",
            "nodeType": 'type9'
          }, {
            "uid": "DN2",
            "name": "DN2",
            "parent": "PW1",
            "nodeType": 'type9'
          }, {
            "uid": "GR1",
            "name": "GR1",
            "parent": "CZ4",
            "nodeType": 'type5',
            "children": ["TD1", "TD2"]
          }, {
            "uid": "TD1",
            "name": "TD1",
            "parent": "GR1",
            "nodeType": 'type10',
            "fans": ["TD1-ERP"]
          }, {
            "uid": "TD2",
            "name": "TD2",
            "parent": "GR1",
            "nodeType": 'type10',
            "fans": ["TD2-ERP"]
          }
        ],
        "BOP": [
          {
            "uid": "BE1",
            "name": "BE1",
            "children": ["NG1", "NG2"],
            "nodeType": 'type1',
          },
          {
            "uid": "BE2",
            "name": "BE2",
            "nodeType": 'type1'
          },
          {
            "uid": "NG1",
            "name": "NG1",
            "parent": "BE1",
            "children": ["OP1", "OP2"],
            "nodeType": 'type3'
          },
          {
            "uid": "NG2",
            "name": "NG2",
            "parent": "BE1",
            "children": ["OP3", "OP4"],
            "nodeType": 'type3'
          },
          {
            "uid": "OP1",
            "name": "OP1",
            "parent": "NG1",
            "nodeType": 'type4',
            "fans": ["OP1-ERP"]
          },
          {
            "uid": "OP2",
            "name": "OP2",
            "parent": "NG1",
            "children": ["OG1"],
            "nodeType": 'type4',
            "fans": ["OP2-ERP"]
          },
          {
            "uid": "OP3",
            "name": "OP3",
            "parent": "NG2",
            "children": ["MW1"],
            "nodeType": 'type4',
            "fans": ["OP3-ERP"]
          },
          {
            "uid": "OP4",
            "name": "OP4",
            "parent": "NG2",
            "nodeType": 'type4'
          },
          {
            "uid": "OG1",
            "name": "OG1",
            "parent": "OP2",
            "nodeType": 'type5'
          },
          {
            "uid": "MW1",
            "name": "MW1",
            "parent": "OP3",
            "children": ["PW1-BOP", "PW2-BOP"],
            "nodeType": 'type6',
            "fans": ["MW1-ERP"]
          },
          {
            "uid": "PW2-BOP",
            "name": "PW2",
            "parent": "MW1",
            "nodeType": 'type8'
          }, {
            "uid": "PW1-BOP",
            "name": "PW1",
            "parent": "MW1",
            "nodeType": 'type7'
          },
        ],
        "ERP": [
          {
            "uid": "CK1",
            "name": "CK1",
            "nodeType": "type1",
            "children": ["SP1"]
          }, {
            "uid": "SP1",
            "name": "SP1",
            "nodeType": "type5",
            "parent": "CK1",
            "children": ["RV1", "RV2"]
          }, {
            "uid": "RV1",
            "name": "RV1",
            "nodeType": "type8",
            "parent": "SP1",
            "children": ["AF1", "AS1"]
          }, {
            "uid": "RV2",
            "name": "RV2",
            "nodeType": "type8",
            "parent": "SP1",
            "children": ["AF2", "OP3-ERP"]
          }, {
            "uid": "AF1",
            "name": "AF1",
            "nodeType": "type2",
            "parent": "RV1",
          }, {
            "uid": "AS1",
            "name": "AS1",
            "nodeType": "type5",
            "parent": "RV1",
            "children": ["OP1-ERP", "OP2-ERP"]
          }, {
            "uid": "AF2",
            "name": "AF2",
            "nodeType": "type2",
            "parent": "RV2",
            "children": ["UR3"]
          }, {
            "uid": "OP1-ERP",
            "name": "OP1",
            "nodeType": "type4",
            "parent": "AS1",
          }, {
            "uid": "OP2-ERP",
            "name": "OP2",
            "nodeType": "type4",
            "parent": "AS1",
          }, {
            "uid": "OP3-ERP",
            "name": "OP3",
            "nodeType": "type4",
            "parent": "RV2",
            "children": ["MW1-ERP"]
          }, {
            "uid": "UR3",
            "name": "UR3",
            "nodeType": "type5",
            "parent": "AF2",
            "children": ["UR3"]
          }, {
            "uid": "MW1-ERP",
            "name": "MW1",
            "nodeType": "type7",
            "parent": "OP3-ERP",
            "children": ["TD1-ERP", "TD2-ERP"]
          }, {
            "uid": "TD1-ERP",
            "name": "TD1",
            "nodeType": "type10",
            "parent": "MW1-ERP",
          }, {
            "uid": "TD2-ERP",
            "name": "TD2",
            "nodeType": "type10",
            "parent": "MW1-ERP",
          }, {
            "uid": "CK2",
            "name": "CK2",
            "nodeType": "type1",
            "children": ["SP2"]
          }, {
            "uid": "SP2",
            "name": "SP2",
            "nodeType": "type5",
            "parent": "CK2"
          }, {
            "uid": "CK3",
            "name": "CK3",
            "nodeType": "type1"
          },
        ],
        "QMES": [
          {
            "uid": "LQ1",
            "name": "LQ1",
            "nodeType": 'type5',
            "children": ["QK1", "QK2"]
          }, {
            "uid": "QK1",
            "name": "QK1",
            "nodeType": 'type1',
            "parent": "LQ1",
            "children": ["AF1-QMES", "AF2-QMES"]
          }, {
            "uid": "QK2",
            "name": "QK2",
            "nodeType": 'type1',
            "parent": "LQ1"
          }, {
            "uid": "AF1-QMES",
            "name": "AF1",
            "nodeType": 'type2',
            "parent": "QK1",
            "children": ["ED1", "ED2"],
            "fans": ["AF1"]
          }, {
            "uid": "AF2-QMES",
            "name": "AF2",
            "nodeType": 'type2',
            "parent": "QK1",
            "children": ["ED3", "ED4", "ED5"],
            "fans": ["AF2"]
          }, {
            "uid": "ED1",
            "name": "ED1",
            "nodeType": 'type3',
            "parent": "AF1-QMES"
          }, {
            "uid": "ED2",
            "name": "ED2",
            "nodeType": 'type3',
            "parent": "AF1-QMES"
          }, {
            "uid": "ED3",
            "name": "ED3",
            "nodeType": 'type3',
            "parent": "AF2-QMES",
            "children": ["LP1"]
          }, {
            "uid": "ED4",
            "name": "ED4",
            "nodeType": 'type3',
            "parent": "AF2-QMES"
          }, {
            "uid": "ED5",
            "name": "ED5",
            "nodeType": 'type3',
            "parent": "AF2-QMES"
          }, {
            "uid": "LP1",
            "name": "LP1",
            "nodeType": 'type7',
            "parent": "ED3",
            "children": ["LP-C"]
          }, {
            "uid": "LP-C",
            "name": "LP-C",
            "nodeType": 'type4',
            "parent": "LP1",
          },
        ]
      },
      currentEditModel: null
    }
  },
  actions: {
    setData(data: any) {
      this.data = JSON.parse(JSON.stringify(data));
    },
    setCurrentEditModel(item: any) {
      this.currentEditModel = item;
    }
  }
})
