import axios from '../utils/axios';
import { apiPrefix } from './graph';

const relationApiPrefix = `${apiPrefix}/relation`;
const api = {
  add: relationApiPrefix + '/add',
  update: relationApiPrefix + '/update',
  delete: relationApiPrefix + '/delete',
  get: relationApiPrefix + '/get',
};

/**
 * 创建关系类型
 * @param {int} graphId 项目ID
 * @param {RelationConfig} params 关系类型信息
 * @param {*} callback 
 * @returns 
 */
export const addRelationByGraphId = (graphId, params, callback) => {
  return axios.post(api['add'], {
    graphId,
    set: params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
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

// 类型的删除
export const deleteRelationByGraphId = (graphId, relation, callback) => {
  return axios.post(api['delete'], {
    graphId: graphId ? Number(graphId) : 0,
    relation
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 类型的创建/更新
export const setRelationByGraphId = (graphId, params, callback) => {
  return axios.post(api['update'], {
    graphId: graphId ? Number(graphId) : 0,
    set: params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};
