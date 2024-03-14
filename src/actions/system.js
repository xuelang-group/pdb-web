import axios from '../utils/axios';

export const getSystemInfo = (callback) => {
  // return callback(true, {
  //   "userId": 1000001,
  //   "appId": 55525,
  //   "nodeId": "08b403e0e1a611eeb5077d099eb5e29a",
  //   "graphId": ""
  // });
  return axios.post('/pdb/system/info').then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};