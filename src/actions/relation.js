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
