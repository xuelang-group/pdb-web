import axios from '../utils/axios';
import { apiPrefix } from './graph';

const objectApiPrefix = `${apiPrefix}/object`;
const api = {
  add: `${objectApiPrefix}/add`,
  roots: `${objectApiPrefix}/roots`,
  delete: `${objectApiPrefix}/delete`,
  update: `${objectApiPrefix}/update`,
  get: `${objectApiPrefix}/get`,
  children: `${objectApiPrefix}/children`,

  /** 接口暂未支持 */
  copy: `${objectApiPrefix}/copy`,
  move: `${objectApiPrefix}/move`,
  checkout: `${objectApiPrefix}/checkout`,
  checkin: `${objectApiPrefix}/checkin`,
  discard: `${objectApiPrefix}/checkout/discard`,
  rearrange: `${objectApiPrefix}/children/rearrange`,
};

/**
 * 创建对象类型（支持批量）
 * @param {int} graphId 项目ID
 * @param {ObjectConfig[]} params 对象信息
 * @param {*} callback 
 * @returns 
 */
export const addObject = (graphId, params, callback) => {
  return axios.post(api['add'], {
    graphId,
    set: params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**
 * 获取根对象
 * @param {int} graphId 项目ID
 * @param {*} callback 
 * @returns 
 */
export const getRoots = (graphId, callback) => {
  return axios.post(api['roots'], { graphId }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

/**
 * 删除对象（支持批量）
 * @param {int} graphId 项目ID
 * @param {{'x.object.id': string, 'recurse'?: boolean}[]} params {'x.object.id': 对象ID, 'recurse'?: 包含删除下级实例}
 * @param {*} callback 
 * @returns 
 */
export const deleteObject = (graphId, params, callback) => {
  return axios.post(api['delete'], {
    graphId,
    set: params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**
 * 修改对象 (支持批量)
 * @param {int} graphId 项目ID
 * @param {ObjectConfig[]} objects 对象数组
 * @param {*} callback 
 * @returns 
 */
export const setObject = (graphId, objects, callback) => {
  return axios.post(api['update'], {
    graphId,
    set: objects
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**
 * 获取对象 (支持批量)
 * @param {int} graphId 项目ID
 * @param {{'x.object.id': string}[]} ids 对象ID列表
 * @param {*} callback 
 * @returns 
 */
export const getObject = (graphId, ids, callback) => {
  return axios.post(api['get'], {
    graphId,
    set: ids
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**
 * 获取子对象
 * @param {int} graphId 项目ID
 * @param {{'x.object.id': string, relation?: boolean, offset?: number, first?: number}} params 
 * @param {*} callback 
 * @returns 
 */
export const getChildren = (graphId, params, callback) => {
  return axios.post(api['children'], {
    graphId,
    relation: true, // 返回数据是否包含关系
    ...params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

const commonParams = {
  graphId: 0
};

export function setCommonParams(params) {
  Object.assign(commonParams, params);
}

export const checkOutObject = (vid, callback) => {

  return axios.post(api['checkout'], {
    ...commonParams,
    vid
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

export const checkInObject = (vid, callback) => {

  return axios.post(api['checkin'], {
    ...commonParams,
    vid
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

export const discardObject = (vid, callback) => {

  return axios.post(api['discard'], {
    ...commonParams,
    vid
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 复制对象
export const copyObject = (params, callback) => {
  return axios.post(api['copy'], {
    ...commonParams,
    ...params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

// 移动对象
export const moveObject = (params, callback) => {
  return axios.post(api['move'], {
    ...commonParams,
    ...params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

export const rearrangeChildren = (params, callback) => {
  return axios.post(api['rearrange'], {
    ...commonParams,
    ...params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}


/**
 * =====================================================================
 * 对象关系相关
 */
const objectRelationApiPrefix = `${objectApiPrefix}/relation`

const objectRelationApi = {
  add: `${objectRelationApiPrefix}/add`,
  delete: `${objectRelationApiPrefix}/delete`,

  get: `${objectRelationApiPrefix}/get`,
  update: `${objectRelationApiPrefix}/update`,
  support: `${objectRelationApiPrefix}/support`,
  auto: `${objectRelationApiPrefix}/auto`
}

/**
 * 添加或修改对象关系
 * @param {int} graphId 项目ID 
 * @param {ObjectRelationInfo[]} params 对象关系数组
 * @param {*} callback 
 * @returns 
 */
export const setObjectRelation = (graphId, params, callback) => {
  return axios.post(objectRelationApi['add'], {
    graphId,
    set: params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

/**
 * 删除对象关系
 * @param {int} graphId 项目ID 
 * @param {ObjectRelationInfo[]} params 对象关系数组
 * @param {*} callback 
 * @returns 
 */
export const deleteObjectRelation = (graphId, params, callback) => {
  return axios.post(objectRelationApi['delete'], {
    graphId,
    set: params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

export const getObjectRelation = (uid, callback) => {
  return axios.post(objectRelationApi['get'], {
    ...commonParams,
    uid
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

export const getRelationTarget = (params, callback) => {
  return axios.post('/pdb/api/v1/graph/relation/target', {
    ...commonParams,
    ...params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

export const createAutoRelation = (params, callback) => {
  return axios.post(objectRelationApi['auto'], {
    ...commonParams,
    set: params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

/**
 * 版本相关
 */
const versionApiPrefix = `${objectApiPrefix}/version`

const versionApi = {
  list: versionApiPrefix + "/list",
  checkout: versionApiPrefix + "/checkout",
}

export const getVersionList = (params, callback) => {

  return axios.post(versionApi['list'], {
    ...commonParams,
    ...params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

export const getCheckoutVersion = (vid, callback) => {
  return axios.post(versionApi['checkout'], {
    ...commonParams,
    vid
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};