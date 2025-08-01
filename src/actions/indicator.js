import axios from '../utils/axios';
import { api as queryApi } from './query';

const apiPrefix = '/indicator';
const api = {
  csv: apiPrefix + '/execute_pdb',  // 执行pdb查询获取原始数据表
  calc: apiPrefix + '/calc',        // 直接执行计算
  getMetrics: apiPrefix + '/metrics',        // 获取metrics列表
  addMetric: apiPrefix + '/add_metric',        // 新增metric
  updateMetric: apiPrefix + '/update_metric',        // 编辑metric
  metricHistory: apiPrefix + '/metric_history',    // 获取metrics历史列表
  getMetricDetail: apiPrefix + '/metric',    // 获取metric详情
  rollbackMetric: apiPrefix + '/rollback_metric',   // 回滚某个metric
  checkVersion: apiPrefix + '/check_version',   // 检查版本
  reference: apiPrefix + '/reference_metric',   // 获取引用指标列表 用于判断指标是否被引用
};

// 获取模板列表
export const getCsv = (query, extraColumns=[], callback) => {
  return axios.post(api['csv'], {
    "pql_params": {
      "api": queryApi['pql'],
      "params": query
    },
    "extra_columns": extraColumns
  }).then(({ data }) => {
    // console.log(data)
    callback && callback(data.success, data.success ? data.data.data: data.data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 执行计算
export const getFuncResult = ({metric_params, pql_params, ...others}, callback) => {
  return axios.post(api['calc'], {
    "metric_params": metric_params,
    "pql_params": pql_params,
    ...others
  }).then(({data}) => {
    // console.log(data)
    callback && callback(data.success, data.success ? data.data: data);
    // callback && callback(true, data);
  }, (err) => {
    callback && callback(false, err);
  });
}

// 获取metrics列表
export const getMetrics = (callback) => {
  return axios.get(api['getMetrics']).then(({ data }) => {
    callback && callback(data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 新增metric
export const addMetric = (params, callback) => {
  return axios.post(api['addMetric'], params).then(({ data }) => {
    // callback && callback(true, data);
    callback && callback(data.success, data.success ? data.data: data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 编辑metric
export const updateMetric = (params, callback) => {
  return axios.post(`${api['updateMetric']}`, params).then(({ data }) => {
    // callback && callback(true, data);
    callback && callback(data.success, data.success ? data.data: data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 获取metrics历史列表
export const metricHistory = (params, callback) => {
  return axios.get(`${api['metricHistory']}`, params).then(({ data }) => {
    callback && callback(true, data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 获取metric详情
export const getMetricDetail = (params, callback) => {
  return axios.get(`${api['getMetricDetail']}`, params).then(({ data }) => {
    callback && callback(true, data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 回滚某个metric
export const rollbackMetric = (params, callback) => {
  return axios.post(`${api['rollbackMetric']}`, params).then(({ data }) => {
    callback && callback(true, data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 校验版本号是否合规
export const checkVersion = (params) => {
  return axios.post(`${api['checkVersion']}`, params)
};

// 获取metric详情
export const getMetricDetail2 = (params) => {
  return axios.get(`${api['getMetricDetail']}`, params)
};

// 判断指标是否被引用
export const getMetricReference = (ori_id) => {
  return axios.get(`${api['reference']}`, {ori_id})
};

