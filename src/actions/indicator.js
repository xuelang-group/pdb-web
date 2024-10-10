import axios from '../utils/axios';

const apiPrefix = '/indicator';
const api = {
  csv: apiPrefix + '/execute_pdb',  // 执行pdb查询获取原始数据表
  calc: apiPrefix + '/calc',        // 直接执行计算
};

// 获取模板列表
export const getCsv = (callback) => {
  return axios.post(api['csv'], {
    "api": "/pdb/api/v1/object/search/pql",
    "params": {
        "pql": [
            [
                {
                    "name": "飞机",
                    "type": "object",
                    "conditionRaw": "",
                    "conditions": [],
                    "id": "Type.L1jqQmh63xtoE8t6wty1727600650909"
                },
                {
                    "name": "交付",
                    "type": "relation",
                    "conditionRaw": "",
                    "conditions": [],
                    "id": "Relation.Ja8GOsGH4kPTlxdr7iN1727600650909"
                },
                {
                    "name": "航司",
                    "type": "object",
                    "conditionRaw": "",
                    "conditions": [],
                    "id": "Type.FgFUgyi3bAkVCsTbjqm1727600650909"
                }
            ]
        ],
        "graphId": "87",
        "csv": {
            "header": [
                {
                    "typeId": "Type.L1jqQmh63xtoE8t6wty1727600650909",
                    "attrId": "id",
                    "index": 0,
                    "attrName": "序号",
                    "attrType": "int"
                },
                {
                    "typeId": "Type.L1jqQmh63xtoE8t6wty1727600650909",
                    "attrId": "planeType",
                    "index": 0,
                    "attrName": "机型",
                    "attrType": "string"
                },
                {
                    "typeId": "Type.FgFUgyi3bAkVCsTbjqm1727600650909",
                    "attrId": "serialNo",
                    "index": 2,
                    "attrName": "序号",
                    "attrType": "int"
                },
                {
                    "typeId": "Type.FgFUgyi3bAkVCsTbjqm1727600650909",
                    "attrId": "standardName",
                    "index": 2,
                    "attrName": "标准名称",
                    "attrType": "string"
                },
                {
                    "typeId": "Type.FgFUgyi3bAkVCsTbjqm1727600650909",
                    "attrId": "airlineThreeCode",
                    "index": 2,
                    "attrName": "三字码",
                    "attrType": "string"
                },
                {
                    "typeId": "Type.FgFUgyi3bAkVCsTbjqm1727600650909",
                    "attrId": "open",
                    "index": 2,
                    "attrName": "开机",
                    "attrType": "boolean"
                }
            ]
        }
    }
}).then(({ data }) => {
    callback && callback(true, data);
  }, (err) => {
    callback && callback(false, err);
  });
};
