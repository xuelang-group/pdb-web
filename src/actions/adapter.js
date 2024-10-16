import axios from '../utils/axios';

const apiPrefix = '/adapter';
const api = {
  buzProcess: apiPrefix + '/buzProcess',  // 指标过程域列表
};

//指标过程域列表
export const getBuzProcess = (params, callback) => {
  return axios.get(api['buzProcess'],params).then(({ data }) => {
    callback && callback(true, data);
  }, (err) => {
    callback && callback(false, err);
  }); 
};

