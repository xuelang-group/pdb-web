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
export const addRelation = (graphId, params, callback) => {
  return axios.post(api['add'], {
    graphId,
    set: params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**
 * 删除关系类型
 * @param {int} graphId 项目ID
 * @param {string | string[]} relation 关系类型ID
 * @param {*} callback 
 * @returns 
 */
export const deleteRelation = (graphId, relation, callback) => {
  return axios.post(api['delete'], {
    graphId: graphId ? Number(graphId) : 0,
    relation
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 修改关系类型
/**
 * 修改关系类型
 * @param {int} graphId 项目ID
 * @param {RelationConfig} params 关系类型信息
 * @param {*} callback 
 * @returns 
 */
export const setRelation = (graphId, params, callback) => {
  return axios.post(api['update'], {
    graphId,
    set: params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**
 * 查询关系类型
 * @param {int} graphId 项目ID
 * @param {string | string[] | null} relation 关系类型ID
 * @param {*} callback 
 * @returns 
 */
export const getRelation = (graphId, relation, callback) => {
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
