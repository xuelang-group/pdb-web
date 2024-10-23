import axios from '../utils/axios';

const apiPrefix = '/adapter';
const api = {
  buzProcess: apiPrefix + '/buzProcess',  // 指标过程域列表
  pdbIdList: apiPrefix + '/pdbIdList',  // 获取当前用户有权限的指标id列表 
  currentBuzProcess: apiPrefix + '/currentBuzProcess',  // 获取指标的指标过程域
};

//指标过程域列表
export const getBuzProcess = (params, callback) => {
  return axios.get(api['buzProcess'], params).then(({ data }) => {
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

