import axios from '@/utils/axios';
import { commonParams } from '@/utils/common';

const apiPrefix = '/pdb/api/v1/type';
const api = {
  add: apiPrefix + '/add',
  update: apiPrefix + '/update',
  delete: apiPrefix + '/delete',
  get: apiPrefix + '/get',
};

// 获取某个类型数据
export const getTypeInfo = (type, callback) => {
  let params = { ...commonParams };
  if (type) {
    Object.assign(params, { type });
  }

  return axios.post(api['get'], params).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 获取项目的类型列表
export const getTypeList = (graphId, callback) => {
  return callback(true, [
    {
      "x.type.name": "Type.2pw3k81HxU2RSqgOB9Q1730269234032",
      "x.type.label": "Chapter",
      "x.type.metadata": "{\"color\":\"#e896d9\"}",
      "x.type.attrs": [
        {
          "name": "ChapterNumber",
          "display": "章节编号",
          "type": "string",
          "default": null,
          "required": false
        },
        {
          "name": "Title",
          "display": "标题",
          "type": "string",
          "default": null,
          "required": false
        }
      ],
      "x.type.prototype": [],
      "x.type.created": 1735870254944,
      "x.type.last_change": 1735870254944
    },
    {
      "x.type.name": "Type.iNu3uyfIFtpQTPuivlj1730272569838",
      "x.type.label": "Section",
      "x.type.metadata": "{\"color\":\"#e8e0a6\"}",
      "x.type.attrs": [
        {
          "name": "SectionNumber",
          "display": "小节编号",
          "type": "string",
          "default": null,
          "required": false
        },
        {
          "name": "Title",
          "display": "标题",
          "type": "string",
          "default": null,
          "required": false
        }
      ],
      "x.type.prototype": [
        "Type.2pw3k81HxU2RSqgOB9Q1730269234032"
      ],
      "x.type.created": 1735870254950,
      "x.type.last_change": 1735870254950
    },
    {
      "x.type.name": "Type.2yHAnTORkIVF35NnLh11730272598748",
      "x.type.label": "Subject",
      "x.type.metadata": "{\"color\":\"#e3c496\"}",
      "x.type.attrs": [
        {
          "name": "SubjectNumber",
          "display": "主题编号",
          "type": "string",
          "default": null,
          "required": false
        },
        {
          "name": "Title",
          "display": "标题",
          "type": "string",
          "default": null,
          "required": false
        }
      ],
      "x.type.prototype": [
        "Type.iNu3uyfIFtpQTPuivlj1730272569838"
      ],
      "x.type.created": 1735870254966,
      "x.type.last_change": 1735870254966
    },
    {
      "x.type.name": "Type.izBeV3GPyvkKiiABmiR1730272690966",
      "x.type.label": "PageSet",
      "x.type.metadata": "{\"color\":\"#d7bccb\"}",
      "x.type.attrs": [
        {
          "name": "PageSetNumber",
          "display": "页面集编号",
          "type": "string",
          "default": null,
          "required": false
        },
        {
          "name": "Title",
          "display": "标题",
          "type": "string",
          "default": null,
          "required": false
        }
      ],
      "x.type.prototype": [
        "Type.2yHAnTORkIVF35NnLh11730272598748"
      ],
      "x.type.created": 1735870254982,
      "x.type.last_change": 1735870254982
    },
    {
      "x.type.name": "Type.mNuqb2M8Inq9xusA7Op1730272720662",
      "x.type.label": "TextSet",
      "x.type.metadata": "{\"color\":\"#cda2ec\"}",
      "x.type.attrs": null,
      "x.type.prototype": [
        "Type.izBeV3GPyvkKiiABmiR1730272690966"
      ],
      "x.type.created": 1735870255000,
      "x.type.last_change": 1735870255000
    },
    {
      "x.type.name": "Type.whu25A9VzIvlk1VICtn1730272735299",
      "x.type.label": "TextGroup",
      "x.type.metadata": "{\"color\":\"#8bb4fa\"}",
      "x.type.attrs": [
        {
          "name": "Title",
          "display": "标题",
          "type": "string",
          "default": null,
          "required": false
        },
        {
          "name": "PARA",
          "display": "内容",
          "type": "string",
          "default": null,
          "required": false
        }
      ],
      "x.type.prototype": [
        "Type.mNuqb2M8Inq9xusA7Op1730272720662"
      ],
      "x.type.created": 1735870255023,
      "x.type.last_change": 1735870255023
    },
    {
      "x.type.name": "Type.lr5PI78kFB45dembkOQ1730272699222",
      "x.type.label": "TextPara",
      "x.type.metadata": "{\"color\":\"#ae83b3\"}",
      "x.type.attrs": null,
      "x.type.prototype": [
        "Type.whu25A9VzIvlk1VICtn1730272735299"
      ],
      "x.type.created": 1735870255038,
      "x.type.last_change": 1735870255038
    },
    {
      "x.type.name": "Type.aQrKAeDe4ToR8lPsAd21730272606504",
      "x.type.label": "Graphic",
      "x.type.metadata": "{\"color\":\"#d4dfa1\"}",
      "x.type.attrs": [
        {
          "name": "Key",
          "display": "图形编号",
          "type": "string",
          "default": null,
          "required": false
        },
        {
          "name": "Title",
          "display": "标题",
          "type": "string",
          "default": null,
          "required": false
        }
      ],
      "x.type.prototype": [
        "Type.izBeV3GPyvkKiiABmiR1730272690966"
      ],
      "x.type.created": 1735870255053,
      "x.type.last_change": 1735870255053
    },
    {
      "x.type.name": "Type.Ov9n4bERTaIAjcbk8Ha1730272613256",
      "x.type.label": "Sheet",
      "x.type.metadata": "{\"color\":\"#c1d0c9\"}",
      "x.type.attrs": [
        {
          "name": "SheetNumber",
          "display": "图纸编号",
          "type": "string",
          "default": null,
          "required": false
        },
        {
          "name": "Title",
          "display": "标题",
          "type": "string",
          "default": null,
          "required": false
        }
      ],
      "x.type.prototype": [
        "Type.aQrKAeDe4ToR8lPsAd21730272606504"
      ],
      "x.type.created": 1735870255069,
      "x.type.last_change": 1735870255069
    },
    {
      "x.type.name": "Type.pio4QvFpgfLNbL1sTto1730272621312",
      "x.type.label": "TextSetItem",
      "x.type.metadata": "{\"color\":\"#b2ba96\"}",
      "x.type.attrs": null,
      "x.type.prototype": [],
      "x.type.created": 1735870255088,
      "x.type.last_change": 1735870255088
    }
  ])
  return axios.post(api['get'], { graphId: graphId ? Number(graphId) : 0 }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 类型的新增
export const addTypeByGraphId = (graphId, params, callback) => {
  return axios.post(api['add'], {
    graphId: graphId ? Number(graphId) : 0,
    set: params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
}

// 类型的删除
export const deleteTypeByGraphId = (graphId, type, callback) => {
  return axios.post(api['delete'], {
    graphId: graphId ? Number(graphId) : 0,
    type
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

// 类型的创建/更新
export const setTypeByGraphId = (graphId, params, callback) => {
  return axios.post(api['update'], {
    graphId: graphId ? Number(graphId) : 0,
    set: params
  }).then(({ data }) => {
    callback && callback(data.success, data.success ? data.data : data);
  }, (err) => {
    callback && callback(false, err);
  });
};

export const resetSchema = (graphId, callback) => {
  return axios.post("/pdb/api/v1/schema/reset", {
    graphId: graphId ? Number(graphId) : 0,
  }).then(({ data }) => {
    callback && callback(data.success);
  }, (err) => {
    callback && callback(false, err);
  });
};