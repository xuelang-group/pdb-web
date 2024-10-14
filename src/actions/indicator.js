import axios from '../utils/axios';

const apiPrefix = '/indicator';
const api = {
  csv: apiPrefix + '/execute_pdb',  // 执行pdb查询获取原始数据表
  calc: apiPrefix + '/calc',        // 直接执行计算
  getMetrics: apiPrefix + '/metrics',        // 获取metrics列表
  addMetric: apiPrefix + '/add_metric',        // 新增metric
  updateMetric: apiPrefix + '/update_metric',        // 编辑metric
};

// 获取模板列表
export const getCsv = (query, callback) => {
  return axios.post(api['csv'], {
    "api": "/pdb/api/v1/object/search/pql",
    "params": query
  }).then(({data}) => {
    // console.log(data)
    callback && callback(data.success, data.success ? data.data: data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 执行计算
export const getFuncResult = ({dimention, func, groupBy, query}, callback) => {
  return axios.post(api['calc'], {
    "metric_params": {
      dimention,
      func,
      group_by: groupBy
    },
    "pql_params": {
      "api": "/pdb/api/v1/object/search/pql",
      "params": query
    }
  }).then(({data}) => {
    // console.log(data)
    // callback && callback(data.success, data.success ? data.data: data);
    callback && callback(true, data);
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
    callback && callback(true, data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 编辑metric
export const updateMetric = (params, callback) => {
  return axios.put(api['updateMetric'], params).then(({ data }) => {
    callback && callback(true, data);
  }, (err) => {
    callback && callback(false, err);
  });
};

