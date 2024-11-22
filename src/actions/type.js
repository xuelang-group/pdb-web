/**
 * 对象类型管理
 */
import axios from '@/utils/axios';
import { commonParams } from '@/utils/common';
import { apiPrefix } from './graph';

const typeApiPrefix = `${apiPrefix}/type`;
const api = {
  add: typeApiPrefix + '/add',
  update: typeApiPrefix + '/update',
  delete: typeApiPrefix + '/delete',
  get: typeApiPrefix + '/get',
};

// 创建对象类型
export const addType = (graphId, params, callback) => {
  return axios.post(api['add'], {
    graphId,
    set: params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

// 获取某个类型数据
export const getTypeInfo = (type, callback) => {
  let params = { ...commonParams };
  if (type) {
    Object.assign(params, { type });
  }

  return axios.post(api['get'], params).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 获取项目的类型列表
export const getTypeList = (graphId, callback) => {
  return axios.post(api['get'], { graphId: graphId ? Number(graphId) : 0 }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 类型的删除
export const deleteTypeByGraphId = (graphId, type, callback) => {
  return axios.post(api['delete'], {
    graphId: graphId ? Number(graphId) : 0,
    type
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 类型的创建/更新
export const setTypeByGraphId = (graphId, params, callback) => {
  return axios.post(api['update'], {
    graphId: graphId ? Number(graphId) : 0,
    set: params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

export const resetSchema = (graphId, callback) => {
  return axios.post("/pdb/api/v1/schema/reset", {
    graphId: graphId ? Number(graphId) : 0,
  }).then(({ data }) => {
    callback && callback(data.success);
  }, (err) => {
    callback && callback(false, err);
  });
};