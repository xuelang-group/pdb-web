import { useSelector } from 'react-redux';
import axios from '../utils/axios';
import ossService from './ossService';
import _ from "lodash";

export default function ossOperate() {
  const bucket = "";
  const ossAppDataStore = {
    head: function (key) {
      return ossService.headObject(bucket, key);
    },
    get: function (key, isBinary) {
      return ossService.getObject(bucket, key, null, isBinary);
    },
    list: function (key, nextMarker, maxKeys = 1000) {
      return axios.post('/oss/object/list', {
        Bucket: bucket,
        Key: key,
        Delimiter: '/',
        Marker: nextMarker,
        MaxKeys: maxKeys
      });
    },
    putObjectAcl: function (bucket, key, acl) {
      return ossService.putObjectAcl(bucket, key, acl);
    },
    url: function (key) {
      return axios.post('/oss/object/get', {
        Bucket: bucket,
        Key: key
      });
    },
    upload: function (uploadPath, file, onprogress, onerror, oncomplete) {
      return axios.post('/oss/object/check', {
        Bucket: bucket,
        Key: uploadPath,
        type: 'put'
      }).then(function (res) {
        if (res.success) {
          return ossService.upload(uploadPath, file, onprogress, onerror, oncomplete);
        }
      }, function (err) {
      });
    },
    remove: function (key) {
      function removeObj(objKey) {
        return ossService.deleteObject(bucket, objKey);
      }
  
      function removeDir(dirKey, marker) {
        return ossAppDataStore.list(dirKey, marker).then(function removeObjs(res) {
          if (res.success) {
            let promises = res.data.NextMarker ? [removeDir(dirKey, res.data.NextMarker)] : [];
            let contentPromises = _.map(res.data.Contents, function (content) { return removeObj(content.Key); });
            let prefixPromises = _.map(res.data.CommonPrefixes, function (prefix) { return removeDir(prefix.Prefix); });
            return promises.concat(contentPromises, prefixPromises);
          }
        });
      }
  
      return ossAppDataStore.head(key).then(
        function () { return removeObj(key) },
        function () { return removeDir(key) });
    },
    copy: function (sourceKey, targetKey) {
      return axios.post('/oss/object/copyDir', {
        Bucket: bucket,
        Key: sourceKey,
        targetKey: targetKey
      });
    }
  };

  const list = (key, nextMarker, maxKeys = 1000) => {
    return axios.post('/oss/object/list', {
      Bucket: bucket,
      Key: key,
      Delimiter: '/',
      Marker: nextMarker,
      MaxKeys: maxKeys
    });
  }

  const url = (key) => {
    return axios.post('/oss/object/get', {
      Bucket: bucket,
      Key: key
    });
  }

  const upload = (uploadPath, file, onprogress, onerror, oncomplete) => {
    return axios.post('/oss/object/check', {
      Bucket: bucket,
      Key: uploadPath,
      type: 'put'
    }).then(function (res) {
      if (res.success) {
        return ossService.upload(uploadPath, file, onprogress, onerror, oncomplete);
      }
    }, function (err) {
      return new Promise((resolve) => resolve(err));
    });
  }

  const remove = (key) => {
    function removeObj(objKey) {
      return ossService.deleteObject(bucket, objKey);
    }

    function removeDir(dirKey, marker) {
      return ossAppDataStore.list(dirKey, marker).then(function removeObjs(res) {
        if (res.success) {
          let promises = res.data.NextMarker ? [removeDir(dirKey, res.data.NextMarker)] : [];
          let contentPromises = _.map(res.data.Contents, function (content) { return removeObj(content.Key); });
          let prefixPromises = _.map(res.data.CommonPrefixes, function (prefix) { return removeDir(prefix.Prefix); });
          return promises.concat(contentPromises, prefixPromises);
        }
      });
    }

    return ossAppDataStore.head(key).then(
      function () { return removeObj(key) },
      function () { return removeDir(key) });
  }

  const get = (key, isBinary) => {
    return ossService.getObject(bucket, key, null, isBinary);
  }

  return {
    get,
    list,
    remove,
    upload,
    url
  };
}
