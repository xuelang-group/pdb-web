import axios from '../utils/axios';
import { commonParams } from '@/utils/common';

const apiPrefix = '/pdb/api/v1/template';
const api = {
  list: apiPrefix + '/list',
  get: apiPrefix + '/get',
  add: apiPrefix + '/add',
  delete: apiPrefix + '/delete',
  updateInfo: apiPrefix + '/update/info',
  updateGraph: apiPrefix + '/update',
};

// 获取模板列表
export const getTemplateList = (callback) => {
  return axios.post(api['list'], {
    ...commonParams,
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 获取模板信息
export const getTemplateData = (id, callback) => {
  return axios.post(api['get'], {
    ...commonParams,
    tid: id
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 创建模板信息
export const addTemplate = (params, callback) => {
  return axios.post(api['add'], {
    ...commonParams,
    ...params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 删除模板
export const deleteTemplate = (id, callback) => {
  return axios.post(api['delete'], {
    ...commonParams,
    tid: id
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 修改模板信息
export const updateTemplateInfo = (params, callback) => {
  // mock
  // callback && callback(true, { "1": 1 });

  return axios.post(api['updateInfo'], {
    ...commonParams,
    ...params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 修改模板画布数据
export const updateTemplateGraph = (data, callback) => {
  // mock
  // callback && callback(true, { "1": 1 });

  return axios.post(api['updateGraph'], {
    ...commonParams,
    data
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};


/**
 * 批量操作
 */

const batchApiPrefix = apiPrefix + '/batch';
const batchApi = {
  delete: batchApiPrefix + '/delete',
  updateInfo: batchApiPrefix + '/update/info'
}

// 删除模板
export const deleteTemplates = (ids, callback) => {
  return axios.post(batchApi['delete'], { data: ids }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 修改模板信息
export const updateTemplatesInfo = (infos, callback) => {
  // mock
  // callback && callback(true, { "1": 1 });

  return axios.post(batchApi['updateInfo'], { data: infos }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};