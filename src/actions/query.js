import axios from '../utils/axios';

const apiPrefix = '/pdb/api/v1/object/search';
const api = {
  'uid': apiPrefix + '/id',
  'x.name': apiPrefix + '/name',
  'x.type.name': apiPrefix + '/type',
  'results': apiPrefix + '/results',
  'pql': apiPrefix + '/pql',
  'vertex': apiPrefix + '/vertex'
};

export const runPql = function (params, callback) {
  return axios.post(api['pql'], params).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

export const runVertex = function (params, callback) {
  return axios.post(api['vertex'], params).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

// 执行query
export const runQuery = function (type, params, callback) {
  return axios.post(api[type], params).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

// 根据搜索结果返回结果及父节点组成的树
export const getQueryResult = function (params, callback) {
  return axios.post(api['results'], params).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

// 保存查询构建器数据
export const saveQueryData = function (graphId, json, callback) {
  const queryPath = 'studio/' + window.appConfig.userId + '/pdb/graph/' + graphId + '/query.json';
  window.ossService.putObject(window.appConfig.oss.bucket, queryPath, json)
    .then(function () {
      callback && callback(true);
    }, function () {
      callback && callback(false);
    });
}