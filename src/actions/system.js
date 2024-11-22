import axios from '../utils/axios';

// 获取系统信息
export const getSystemInfo = (callback) => {
  return axios.post('/pdb/system/info').then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};