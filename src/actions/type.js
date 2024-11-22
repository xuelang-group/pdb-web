/**
 * 对象类型管理
 */
import axios from '@/utils/axios';
import { apiPrefix } from './graph';

const typeApiPrefix = `${apiPrefix}/type`;
const api = {
  add: typeApiPrefix + '/add',
  delete: typeApiPrefix + '/delete',
  update: typeApiPrefix + '/update',
  get: typeApiPrefix + '/get',
};

/**
 * 创建对象类型
 * @param {int} graphId 项目ID
 * @param {TypeConfig[]} params 类型信息
 * @param {Function} callback 
 * @returns 
 */
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

/**
 * 类型的删除
 * @param {int} graphId 项目ID
 * @param {string | string[]} type 类型ID列表
 * @param {Function} callback 
 * @returns 
 */
export const deleteType = (graphId, type, callback) => {
  return axios.post(api['delete'], {
    graphId,
    type
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**
 * 类型的更新
 * @param {int} graphId 项目ID
 * @param {TypeConfig[]} params 类型信息
 * @param {Function} callback 
 * @returns 
 */
export const setType = (graphId, params, callback) => {
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
 * 获取某个类型数据
 * @param {int} graphId 项目ID
 * @param {string[]} type 类型ID列表
 * @param {Function} callback 
 * @returns 
 */
export const getTypeInfo = (graphId, type, callback) => {
  return axios.post(api['get'], { graphId, type }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**
 * 获取项目的类型列表
 * @param {int} graphId 项目ID
 * @param {Function} callback 
 * @returns 
 */
export const getTypeList = (graphId, callback) => {
  return axios.post(api['get'], { graphId }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**
 * 对象类型版本相关API
 */
const typeVersionApiPrefix = `${typeApiPrefix}/version`;
const versionApi = {
  'add': typeVersionApiPrefix + '/add',
  'delete': typeVersionApiPrefix + '/delete',
  'update': typeVersionApiPrefix + '/update',
  'get': typeVersionApiPrefix + '/get',
}

/**
 * 新增对象类型版本
 * @param {int} graphId 项目ID
 * @param {TypeConfig} typeInfo 类型信息
 * @param {Function} callback 
 * @returns 
 */
export const addTypeVerison = (graphId, typeInfo, callback) => {
  return axios.post(versionApi['add'], { graphId, ...typeInfo }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**
 * 删除对象类型版本
 * @param {int} graphId 项目ID
 * @param {string} type 类型ID
 * @param {string} typeVersionID 类型版本ID
 * @param {Function} callback 
 * @returns 
 */
export const deleteTypeVerison = (graphId, type, typeVersionID, callback) => {
  return axios.post(versionApi['delete'], { graphId, type, typeVersionID }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**
 * 修改对象类型版本状态
 * @param {int} graphId 项目ID
 * @param {string} type 类型ID
 * @param {string} typeVersionID 类型版本ID
 * @param {int} state 状态 0-草稿 | 1-审核中 | 2-已发布
 * @param {Function} callback 
 * @returns 
 */
export const updateTypeVerisonState = (graphId, type, typeVersionID, state, callback) => {
  return axios.post(versionApi['update'], { graphId, type, typeVersionID, state }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**
 * 查询对象类型版本信息
 * @param {int} graphId 项目ID
 * @param {string} type 类型ID
 * @param {string | null} typeVersionID 类型版本ID，不填默认查询类型的全部版本
 * @param {Function} callback 
 * @returns 
 */
export const getTypeVerison = (graphId, type, typeVersionID, callback) => {
  return axios.post(versionApi['delete'], { graphId, type, typeVersionID }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 退出类型编辑
export const resetSchema = (graphId, callback) => {
  return axios.post(`${apiPrefix}/schema/reset`, {
    graphId: graphId ? Number(graphId) : 0,
  }).then(({ data }) => {
    callback && callback(data.success);
  }, (err) => {
    callback && callback(false, err);
  });
};