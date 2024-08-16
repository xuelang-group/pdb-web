import axios from '../utils/axios';

const apiPrefix = '/pdb/api/v1';
const objectApiPrefix = `${apiPrefix}/object`
const api = {
  get: `${objectApiPrefix}/get`,
  add: `${objectApiPrefix}/add`,
  update: `${objectApiPrefix}/update`,
  delete: `${objectApiPrefix}/delete`,
  roots: `${objectApiPrefix}/roots`,
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

const commonParams = {
  graphId: 0
};

export function setCommonParams(params) {
  Object.assign(commonParams, params);
}

export const checkOutObject = (uid, callback) => {

  return axios.post(api['checkout'], {
    ...commonParams,
    uid
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

export const checkInObject = (uid, callback) => {

  return axios.post(api['checkin'], {
    ...commonParams,
    uid
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

export const discardObject = (uid, callback) => {

  return axios.post(api['discard'], {
    ...commonParams,
    uid
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 创建对象
export const clearObjects = (callback) => {
  return axios.post(apiPrefix + '/graph/drop/data', {
    ...commonParams,
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 创建对象
export const addObject = (params, callback) => {
  return axios.post(api['add'], {
    ...commonParams,
    set: params
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

// 删除对象
export const deleteObject = (params, callback) => {
  return axios.post(api['delete'], {
    ...commonParams,
    ...params
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

export const getRoots = (callback) => {
  return axios.post(api['roots'], {
    ...commonParams
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

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
  support: `${objectRelationApiPrefix}/support`
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

// 获取对象对应类型配置的关系 - 暂无使用
// export const getTypeSupportRelation = (typeName, callback) => {
//   return axios.post(objectRelationApi['support'], {
//     ...commonParams,
//     'x_type_name': typeName
//   }).then(({ data }) => {
//     callback && callback(data.success, data.success ? data.data : data);
//   }, (err) => {
//     callback && callback(false, err);
//   });
// }


/**
 * 项目系统
 */
const graphApiPrefix = `${apiPrefix}/graph`
const graphApi = {
  type: `${graphApiPrefix}/type`,
  relation: `${graphApiPrefix}/relation`,
  template: `${graphApiPrefix}/template`
};

// 获取项目对象类型
export const getGraphTypes = (graphId, callback) => {
  return axios.post(graphApi['type'], { ...commonParams, graphId }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

// 获取项目关系类型
export const getGraphRelations = (graphId, callback) => {
  return axios.post(graphApi['relation'], { ...commonParams, graphId }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}


// 获取生成项目的模板
export const getGraphTemplate = (graphId, callback) => {
  return axios.post(graphApi['template'], { ...commonParams, graphId }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

/**
 * 项目列表操作
 */

const listApiPrefix = apiPrefix + '/graph';
const listApi = {
  list: listApiPrefix + '/list',
  create: listApiPrefix + '/add',
  remove: listApiPrefix + '/delete',
  update: listApiPrefix + '/update',
  get: listApiPrefix + '/get',
}

// 获取项目列表
export const getObjectList = (callback) => {
  return axios.post(listApi['list'], {}).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

// 获取项目信息
export const getObjectData = (graphId, callback) => {
  return axios.post(listApi['get'], { graphId }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

// 创建项目
export const createObject = (params, callback) => {
  return axios.post(listApi['create'], params).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

// 修改项目信息
export const updateObjectInfo = (params, callback) => {
  return axios.post(listApi['update'], params).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

// 删除项目
export const removeObject = (graphId, callback) => {
  return axios.post(listApi['remove'], { graphId }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

/**
 * 批量操作
 */
const batchApiPrefix = listApiPrefix + '/batch';
const batchApi = {
  delete: batchApiPrefix + '/delete',
  updateInfo: batchApiPrefix + '/update/info'
}

// 修改项目信息
export const updateObjects = (data, callback) => {
  return axios.post(batchApi['updateInfo'], { data }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

// 删除项目
export const removeObjects = (data, callback) => {
  return axios.post(batchApi['delete'], { data }).then(({ data }) => {
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

export const getCheckoutVersion = (uid, callback) => {
  return axios.post(versionApi['checkout'], {
    ...commonParams,
    uid
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};