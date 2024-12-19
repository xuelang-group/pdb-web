import axios from '../utils/axios';
import { apiPrefix } from './graph';

const queryApiPrefix = `/pdb/api/v1/object/search`;

export const queryApi = {
  'results': queryApiPrefix + '/results',
  'pql': queryApiPrefix + '/pql',
  'vertex': queryApiPrefix + '/vertex'
};

/**
 * 根据搜索语言搜索对象ID
 * @param {int} graphId 项目ID
 * @param {*} pql 搜索条件 
 * @param {*} callback 
 * @returns 
 */
export const runPql = function (graphId, pql, callback) {
  return axios.post(queryApi['pql'], {
    graphId, 
    pql
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

export const runVertex = function (params, callback) {
  return axios.post(queryApi['vertex'], params).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

// 根据搜索结果返回结果及父节点组成的树
export const getQueryResult = function (params, callback) {
  return axios.post(queryApi['results'], params).then(({ data }) => {
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