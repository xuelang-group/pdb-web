import axios from '../utils/axios';

const apiPrefix = '/adapter';
const api = {
  buzProcess: apiPrefix + '/buzProcess',  // 指标过程域列表
  pdbIdList: apiPrefix + '/pdbIdList',  // 获取当前用户有权限的指标id列表 
  currentBuzProcess: apiPrefix + '/currentBuzProcess',  // 获取指标的指标过程域
  typeList: apiPrefix + '/type/list', // 过滤创建时推送的对象类型列表
  typeHistory: apiPrefix + '/type/history', // 过滤历史创建对象类型列表
};

//指标过程域列表
export const getBuzProcess = (params, callback) => {
  return axios.post(api['buzProcess'], params).then(({ data }) => {
    callback && callback(data.success, data);
  }, (err) => {
    callback && callback(false, err);
  }); 
};

// 获取当前用户有权限的指标id列表
export const getPdbIdList = (params, callback) => {
  return axios.get(api['pdbIdList'], params).then(({ data }) => {
    callback && callback(data.success, data);
  }, (err) => {
    callback && callback(false, err);
  }); 
};

// 获取当前用户有权限的指标id列表
export const getCurrentBuzProcess = (params, callback) => {
  return axios.get(api['currentBuzProcess'], params).then(({ data }) => {
    callback && callback(data.success, data);
  }, (err) => {
    callback && callback(false, err);
  }); 
};

// 过滤创建时推送的对象类型列表
// 用户选择某数据资产单进行创建指标，跳转到PDB后，需展示选中的数据资产单对应的对象类型
export const getAdapterTypeList = (params, callback) => {
  return axios.get(api['typeList'], params).then(({ data }) => {
    callback && callback(data.success, data);
  }, (err) => {
    callback && callback(false, err);
  }); 
};

// 过滤历史创建对象类型列表
// 用户未选择任何数据资产单进行创建指标，跳转到PDB后，需展示该用户历史创建过的对象类型
export const getAdapterTypeHistory = (params, callback) => {
  return axios.get(api['typeHistory'], params).then(({ data }) => {
    callback && callback(data.success, data);
  }, (err) => {
    callback && callback(false, err);
  }); 
};
