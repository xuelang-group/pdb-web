import axios from '@/utils/axios';
import { commonParams } from '@/utils/common';

const apiPrefix = '/pdb/api/v1/type';
const api = {
  add: apiPrefix + '/add',
  update: apiPrefix + '/update',
  delete: apiPrefix + '/delete',
  get: apiPrefix + '/get',
};

export const addType = (params, callback) => {
  return axios.post(api['add'], {
    ...commonParams,
    set: params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
} 

// 类型的创建/更新
export const setType = (params, callback) => {
  // mock
  // callback && callback(true, { "1": 1 });

  return axios.post(api['update'], {
    ...commonParams,
    set: params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 类型的删除
export const deleteType = (type, callback) => {
  // mock
  // callback && callback(true);

  return axios.post(api['delete'], {
    ...commonParams,
    type
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 获取类型数据
export const getType = (type, callback) => {
  // mock
  // callback && callback(true);
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

// 获取项目的类型数据
export const getTypeByGraphId = (graphId, type, callback) => {
  // mock
  // callback && callback(true);
  let params = { graphId: graphId ? Number(graphId) : 0 };
  if (type) {
    Object.assign(params, { type });
  }

  return axios.post(api['get'], params).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 类型的新增
export const addTypeByGraphId = (graphId, params, callback) => {
  return axios.post(api['add'], {
    graphId: graphId ? Number(graphId) : 0,
    set: params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
} 

// 类型的删除
export const deleteTypeByGraphId = (graphId, type, callback) => {
  // mock
  // callback && callback(true);

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
  // mock
  // callback && callback(true, { "1": 1 });

  return axios.post(api['update'], {
    graphId: graphId ? Number(graphId) : 0,
    set: params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};