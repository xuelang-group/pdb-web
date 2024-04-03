import _ from "lodash";
import moment from "moment";
import fonts from '@/assets/iconfont/pdb/iconfont.json';

export const myDirId = 2;

const map = '123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export function uuid(): string {
  let ranStr = ''
  for (let i = 0; i < 19; i++) {
    ranStr += map[Math.floor(Math.random() * (48 + 9))]
  }
  return ranStr + new Date().getTime()
}

/**
 * timestamp 格式化
 * @param  {Number}  timestamp
 * @return {String}  yyyy-MM-dd hh:mm:ss (mm is minutes, MM is months.)
 */
export function formatDate(timestamp: number): any {
  if (!timestamp) return '';
  try {
    const date = new Date(Number(timestamp));  // 参数需要毫秒数，所以这里将秒数乘于 1000
    const Y = date.getFullYear() + '-';
    const M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
    const D = date.getDate() + ' ';
    const h = date.getHours() + ':';
    const m = date.getMinutes() + ':';
    const s = date.getSeconds();
    return Y + M + D + h + m + s;
  } catch (err) {
    return timestamp;
  }
}

export const routeLabelMap: any = {
  template: "模板",
  object: "项目"
};

export const routeIconMap: any = {
  template: "spicon icon-mobanguanli-liebiaoicon",
  object: "spicon icon-xiangmuguanli-liebiaoicon"
};

export const operation = (route: string = '') => ({
  folder: {
    create: `新建${routeLabelMap[route]}`,
    createFolder: "新建文件夹",
    rename: "重命名",
    remove: "删除",
    move: "移动"
  },
  leaf: {
    rename: "重命名",
    remove: "删除",
    move: "移动"
  }
})

export const typeMap: any = {
  type: {
    int: '整数',
    float: '浮点数',
    string: '单行文本',
    text: '多行文本',
    boolean: '布尔值',
    datetime: '日期时间',
    list: '值列表',
    // refer: '关联属性'
  },
  object: {
    int: '整数',
    float: '浮点数',
    string: '单行文本',
    text: '多行文本',
    boolean: '布尔值',
    datetime: '日期时间',
    list: '值列表',
    // refer: '关联属性'
  },
  relation: {
    int: '整数',
    float: '浮点数',
    string: '单行文本',
    boolean: '布尔值',
    datetime: '日期时间',
  }
}

export const commonParams = {
  graphId: 0
}

/**
 * 使用test方法实现模糊查询
 * @param  {Array}  list     原数组
 * @param  {String} keyWord  查询的关键词
 * @param  {String} itemKey  数据key
 * @return {Array}           查询的结果
 */
export function fuzzyQuery(list: Array<any>, keyWord: string, itemKeys: Array<string>, isMetadata: boolean = false): Array<any> {
  var reg = new RegExp(keyWord);
  var arr = [];
  for (var i = 0; i < list.length; i++) {
    const item = list[i];
    for (let j = 0; j < itemKeys.length; j++) {
      const itemKey = itemKeys[j];
      if ((itemKey ? reg.test(isMetadata ? _.get(item['metadata'], itemKey) : _.get(item, itemKey)) : reg.test(list[i])) || item.uid && reg.test(item.uid)) {
        arr.push(list[i]);
        break;
      }
    }
  }
  return arr;
}

moment.locale('zh-cn');

export function getSavedMsg(status: string, timestamp: number) {
  const now = moment();
  let _time;
  switch (status) {
    case 'lastSaved':
      if (moment(timestamp).diff(now, 'days') < -30) {
        _time = moment(timestamp).format('YYYY-MM-DD')
      } else if (moment(timestamp).diff(now, 'hours') + now.hours() < 0) {
        _time = moment(timestamp).format('MM-DD')
      } else {
        _time = moment(timestamp).fromNow();
      }

      return `上次保存是在${_time}进行的`;
    case 'saved':
      _time = moment(timestamp).format('HH:mm');
      return `最近保存 ${_time}`;
    case 'success':
      return '保存成功';
    default:
      return '保存失败';
  }
};

// iconfont图标库，将unicode的转化封装成函数使用
const icons = fonts.glyphs.map((icon) => {
  return {
    name: icon.font_class,
    unicode: String.fromCodePoint(icon.unicode_decimal), // `\\u${icon.unicode}`,
  };
});
export const getIcon = (type: string) => {
  const matchIcon = icons.find((icon: any) => {
    return icon.name === type;
  }) || { unicode: '', name: 'default' };
  return matchIcon.unicode;
};

export const defaultNodeColor = {
  fill: '#E8F3FF',
  border: '#94BFFF'
};

export const disabledNodeColor = {
  fill: '#F4F6F9',
  border: '#EAECEF'
}

