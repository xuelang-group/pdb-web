/**
 * 项目管理
 */
import axios from '../utils/axios';

export const apiPrefix = '/pdb/api/v2';
const graphApiPrefix = `${apiPrefix}/graph`;

const graphApi = {
  get: graphApiPrefix + '/get',
  update: graphApiPrefix + '/update',
  clear: graphApiPrefix + '/drop/data',
  list: graphApiPrefix + '/list', // 新版API暂未支持
  create: graphApiPrefix + '/add', // 新版API暂未支持
  remove: graphApiPrefix + '/delete'// 新版API暂未支持
}

// 获取项目信息
export const getGraphInfo = (graphId, callback) => {
  return axios.post(graphApi['get'], { graphId }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

// 修改项目信息
export const updateGraphInfo = (params, callback) => {
  return axios.post(graphApi['update'], params).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

// 清空项目所有图数据
export const clearGraphData = (graphId, callback) => {
  return axios.post(graphApi['clear'], { graphId }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 获取项目列表
export const getGraphList = (callback) => {
  return axios.post(graphApi['list'], {}).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

// 创建项目
export const createObject = (params, callback) => {
  return axios.post(graphApi['create'], params).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

// 删除项目
export const removeObject = (graphId, callback) => {
  return axios.post(graphApi['remove'], { graphId }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

/**
 * 批量操作
 */
const batchApiPrefix = graphApiPrefix + '/batch';
const batchApi = {
  delete: batchApiPrefix + '/delete', // 新版API暂未支持
  updateInfo: batchApiPrefix + '/update/info' // 新版API暂未支持
}

// 修改项目信息
export const updateObjects = (data, callback) => {
  return axios.post(batchApi['updateInfo'], { data }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

// 删除项目
export const removeObjects = (data, callback) => {
  return axios.post(batchApi['delete'], { data }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}
