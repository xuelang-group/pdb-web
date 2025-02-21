/**
 * 对象类型管理
 */
import axios from '@/utils/axios';
import { apiPrefix } from './graph';

const typeApiPrefix = `${apiPrefix}/type`;
const api = {
  add: typeApiPrefix + '/add',
  delete: typeApiPrefix + '/delete',
  update: typeApiPrefix + '/update',
  get: typeApiPrefix + '/get',
  copy: typeApiPrefix + '/copy',
  checkReferLock: typeApiPrefix + '/children/reference/lock/check',
  checkObject: typeApiPrefix + '/object/exist/check',
  checkChildrenObject: typeApiPrefix + '/children/object/exist/check',
};

/**
 * 创建对象类型
 * @param {int} graphId 项目ID
 * @param {TypeConfig[]} params 类型信息
 * @param {Function} callback 
 * @returns 
 */
export const addType = (graphId, params, callback) => {
  return axios.post(api['add'], {
    graphId,
    set: params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

/**
 * 类型的删除
 * @param {int} graphId 项目ID
 * @param {string | string[]} type 类型ID列表
 * @param {Function} callback 
 * @returns 
 */
export const deleteType = (graphId, type, callback) => {
  return axios.post(api['delete'], {
    graphId,
    type
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**
 * 类型的更新
 * @param {int} graphId 项目ID
 * @param {TypeConfig[]} params 类型信息
 * @param {Function} callback 
 * @returns 
 */
export const setType = (graphId, params, callback) => {
  return axios.post(api['update'], {
    graphId,
    set: params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};
/**
 * 复制对象类型
 * @param {int} graphId 项目ID
 * @param {'x.type.id': string, 'x.type.name': string, 'x.type.version.name': string, copyMethod: } param 类型信息
 * @param {Function} callback 
 * @returns 
 */
export const copyType = (graphId, param, callback) => {
  return axios.post(api['copy'], {
    graphId,
    ...param
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**
 * 获取某个类型数据
 * @param {int} graphId 项目ID
 * @param {string[]} type 类型ID列表
 * @param {Function} callback 
 * @returns 
 */
export const getTypeInfo = (graphId, type, callback) => {
  return axios.post(api['get'], { graphId, type }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**
 * 获取项目的类型列表
 * @param {int} graphId 项目ID
 * @param {Function} callback 
 * @returns 
 */
export const getTypeList = (graphId, callback) => {
  return axios.post(api['get'], { graphId }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**
 * 判断任一继承对象类型以“锁定当前版本”的方式引用父类型
 */
export const checkReferLock = (graphId, typeId, callback) => {
  return axios.post(api['checkReferLock'], {
    graphId,
    "x.type.id": typeId
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**
 * 判断对象类型存在实例
 */
export const checkObject = (graphId, typeId, callback) => {
  return axios.post(api['checkObject'], {
    graphId,
    "x.type.id": typeId
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**
 * 判断任一“非锁定当前版本”的继承对象类型已有实例
 */
export const checkChildrenObject = (graphId, typeId, callback) => {
  return axios.post(api['checkChildrenObject'], {
    graphId,
    "x.type.id": typeId
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**
 * 对象类型版本相关API
 */
const typeVersionApiPrefix = `${typeApiPrefix}/version`;
const versionApi = {
  'control': typeVersionApiPrefix + '/control',
  'add': typeVersionApiPrefix + '/add',
  'delete': typeVersionApiPrefix + '/delete',
  'update': typeVersionApiPrefix + '/update',
  'copy': typeVersionApiPrefix + '/copy',
  'list': typeVersionApiPrefix + '/list',
  'get': typeVersionApiPrefix + '/get',
  'change': typeVersionApiPrefix + '/change',
  'diff': typeVersionApiPrefix + '/diff',
}

/**
 * 新增对象类型版本
 * @param {int} graphId 项目ID
 * @param {TypeConfig} typeInfo 类型信息
 * @param {Function} callback 
 * @returns 
 */
export const addTypeVerison = (graphId, typeInfo, callback) => {
  return axios.post(versionApi['add'], { graphId, ...typeInfo }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**
 * 删除对象类型版本
 * @param {int} graphId 项目ID
 * @param {string} typeVersionID 类型版本ID
 * @param {Function} callback 
 * @returns 
 */
export const deleteTypeVerison = (graphId, typeVersionID, callback) => {
  return axios.post(versionApi['delete'], { graphId, "x.type.version.id": typeVersionID }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**
 * 复制对象类型版本
 * @param {int} graphId 项目ID
 * @param {string} x.type.name 类型名称
 * @param {string} x.type.version.id 要复制对象类型的版本ID
 * @param {string} x.type.version.name 要复制对象类型的版本ID
 * @param {number} copyMethod 复制范围 0-该版本 1-该版本及其之前版本
 * @param {Function} callback 
 * @returns 
 */
export const copyTypeVerison = (params, callback) => {
  return axios.post(versionApi['copy'], params).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**
 * 修改对象类型版本
 * @param {int} graphId 项目ID
 * @param {TypeConfig} typeInfo 类型信息
 * @param {Function} callback 
 * @returns 
 */
export const updateTypeVerison = (graphId, typeInfo, callback) => {
  return axios.post(versionApi['update'], { graphId, ...typeInfo }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**
  type VersionListParam = {
    "x.type.id": string; // 类型ID
    "first": int;  // 分页大小
    "offset": int; // 偏移量
  }
 * 查询对象类型版本列表
 * @param {int} graphId 项目ID
 * @param {VersionListParam} param
 * @param {Function} callback 
 * @returns 
 */
export const getTypeVerisonList = (graphId, param, callback) => {
  return axios.post(versionApi['list'], { graphId, ...param }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**
 * 查询对象类型版本信息
 * @param {int} graphId 项目ID
 * @param {string} type 类型ID
 * @param {string | null} typeVersionID 类型版本ID，不填默认查询类型的全部版本
 * @param {Function} callback 
 * @returns 
 */
export const getTypeVerison = (graphId, type, typeVersionID, callback) => {
  return axios.post(versionApi['get'], { graphId, type, typeVersionID }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**
 * 类型版本控制切换
 * @param {int} graphId 项目ID
 * @param {string} type 类型ID
 * @param {boolean} typeVersion 开启版本控制
 * @param {Function} callback 
 * @returns 
 */
export const updateTypeVerisonControl = (params, callback) => {
  return axios.post(versionApi['control'], params).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**
 * 启用对象类型历史版本
 * @param {int} graphId 项目ID
 * @param {string} x.type.version.id" 要启用的版本ID
 * @param {string} x.type.version.name 版本名称（版本号）
 * @param {integer} changeMethod 启用方式 0-保存为新版本 1-直接回退
 * @param {Function} callback 
 * @returns 
 */
export const changeTypeVerison = (param, callback) => {
  return axios.post(versionApi['change'], param).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**
 * 对象类型版本对比
 * @param {int} graphId 项目ID
 * @param {string} oldVersionId 要对比的旧版本ID
 * @param {string} newVersionId 要对比的新版本ID
 * @param {Function} callback 
 * @returns 
 */
export const diffTypeVerison = (graphId, oldVersionId, newVersionId, callback) => {
  return axios.post(versionApi['diff'], {
    graphId,
    oldVersionId,
    newVersionId
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**
 * 退出类型编辑
 * @param {int} graphId 项目ID
 * @param {*} callback 
 * @returns 
 */
export const resetSchema = (graphId, callback) => {
  return axios.post(`${apiPrefix}/schema/reset`, {
    graphId: graphId ? Number(graphId) : 0,
  }).then(({ data }) => {
    callback && callback(data.success);
  }, (err) => {
    callback && callback(false, err);
  });
};