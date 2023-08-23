import { defineStore } from 'pinia'

export interface ItemData {
  uid: string
  name: string
  parent?: string
  children?: Array<string>
  fans?: Array<string>
  params?: Array<any>
}
interface EditorData {
  [key: string]: Array<ItemData>
}

interface EditorState {
  data: EditorData
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
            "params": [{
              "test": "123"
            }]
          },
          {
            "uid": "PM2",
            "name": "PM2"
          },
          {
            "uid": "PM3",
            "name": "PM3",
          },
          {
            "uid": "PG1",
            "name": "PG1",
            "parent": "PM1",
            "children": ["C21", "C22"]
          },
          {
            "uid": "PG2",
            "name": "PG2",
            "parent": "PM1"
          },
          {
            "uid": "C21",
            "name": "C21",
            "parent": "PG1"
          },{
            "uid": "C22",
            "name": "C22",
            "parent": "PG1"
          }
        ],
        "BOP": [
          {
            "uid": "BE1",
            "name": "BE1",
            "children": ["NG1", "NG2"]
          },
          {
            "uid": "BE2",
            "name": "BE2"
          },
          {
            "uid": "NG1",
            "name": "NG1",
            "parent": "BE1",
            "children": ["OP1", "OP2"]
          },
          {
            "uid": "NG2",
            "name": "NG2",
            "parent": "BE1",
            "children": ["OP3", "OP4"]
          },
          {
            "uid": "OP1",
            "name": "OP1",
            "parent": "NG1"
          },
          {
            "uid": "OP2",
            "name": "OP2",
            "parent": "NG1",
            "children": ["OG1"]
          },
          {
            "uid": "OP3",
            "name": "OP3",
            "parent": "NG2",
            "children": ["MW1"]
          },
          {
            "uid": "OP4",
            "name": "OP4",
            "parent": "NG2"
          },
          {
            "uid": "OG1",
            "name": "OG1",
            "parent": "OP2"
          },
          {
            "uid": "MW1",
            "name": "MW1",
            "parent": "OP3",
            "children": ["PW1", "PW2"]
          },
          {
            "uid": "PW1",
            "name": "PW1",
            "parent": "MW1"
          },
          {
            "uid": "PW2",
            "name": "PW2",
            "parent": "MW1"
          },
        ]
      },
    }
  }
})
