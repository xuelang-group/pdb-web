import axios from '../utils/axios';

const apiPrefix = '/pdb/api/v1/relation';
const api = {
  add: apiPrefix + '/add',
  update: apiPrefix + '/update',
  delete: apiPrefix + '/delete',
  get: apiPrefix + '/get',
};

// 获取类型数据
export const getRelationByGraphId = (graphId, relation, callback) => {
  
  return callback(true,  [
    {
        "r.type.name": "Relation.3nKCsE3TVJi5KBht1ia1730273892566",
        "r.type.label": "包含",
        "r.type.created": 1735870255094,
        "r.type.last_change": 1735870255094,
        "r.type.constraints": {
            "r.binds": [
                {
                    "source": "Type.2pw3k81HxU2RSqgOB9Q1730269234032",
                    "target": "Type.iNu3uyfIFtpQTPuivlj1730272569838"
                },
                {
                    "source": "Type.iNu3uyfIFtpQTPuivlj1730272569838",
                    "target": "Type.2yHAnTORkIVF35NnLh11730272598748"
                },
                {
                    "source": "Type.2yHAnTORkIVF35NnLh11730272598748",
                    "target": "Type.izBeV3GPyvkKiiABmiR1730272690966"
                },
                {
                    "source": "Type.izBeV3GPyvkKiiABmiR1730272690966",
                    "target": "Type.mNuqb2M8Inq9xusA7Op1730272720662"
                },
                {
                    "source": "Type.izBeV3GPyvkKiiABmiR1730272690966",
                    "target": "Type.aQrKAeDe4ToR8lPsAd21730272606504"
                }
            ]
        }
    }
])

  let params = { graphId: graphId ? Number(graphId) : 0 };
  if (relation) {
    Object.assign(params, { relation });
  }

  return axios.post(api['get'], params).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 类型的创建/更新
export const addRelationByGraphId = (graphId, params, callback) => {
  return axios.post(api['add'], {
    graphId: graphId ? Number(graphId) : 0,
    set: params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data: data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 类型的删除
export const deleteRelationByGraphId = (graphId, relation, callback) => {
  return axios.post(api['delete'], {
    graphId: graphId ? Number(graphId) : 0,
    relation
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data: data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 类型的创建/更新
export const setRelationByGraphId  = (graphId, params, callback) => {
  return axios.post(api['update'], {
    graphId: graphId ? Number(graphId) : 0,
    set: params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data: data);
  }, (err) => {
    callback && callback(false, err);
  });
};
