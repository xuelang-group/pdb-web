import axios from '../utils/axios';
import { apiPrefix } from './graph';

const objectApiPrefix = `${apiPrefix}/object`;
const api = {
  add: `${objectApiPrefix}/add`,
  roots: `${objectApiPrefix}/roots`,
  delete: `${objectApiPrefix}/delete`,

  get: `${objectApiPrefix}/get`,
  update: `${objectApiPrefix}/update`,
  children: `${objectApiPrefix}/children`,
  copy: `${objectApiPrefix}/copy`,
  move: `${objectApiPrefix}/move`,
  count: `${objectApiPrefix}/count`,
  checkout: `${objectApiPrefix}/checkout`,
  checkin: `${objectApiPrefix}/checkin`,
  discard: `${objectApiPrefix}/checkout/discard`,
  search: apiPrefix + '/search',
  rearrange: `${objectApiPrefix}/children/rearrange`,
  list: `${objectApiPrefix}/list`
};

/**
 * 添加对象
 * @param {int} graphId 项目ID
 * @param {ObjectConfig} params 对象信息
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
 * 删除对象
 * @param {int} graphId 项目ID
 * @param {{'x.object.id': string, 'recurse'?: boolean}} params {'x.object.id': 对象ID, 'recurse'?: 包含删除下级实例}
 * @param {*} callback 
 * @returns 
 */
export const deleteObject = (graphId, params, callback) => {
  return axios.post(api['delete'], {
    graphId,
    ...params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};


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

// 更新对象
export const setObject = (params, callback) => {
  return axios.post(api['update'], {
    ...commonParams,
    ...params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 获取对象
export const getObject = (vid, callback) => {
  return axios.post(api['get'], {
    ...commonParams,
    vid
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

export const getObjects = (vid, callback) => {
  return axios.post(api['list'], {
    ...commonParams,
    vid
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 搜索
export const searchObjects = (params, callback) => {
  return axios.post(api['search'], {
    ...commonParams,
    ...params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 更新对象
export const countObject = (typeName, callback) => {
  // mock
  // callback && callback(true);

  return axios.post(api['count'], {
    ...commonParams,
    'x_type_name': typeName
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

export const getChildren = (params, callback) => {
  // mock
  // const data = [
  // ];
  // callback && callback(true, data);
  return axios.post(api['children'], {
    ...commonParams,
    ...params,
    "relation": true
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

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
  get: `${objectRelationApiPrefix}/get`,
  add: `${objectRelationApiPrefix}/add`,
  update: `${objectRelationApiPrefix}/update`,
  delete: `${objectRelationApiPrefix}/delete`,
  support: `${objectRelationApiPrefix}/support`,
  auto: `${objectRelationApiPrefix}/auto`
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

export const createObjectRelation = (params, callback) => {
  return axios.post(objectRelationApi['add'], {
    ...commonParams,
    set: params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

export const setObjectRelation = (params, callback) => {
  return axios.post(objectRelationApi['update'], {
    ...commonParams,
    set: params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

export const deleteObjectRelation = (params, callback) => {
  return axios.post(objectRelationApi['delete'], {
    ...commonParams,
    delete: params
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