import axios from "@/utils/axios";

const apiPrefix = '/pdb/oss/object';
const api = {
  get: apiPrefix + '/get',
  list: apiPrefix + '/list',
  put: apiPrefix + '/put',
  delete: apiPrefix + '/delete'
}

export const getObjectUrl = (Key, Bucket) => {
  return new Promise((resolve, reject) => {
    axios.post(api['get'], { Key, Bucket })
      .then(({ data }) => {
        if (data.success) {
          resolve(data.data);
        } else {
          reject(data);
        }
      }, (err) => {
        reject(err);
      });
  });
}

export const getObject = (Key, Bucket, isBinary) => {
  return new Promise((resolve, reject) => {
    getObjectUrl(Key, Bucket)
      .then((data) => {
        axios.getBinary(data, isBinary ? 'arraybuffer' : '')
          .then(function (r) {
            if (isBinary) {
              resolve(new Uint8Array(r))
            } else {
              resolve(r)
            }
          }, function (err) {
            reject(err)
          });
      }, (err) => {
        reject(err)
      })
  });
};

export const listObject = (Key, MaxKeys = 9999) => {
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

export const putObject = (Key, body, Bucket) => {
  return new Promise((resolve, reject) => {
    axios.post(api['put'], {
      Bucket,
      Key,
      Expires: 0,
      CacheControl: 'no-cache, must-revalidate',
      ignoreCheck: true
    }).then(({ data }) => {
      if (data.success) {
        axios.put(data.data, body)
          .then(res => resolve(res),
            (err) => reject(err));
      } else {
        reject(data);
      }
    }, (err) => reject(err));
  });
}

export const uploadObject = (Key, Bucket, file, onprogress, onerror, oncomplete) => {
  return new Promise((resolve, reject) => {
    axios.post(api['put'], {
      Bucket,
      Key,
    }).then(({ data }) => {
      if (data.success) {
        let xhr = new XMLHttpRequest();
        xhr.onload = function () {
          if (xhr.status === 200) {
            oncomplete();
          }
          else {
            onerror(xhr.statusText);
          }
        };
        xhr.onprogress = function (evt) {
          onprogress(evt);
        };
        xhr.open('PUT', data.data, true);
        xhr.send(file);
      } else {
        reject(data);
      }
    }, (err) => reject(err));
  });
}

export const deleteObject = (Key, Bucket) => {
  return new Promise((resolve, reject) => {
    axios.post(api['delete'], { Key, Bucket })
      .then(({ data }) => {
        if (data.success) {
          axios.delete(data.data).then((data) => {
            resolve(data);
          }, (err) => reject(err))
        } else {
          reject(data);
        }
      }, (err) => reject(err));
  });
}