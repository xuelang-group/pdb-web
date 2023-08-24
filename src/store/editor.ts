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

export interface NodeItemData {
  id: string
  label: string
  nodeType?: string
  params?: any
  parent?: string
  children?: Array<string>
  fans?: Array<string>
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
            "name": "PM1",
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
          },{
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
            "children": ["DN1", "DN2"]
          }, {
            "uid": "PW2",
            "name": "PW2",
            "parent": "CZ3",
            "nodeType": 'type8'
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
          }, {
            "uid": "TD2",
            "name": "TD2",
            "parent": "GR1",
            "nodeType": 'type10',
          }
        ],
        "BOP": [
          {
            "uid": "BE1",
            "name": "BE1",
            "children": ["NG1", "NG2"],
            "nodeType": 'type1'
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
            "nodeType": 'type4'
          },
          {
            "uid": "OP2",
            "name": "OP2",
            "parent": "NG1",
            "children": ["OG1"],
            "nodeType": 'type4'
          },
          {
            "uid": "OP3",
            "name": "OP3",
            "parent": "NG2",
            "children": ["MW1"],
            "nodeType": 'type4'
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
            "children": ["PV1", "PV2"],
            "nodeType": 'type6'
          },
          {
            "uid": "PV1",
            "name": "PV1",
            "parent": "MW1",
            "nodeType": 'type7'
          },
          {
            "uid": "PV2",
            "name": "PV2",
            "parent": "MW1",
            "nodeType": 'type8'
          },
        ]
      },
      currentEditModel: null
    }
  },
  actions: {
    setCurrentEditModel(item: any) {
      this.currentEditModel = item;
    }
  }
})