export const nodeColorList: any = {
  '#FFDCD9': '#F99C95',
  '#FFE6D8': '#FAA77D',
  '#FAEBD5': '#F2B161',
  '#FAF1C7': '#F2C53D',
  '#E7F1C0': '#A6CB47',
  '#DAF3DE': '#81C78D',
  '#D7F1EF': '#77C7C1',
  '#DAEFFF': '#85C0F2',
  '#E0E6FF': '#79A6F2',
  '#EFE3FA': '#BC95E5',
  '#F9E0F6': '#D888D2',
  '#FFDFFD': '#E58AB6',
  '#F24949': '#CB272D',
  '#F0693C': '#CC5120',
  '#F28200': '#D25F00',
  '#FACE1E': '#D9AE00',
  '#78B212': '#5F940A',
  '#11A834': '#008929',
  '#00B8B8': '#0C9499',
  '#3B90EB': '#206CCF',
  '#4F67E0': '#0E42D2',
  '#8C54D1': '#551DB0',
  '#CC47C7': '#AD10B2',
  '#E04F9F': '#C71D80'
}

export const iconColorMap: any = {
  '#1C2126': 'rgba(0, 0, 0, 0.5)',
  '#FFFFFF': 'rgba(255, 255, 255, 0.8)'
};

function rgbaToHex(color: string) {
  let hex: any = color;
  if (hex.startsWith('rgb(')) {
    hex = hex.replace('rgb(', '');
  } else {
    hex = hex.replace('rgba(', '');
  }
  hex = hex.replace(')', '').split(',');

  const r = Math.round(parseInt(hex[0])),
    g = Math.round(parseInt(hex[1])),
    b = Math.round(parseInt(hex[2])),
    a = Math.round(parseInt(hex[3] || '1') * 255);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1) + a.toString(16).toUpperCase().padStart(2, '0');
}

export const getTextColor = (textColor: string) => {
  let hex: any = textColor;
  if (hex.startsWith('rgb')) {
    hex = rgbaToHex(textColor)
  }

  if (hex.startsWith('#')) {
    hex = hex.substring(1);
  }

  if (hex.length === 3) {
    hex = [hex[0], hex[0], hex[1], hex[1], hex[2], hex[2]].join('');
  }

  hex = parseInt(hex, 16)

  const r = (hex >> 16) & 255,
    g = (hex >> 8) & 255,
    b = hex & 255;

  return (r * 0.299 + g * 0.587 + b * 0.114) > 155 ? '#1C2126' : '#FFFFFF';
}

export const getBorderColor = (borderColor?: string, fillColor?: string) => {
  if (borderColor) {
    return borderColor;
  }
  if (!fillColor) {
    return '';
  }
  if (fillColor === defaultNodeColor.fill) {
    return defaultNodeColor.border;
  } else {
    return _.get(nodeColorList, fillColor || '', 'rgba(0,0,0, 0.15)');
  }
}

export function checkImgExists(imgUrl: string, callback: Function) {
  const imgObj = new Image();
  imgObj.src = imgUrl;

  imgObj.onload = function () {
    callback(true, imgObj.width / imgObj.height);
  };
  imgObj.onerror = function () {
    callback(false);
  };
}

export const removeCatalog = (data: any, id: number) => {
  for (let i = 0; i < data.length; i++) {
    if (!_.isEmpty(data[i].children)) {
      const _index = _.findIndex(data[i].children, (n: any) => n.id == id);
      if (_index > -1) {
        // if (movedCatalog !== null && movedCatalog !== undefined) Object.assign(movedCatalog, _.cloneDeep(data[i].children[_index]));
        _.remove(data[i].children, (n: any) => n.id == id);
        break;
      } else if (!_.isEmpty(data[i].children)) {
        removeCatalog(data[i].children, id);
      }
    }
  }
};

export const moveCatalog = (data: any, id: number, movedCatalog: any) => {
  for (let i = 0; i < data.length; i++) {
    if (data[i].id == id) {
      data[i].children = data[i].children.concat(movedCatalog);
      break;
    } else if (!_.isEmpty(data[i].children)) {
      moveCatalog(data[i].children, id, movedCatalog);
    }
  }
};

export const getNewFolderId = function (catalog: any) {
  const configIds: any[] = [];
  const loop = function (data: any) {
    data.forEach((item: any) => {
      configIds.push(item.id);
      if (!_.isEmpty(item.children)) {
        loop(item.children);
      }
    });
  };
  loop(catalog);
  const max: number = _.max(configIds);
  return max + 1;
}

/**
 * 搜索条件
 */
export const optionLabelMap: any = {
  'eq': '等于',
  'le': '小于等于',
  'lt': '小于',
  'ge': '大于等于',
  'gt': '大于',
  'not eq': '不等于',
  'between': '在...之间',
  'has': '存在属性',
  'anyofterms': '任意包含',
  'allofterms': '所有包含'
};

export const optionSymbolMap: any = {
  'eq': '=',
  'le': '<=',
  'lt': '<',
  'ge': '>=',
  'gt': '>',
  'has': 'HAS',
  'not eq': '!=',
  'anyofterms': 'ANYOFTERMS',
  'allofterms': 'ALLOFTERMS',
  'between': 'BETWEEN',
};

export const commonOptionKeys = ['eq', 'le', 'lt', 'ge', 'gt', 'not eq', 'has'];
export const conditionOptionMap: any = {
  'text': ['anyofterms', 'allofterms', ...commonOptionKeys],
  'string': ['anyofterms', 'allofterms', ...commonOptionKeys],
  'int': commonOptionKeys,
  'float': commonOptionKeys,
  'bool': ['eq', 'has', 'not has'],
  'datetime': commonOptionKeys
}