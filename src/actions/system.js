import axios from '../utils/axios';

export const getSystemInfo = (callback) => {
  return axios.post('/pdb/system/info').then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};