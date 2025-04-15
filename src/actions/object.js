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
  copy: `${objectApiPrefix}/copy`,
  rearrange: `${objectApiPrefix}/children/rearrange`,
  count: `${objectApiPrefix}/count`,

  /** 接口暂未支持 */
  move: `${objectApiPrefix}/move`,
  checkout: `${objectApiPrefix}/checkout`,
  checkin: `${objectApiPrefix}/checkin`,
  discard: `${objectApiPrefix}/checkout/discard`,
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

/**
 * 复制对象
 * @param {int} graphId 项目ID
 * @param {{'x.object.id': string, 'x.object.version.parent': ObjectParentInfo, recurse?: boolean}} params { 'x.object.id': 对象ID, 'x.object.version.parent': 父对象信息, recurse: 是否同时复制该实例的所有下级实例，默认true }
 * @param {*} callback 
 * @returns 
 */
export const copyObject = (graphId, params, callback) => {
  return axios.post(api['copy'], {
    graphId,
    ...params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

/**
 * 移动对象
 * @param {int} graphId 项目ID
 * @param {{'x.object.id': string, 'x.object.version.parent': ObjectParentInfo, recurse?: boolean}} params { 'x.object.id': 对象ID, 'x.object.version.parent': 父对象信息, recurse: 是否同时复制该实例的所有下级实例，默认true }
 * @param {*} callback 
 * @returns 
 */
export const moveObject = (graphId, params, callback) => {
  return axios.post(api['move'], {
    graphId,
    ...params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

/**
 * 子对象顺序调整
 * @param {int} graphId 项目ID
 * @param {string} id 父对象ID
 * @param {*} callback 
 * @returns 
 */
export const rearrangeChildren = (graphId, id, callback) => {
  return axios.post(api['rearrange'], {
    graphId,
    'x.object.id': id
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
/**
 * 对象计数
 */
export const getObjectCount = async (graphId, typeId) => {
  return await axios.post(api['count'], {
    graphId,
    "x.type.id": typeId
  })
};

/**
 * =====================================================================
 * 对象关系相关
 */
const objectRelationApiPrefix = `${objectApiPrefix}/relation`

const objectRelationApi = {
  add: `${objectRelationApiPrefix}/add`,
  delete: `${objectRelationApiPrefix}/delete`,
  get: `${objectRelationApiPrefix}/get`,
  target: `${objectRelationApiPrefix}/target`,
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

/**
 * 获取对象关系
 * @param {int} graphId 项目ID 
 * @param {string} id 关系类型ID 
 * @param {*} callback 
 * @returns 
 */
export const getObjectRelation = (graphId, id, callback) => {
  return axios.post(objectRelationApi['get'], {
    graphId,
    'r.type.id': id
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

/**
 * 获取关系目标对象
 * @param {int} graphId 项目ID 
 * @param {*} params 
 * @param {*} callback 
 * @returns 
 */
export const getRelationTarget = (graphId, params, callback) => {
  return axios.post(objectRelationApi['target'], {
    graphId,
    ...params
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
  control: versionApiPrefix + "/control",       // 对象版本控制
  get: versionApiPrefix + "/get",               // 查询对象版本
  add: versionApiPrefix + "/add",               // 新增对象版本
  delete: versionApiPrefix + "/delete",         // 删除对象版本
  update: versionApiPrefix + "/update",         // 修改对象版本
  list: versionApiPrefix + "/list",             // 查询对象版本列表
  change: versionApiPrefix + "/change",         // 启用对象历史版本
  diff: versionApiPrefix + "/diff",             // 对象版本对比
  checkout: versionApiPrefix + "/checkout",
}

/**对象版本控制 [开启|关闭]
 * @param {
 *   'x.object.id': string;
 *   'x.object.version': bool;
 *   'x.object.version.name'?: string;
 *   'x.object.version.control'?: object;  // 配置版本变化控制
 * } params 
 * @returns 对象数组
 */
export const setControl = (params, callback) => {
  return axios.post(versionApi['control'], {
    ...commonParams,
    ...params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**查询对象版本
 * @param {
 *   'x.object.version.id': string;
 * } params 
 * @returns 对象数组
 */
export const getVersion = (params, callback) => {
  return axios.post(versionApi['get'], {
    ...commonParams,
    ...params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**新增、修改 对象版本
 * @param {
 *   'x.object.id': string;
 *   'x.object.version.id': string;
 *   'x.object.version.name': string;
 *   'x.object.version.description': string;
 *   'x.object.version.state': string;
 *   ...
 * } params 
 * @returns 对象数组
 */
export const addVersion = (params, callback) => {
  return axios.post(versionApi['add'], {
    ...commonParams,
    ...params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};
export const updateVersion = (params, callback) => {
  return axios.post(versionApi['update'], {
    ...commonParams,
    ...params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**删除对象版本
 * @param {
 *   'x.object.version.id': string;
 * } params 
 * @returns 
 */
export const delVersion = (params, callback) => {
  return axios.post(versionApi['delete'], {
    ...commonParams,
    ...params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/**启用对象历史版本
 * @param {
 *   'x.object.version.id': string;
 *   'x.object.version.name'?: string;
 *   'changeMethod': int;  启用方式 0-保存为新版本 1-直接回退
 * } params 
 */
export const changeVersion = (params, callback) => {
  return axios.post(versionApi['change'], {
    ...commonParams,
    ...params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

/** 
 * @param {'x.object.id': string} params 
 * @returns 对象数组
 */
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

/** 
 * @param {'oldVersionId': string; 'newVersionId': string} params 
 * @returns 对比结果 {isUpdated: boolean; base: object; attr: object}
 */
export const diffVersion = (params, callback) => {
  return axios.post(versionApi['diff'], {
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
