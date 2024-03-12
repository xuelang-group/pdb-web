import axios from '@/utils/axios';
import { useSelector } from 'react-redux';
import { getStsToken } from './stsToken';

export default function ossService() {

  const appConfig = {};
  const ALY = window.ALY;
  let _oss;

  const getOssErrorMsg = function (err) {
    let msg = '';
    switch (err.code) {
      default:
        msg = '网络错误';
    }
    return msg;
  };

  const getOss = function () {
    return new Promise((resolve, reject) => {
      getStsToken().then(function (result) {
        let token = result.token;
        if (!_oss || result.refresh) {
          _oss = new ALY.OSS({
            accessKeyId: token.Credentials.AccessKeyId,
            secretAccessKey: token.Credentials.AccessKeySecret,
            securityToken: token.Credentials.SecurityToken,
            endpoint: appConfig.oss.endpoint,
            apiVersion: '2013-10-15'
          });

          resolve(_oss);
        }
        else {
          resolve(_oss);
        }
      }, function (err) {
        reject(err);
      });
    });
  };

  const upload = function (key, file, onprogress, onerror, oncomplete) {
    return new Promise((resolve, reject) => {
      getStsToken().then(function (result) {
        let ossUpload = new window.OssUpload({
          bucket: appConfig.oss.bucket,
          endpoint: appConfig.oss.endpoint,
          chunkSize: 1048576,
          concurrency: 3,
          stsToken: result.token
        });
        ossUpload.upload({
          file: file,
          key: key,
          // 上传失败后重试次数
          maxRetry: 1,
          headers: {
            'ServerSideEncryption': '',
            'ContentDisposition': 'attachment'
          },
          onprogress: function (evt) {
            onprogress(evt);
          },
          onerror: function (evt) {
            onerror(evt);
          },
          oncomplete: function (res) {
            oncomplete(res);
          }
        });
        resolve('uploaded');
      }, function (err) {
        reject(err);
      });
    });
  };

  const getObject = function (bucket, key, range, isBinary) {
    return new Promise((resolve, reject) => {
      axios.post('/oss/object/check', {
        Bucket: bucket,
        Key: key,
        type: 'get'
      }).then(function (res) {
        getOss().then(function (oss) {
          oss.getObject({
            Bucket: bucket,
            Key: key,
            Range: range ? 'bytes=' + range : ''
          },
            function (err, data) {
              if (err) {
                reject({
                  err,
                  msg: getOssErrorMsg(err)
                });
                return;
              }
              if (isBinary) {
                resolve(data.Body);
              }
              else {
                resolve(data.Body.toString());
              }
            });
        }, function (err) {
          reject(err);
        });
      }, function (err) {
        reject(err);
      });
    });
  };

  const headObject = function (bucket, key) {
    return new Promise((resolve, reject) => {
      axios.post('/oss/object/check', {
        Bucket: bucket,
        Key: key,
        type: 'head'
      }).then(function (res) {
        getOss().then(function (oss) {
          oss.headObject({
            Bucket: bucket,
            Key: key
          },
            function (err, data) {
              if (err) {
                reject({
                  err,
                  msg: getOssErrorMsg(err)
                });
                return;
              }
              resolve(data);
            });
        }, function (err) {
          reject(err);
        });
      }, function (err) {
        reject(err);
      });
    });
  };

  const deleteObject = function (bucket, key) {
    return new Promise((resolve, reject) => {
      axios.post('/oss/object/check', {
        Bucket: bucket,
        Key: key,
        type: 'get'
      }).then(function (res) {
        getOss().then(function (oss) {
          oss.deleteObject({
            Bucket: bucket,
            Key: key
          },
            function (err, data) {
              if (err) {
                reject({
                  err,
                  msg: getOssErrorMsg(err)
                });
                return;
              }
              resolve(data);
            });
        }, function (err) {
          reject(err);
        });
      }, function (err) {
        reject(err);
      });
    });
  };

  const doPut = function (bucket, key, body, contentType, acl) {
    return new Promise((resolve, reject) => {
      getOss().then(function (oss) {
        oss.putObject({
          Bucket: bucket,
          Key: key,
          Body: body,
          ACL: acl,
          ContentType: contentType,
          Expires: 0,
          CacheControl: 'no-cache, must-revalidate'
        },
          function (err, data) {
            if (err) {
              reject({
                err,
                msg: getOssErrorMsg(err)
              });
              return;
            }
            resolve(data);
          });
      }, function (err) {
        reject(err);
      });
    });
  };

  const putObject = function (bucket, key, body, contentType, acl, force, ignoreCheck) {
    return new Promise((resolve, reject) => {
      if (force) {
        doPut(bucket, key, body, contentType, acl).then(function (data) {
          resolve(data);
        }, function (err) {
          reject(err);
        });
      } else {
        axios.post('/oss/object/check', {
          Bucket: bucket,
          Key: key,
          ignoreCheck: ignoreCheck,
          type: 'put'
        }).then(function (res) {
          doPut(bucket, key, body, contentType, acl).then(function (data) {
            resolve(data);
          }, function (err) {
            reject(err);
          });
        }, function (err) {
          reject(err);
        });
      }
    });
  };

  const getObject2 = function (bucket, key, range, isBinary) {
    return new Promise((resolve, reject) => {
      axios.post('/oss/object/get', {
        Bucket: bucket,
        Key: key
      }).then(function (res) {
        axios.getBinary(res.data, isBinary ? 'arraybuffer' : '')
          .then(function (r) {
            if (isBinary) {
              resolve(new Uint8Array(r));
            } else {
              resolve(r);
            }
          }, function (err) {
            reject(err);
          });
      }, function (err) {
        reject(err);
      });
    });
  };

  const headObject2 = function (bucket, key) {
    return new Promise((resolve, reject) => {
      axios.post('/oss/object/head', {
        Bucket: bucket,
        Key: key
      }).then(function (res) {
        res.data.NextAppendPosition = res.data.ContentLength;
        resolve(res.data);
      }, function (err) {
        reject(err);
      });
    });
  };

  const deleteObject2 = function (bucket, key) {
    return new Promise((resolve, reject) => {
      axios.post('/oss/object/delete', {
        Bucket: bucket,
        Key: key
      }).then(function (res) {
        axios.delete(res.data)
          .then(function (res) {
            resolve(res);
          }, function (err) {
            reject(err);
          });
      }, function (err) {
        reject(err);
      });
    });
  };

  const putObject2 = function (bucket, key, body, contentType, acl, force = false, ignoreCheck) {
    return new Promise((resolve, reject) => {
      axios.post('/oss/object/put', {
        Bucket: bucket,
        Key: key,
        Expires: 0,
        CacheControl: 'no-cache, must-revalidate',
        ignoreCheck: force || ignoreCheck
      }).then(function (res) {
        axios.put(res.data, body)
          .then(function (res) {
            resolve(res);
          }, function (err) {
            reject(err);
          });
      }, function (err) {
        reject(err);
      });
    });
  };

  const upload2 = function (key, file, onprogress, onerror, oncomplete) {
    return new Promise((resolve, reject) => {
      axios.post('/oss/object/put', {
        Bucket: appConfig.oss.bucket,
        Key: key
      }).then(function (res) {
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
        xhr.open('PUT', res.data, true);
        xhr.send(file);

        resolve(res);
      }, function (err) {
        reject(err);
      });
    });
  };

  let s = {
    getOss: getOss,
    upload: upload,
    getObject: getObject,
    headObject: headObject,
    putObject: putObject,
    deleteObject: deleteObject
  };

  if (appConfig.ossType === 'minio') {
    s.getObject = getObject2;
    s.headObject = headObject2;
    s.deleteObject = deleteObject2;
    s.putObject = putObject2;
    s.upload = upload2;
  }

  return s;
}