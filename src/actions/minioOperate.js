import axios from "@/utils/axios";
import _ from "lodash";

const apiPrefix = '/pdb/oss/object';
const api = {
  get: apiPrefix + '/get',
  list: apiPrefix + '/list',
  put: apiPrefix + '/put',
  upload: apiPrefix + '/fput',
  delete: apiPrefix + '/delete'
}

export const getImagePath = (name) => _.get(window, 'pdbConfig.basePath', '') + api['get'] + `?Key=${name}`;

export const getImgHref = (name) => {
  if (name.startsWith("./")) {
    name = _.get(window, 'pdbConfig.basePath', '') + name.replace("./", "/");
  }
  return name;
}
export const getFile = (Key) => {
  return new Promise((resolve, reject) => {
    axios.get(api['get'], { Key })
      .then(({ data }) => {
        resolve(data);
      }, (err) => {
        reject(err);
      });
  });
}

export const listFile = (Key, MaxKeys = 9999) => {
  return new Promise((resolve, reject) => {
    axios.post(api['list'], {
      Key,
      Marker: "",
      Delimiter: "",
      MaxKeys
    }).then(({ data }) => {
      if (data.success) {
        resolve(data.data);
      } else {
        reject(data);
      }
    }, (err) => {
      reject(err)
    })
  })
}

export const putFile = (Key, file) => {
  return new Promise((resolve, reject) => {
    axios.post(api['put'], { Key, file }).then(({ data }) => {
      if (data.success) {
        resolve(data)
      } else {
        reject(data);
      }
    }, (err) => {
      reject(err);
    });
  });
}

export const uploadFile = (Key, file) => {
  const data = new FormData();
  data.append('file', file);
  data.append('Key', Key);
  return new Promise((resolve, reject) => {
    axios.post(api['upload'], data, { 'Content-Type': 'multipart/form-data' }).then(({ data }) => {
      if (data.success) {
        resolve(data);
      } else {
        reject(data);
      }
    }, (err) => reject(err));
  });
}

export const deleteFile = (Key) => {
  return new Promise((resolve, reject) => {
    axios.post(api['delete'], { Key })
      .then(({ data }) => {
        if (data.success) {
          resolve(data);
        } else {
          reject(data);
        }
      }, (err) => reject(err));
  });
}