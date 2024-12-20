import axios from '../utils/axios';
import { apiPrefix } from './graph';

const queryApiPrefix = `${apiPrefix}/object/search`;

export const queryApi = {
  'results': queryApiPrefix + '/results/children',
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

/**
 * 根据搜索结果获取子对象
 * @param {int} graphId 项目ID
 * @param {{'x.object.id': string, 'children': string[], 'relations'?: string[], 'first'?: number, 'offset'?: number}} params {'x.object.id': 对象ID, 'children': 子对象版本ID集, 'relations'?: 指定关系类型ID集, 'first'?: 分页数量, 'offset'?: 偏移量}
 * @param {*} callback 
 * @returns 
 */
export const getQueryResultChildren = function (graphId, params, callback) {
  return axios.post(queryApi['results'], {
    graphId,
    ...params
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