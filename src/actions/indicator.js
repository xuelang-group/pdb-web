import axios from '../utils/axios';

const apiPrefix = '/indicator';
const api = {
  csv: apiPrefix + '/execute_pdb',  // 执行pdb查询获取原始数据表
  calc: apiPrefix + '/calc',        // 直接执行计算
  getMetrics: apiPrefix + '/metrics',        // 获取metrics列表
};

// 获取模板列表
export const getCsv = (query, callback) => {
  return axios.post(api['csv'], {
    "api": "/pdb/api/v1/object/search/pql",
    "params": query
  }).then(({data}) => {
    console.log(data)
    callback && callback(data.success, data.success ? data.data: data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 执行计算
export const getFuncResult = ({dimention, groupBy, func, query}, callback) => {
  return axios.post(api['calc'], {
    "dimention": dimention,
    "group_by": groupBy,
    "func": func,
    "pql_params": {
      "api": "/pdb/api/v1/object/search/pql",
      "params": query
    }
  }).then(({data}) => {
    console.log(data)
    // callback && callback(data.success, data.success ? data.data: data);
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
