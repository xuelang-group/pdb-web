import axios from 'axios';
import _ from 'lodash';
axios.defaults.withCredentials = false;

const wrapUrl = function (url) {
  if (url.startsWith("http") || url.startsWith("https")) return url;
  return _.get(window, 'pdbConfig.basePath', '') + url;
}
export default {
  post(url, data, headers) {
    const header = {
      'Access-Control-Allow-Origin': '*',
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/json',
    };
    Object.assign(header, headers);
    return new Promise((resolve, reject) => {
      axios({
        method: 'POST',
        url: wrapUrl(url),
        data,
        headers: header,
        timeout: 0,
      }).then((res) => {
        resolve(res);
      }, (err) => {
        reject(err);
      });
    });
  },
  get(url, params, headers, bufferParams = {}) {
    const header = {
      // "Access-Control-Allow-Origin":"http://47.94.169.83:7749",
      'Access-Control-Allow-Origin': '*',
      'X-Requested-With': 'XMLHttpRequest',
    };
    Object.assign(header, headers);
    return new Promise((resolve, reject) => {
      axios({
        method: 'GET',
        url: wrapUrl(url),
        params,
        timeout: 0,
        headers: header,
        ...bufferParams,
      }).then(
        (response) => {
          resolve(response);
        },
        (err) => {
          reject(err);
        },
      );
    });
  },
  put(url, data, headers) {
    const header = {
      'Access-Control-Allow-Origin': '*',
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/json',
    };
    Object.assign(header, headers);
    return new Promise((resolve, reject) => {
      axios({
        method: 'PUT',
        url: wrapUrl(url),
        data,
        headers: header,
        timeout: 0,
        transformRequest: [],
      }).then((res) => {
        resolve(res);
      },
        (err) => {
          reject(err);
        });
    });
  },
  head(url, headers) {
    const header = {
      'Access-Control-Allow-Origin': '*',
      'X-Requested-With': 'XMLHttpRequest',
    };
    Object.assign(header, headers);
    return new Promise((resolve, reject) => {
      axios({
        method: 'HEAD',
        url: wrapUrl(url),
        headers: header,
        timeout: 0,
      }).then((res) => {
        resolve(res);
      },
        (err) => {
          reject(err);
        });
    });
  },
  delete(url, data, headers, bufferParams = {}) {
    const header = {
      'Access-Control-Allow-Origin': '*',
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/json',
    };
    Object.assign(header, headers);
    return new Promise((resolve, reject) => {
      axios({
        method: 'delete',
        url: wrapUrl(url),
        data,
        timeout: 0,
        headers: header,
      }).then(
        (response) => {
          resolve(response);
        },
        (err) => {
          reject(err);
        },
      );
    });
  },
  getBinary(url, responseType) {
    return new Promise((resolve, reject) => {
      axios({
        method: 'GET',
        url: wrapUrl(url),
        responseType: responseType,
      }).then(
        (response) => {
          resolve(response.data);
        },
        (err) => {
          reject(err);
        },
      );
    });
  }
};
