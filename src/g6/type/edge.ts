import G6 from '@antv/g6';
import _ from 'lodash';
import { defaultCircleR } from './node';
const _matrixUtil = require("@antv/matrix-util");
const transform = _matrixUtil.ext.transform;
const CLS_SHAPE_SUFFIX = '-shape';
const CLS_LABEL_SUFFIX = '-label';
const CLS_LABEL_BG_SUFFIX = '-label-bg';
var PI = Math.PI,
  sin = Math.sin,
  cos = Math.cos;
export const edgeStyle: any = {
  default: {
    stroke: '#F77234',
    lineWidth: 1.5,
    startArrow: {
      path: G6.Arrow.triangle(0, 0, defaultCircleR + 2),
      d: defaultCircleR + 2
    },
    endArrow: {
      path: G6.Arrow.triangle(5, 5, defaultCircleR + 2),
      d: defaultCircleR + 2,
      fill: '#F77234'
    },
    cursor: 'pointer'
  },
  hover: {
    stroke: '#2EA1FF',
    lineWidth: 3,
    startArrow: {
      path: G6.Arrow.triangle(0, 0, defaultCircleR + 3),
      d: defaultCircleR + 3
    },
    endArrow: {
      path: G6.Arrow.triangle(5, 5, defaultCircleR + 3),
      d: defaultCircleR + 3,
      fill: '#2EA1FF'
    },
  },
  selected: {
    stroke: '#0084FF',
    endArrow: {
      path: G6.Arrow.triangle(5, 5, defaultCircleR + 3),
      d: defaultCircleR + 3,
      fill: '#0084FF'
    },
  }
}

export const labelThemeStyle: any = {
  light: {
    fill: '#1C2126',
    background: '#F9FBFC'
  },
  dark: {
    fill: '#DEDFE0',
    background: '#262829'
  }
}

export const edgeLabelStyle: any = (theme: string = 'light') => ({
  default: {
    fill: labelThemeStyle[theme].fill,
    fontSize: 14,
    background: {
      fill: labelThemeStyle[theme].background,
      padding: [0, 4, 0, 4],
    },
    cursor: 'pointer'
  },
  hover: {
    fill: '#2EA1FF'
  },
  selected: {
    fill: '#0084FF'
  }
})

export function registerEdge() {
  G6.registerEdge('connect-line', {
    labelAutoRotate: true,
    curvePosition: 0.5,
    curveOffset: -20,
    getLabelRotate: function getLabelRotate(pathShape: any, percent: any) {
      const TAN_OFFSET = 0.0001;
      let vector = [];
      const point = pathShape.getPoint(percent);
      // 头尾最可能，放在最前面，使用 g path 上封装的方法
      if (percent < TAN_OFFSET) {
        vector = pathShape.getStartTangent().reverse();
      } else if (percent > 1 - TAN_OFFSET) {
        vector = pathShape.getEndTangent();
      } else {
        // 否则取指定位置的点,与少量偏移的点，做微分向量
        const offsetPoint = pathShape.getPoint(percent + TAN_OFFSET);
        vector.push([point.x, point.y]);
        vector.push([offsetPoint.x, offsetPoint.y]);
      }
      let rad = Math.atan2(vector[1][1] - vector[0][1], vector[1][0] - vector[0][0]);
      if (rad < 0) {
        rad += PI * 2;
      }
      if (rad > 0.5 * PI && rad < 1.5 * PI) {
        rad -= PI;
      }
      return rad;
    },
    afterDraw: function afterDraw(cfg: any, group: any) {
      cfg.controlPoints = undefined;
      const controlPoint = (this as any).getControlPoints(cfg);
      const endPoint = cfg.endPoint, startPoint = cfg.startPoint;
      const sControlPoint = controlPoint.length > 0 ? controlPoint[0] : endPoint;
      const startM = (sControlPoint.y - startPoint.y) / (sControlPoint.x - startPoint.x);
      const startTotalLen = Math.sqrt((sControlPoint.x - startPoint.x) * (sControlPoint.x - startPoint.x) + (sControlPoint.y - startPoint.y) * (sControlPoint.y - startPoint.y))
      const _startPointX = (50 * (sControlPoint.x - startPoint.x)) / startTotalLen + startPoint.x,
        _startPointY = (50 * (sControlPoint.y - startPoint.y)) / startTotalLen + startPoint.y;
      let sLabelX = _startPointX,
        sLabelY = _startPointY - 2;
      if (startM > 0) {
        sLabelX = _startPointX;
        sLabelY = _startPointY - 5;
      }
      const startLabelClassName = 'start-' + this.itemType + CLS_LABEL_SUFFIX;
      const sLabel = cfg.srcCardinality === Infinity || cfg.srcCardinality === null ? '*' : cfg.srcCardinality;
      const startTextShape = group.addShape('text', {
        attrs: {
          text: sLabel,
          fill: '#595959',
          textAlign: 'start',
          textBaseline: 'middle',
          x: sLabelX,
          y: sLabelY
        },
        name: startLabelClassName
      });
      group['shapeMap'][startLabelClassName] = startTextShape;

      const eControlPoint = controlPoint.length > 0 ? controlPoint[0] : startPoint;
      const canvas = document.createElement("canvas");
      const context: any = canvas.getContext("2d");
      const endLabelClassName = 'end-' + this.itemType + CLS_LABEL_SUFFIX;
      const eLabel = cfg.tgtCardinality === Infinity || cfg.tgtCardinality === null ? '*' : cfg.tgtCardinality;
      const metrics = context.measureText(eLabel);
      const endM = (endPoint.y - eControlPoint.y) / (endPoint.x - eControlPoint.x);
      const endTotalLen = Math.sqrt((endPoint.x - eControlPoint.x) * (endPoint.x - eControlPoint.x) + (endPoint.y - eControlPoint.y) * (endPoint.y - eControlPoint.y))
      const _endPointX = ((50 + metrics.width) * (eControlPoint.x - endPoint.x)) / endTotalLen + endPoint.x,
        _endPointY = ((50 + metrics.width) * (eControlPoint.y - endPoint.y)) / endTotalLen + endPoint.y;
      let eLabelX = _endPointX - 5,
        eLabelY = _endPointY - 2;
      if (endM > 0) {
        eLabelX = _endPointX;
        eLabelY = _endPointY - 5;
      }
      
      const endTextShape = group.addShape('text', {
        attrs: {
          text: eLabel,
          fill: '#595959',
          textAlign: 'start',
          textBaseline: 'middle',
          x: eLabelX,
          y: eLabelY
        },
        name: endLabelClassName
      });
      group['shapeMap'][endLabelClassName] = endTextShape;
    },
    afterUpdate: function afterUpdate(cfg: any, item: any) {
      cfg.controlPoints = undefined;
      if (!item) return;
      const labelClassName = this.itemType + CLS_LABEL_SUFFIX;
      const startLabelClassName = 'start-' + labelClassName;
      const group = item.get('group');
      if (group) {
        const startLabel = group['shapeMap'][startLabelClassName] || group.find(function (ele: any) {
          return ele.get('className') === startLabelClassName;
        });

        const calculateStyle = (this as any).getLabelStyleByPosition(cfg, cfg.labelCfg, group);
        // 取 nodeLabel，edgeLabel 的配置项
        let _a;
        const cfgStyle = (_a = cfg.labelCfg) === null || _a === void 0 ? void 0 : _a.style;
        // 需要融合当前 label 的样式 label.attr()。不再需要全局/默认样式，因为已经应用在当前的 label 上
        const labelStyle = Object.assign(Object.assign({}, calculateStyle), { ...cfgStyle });
        const rotate = labelStyle.rotate;
        delete labelStyle.rotate;

        const rotateMatrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];
        const endPoint = cfg.endPoint, startPoint = cfg.startPoint;
        const controlPoint = (this as any).getControlPoints(cfg);
        if (startLabel) {
          const sControlPoint = controlPoint.length > 0 ? controlPoint[0] : endPoint;
          const startM = (sControlPoint.y - startPoint.y) / (sControlPoint.x - startPoint.x);
          const startTotalLen = Math.sqrt((sControlPoint.x - startPoint.x) * (sControlPoint.x - startPoint.x) + (sControlPoint.y - startPoint.y) * (sControlPoint.y - startPoint.y))
          const sLabel = cfg.srcCardinality === Infinity || cfg.srcCardinality === null ? '*' : cfg.srcCardinality;
          const _left = sLabel === '*' ? 35 : 50;

          const _startPointX = (_left * (sControlPoint.x - startPoint.x)) / startTotalLen + startPoint.x,
            _startPointY = (_left * (sControlPoint.y - startPoint.y)) / startTotalLen + startPoint.y;
          let sLabelX = _startPointX,
            sLabelY = _startPointY - 2;
          if (startM > 0) {
            sLabelX = _startPointX;
            sLabelY = _startPointY - 5;
          }

          startLabel.attr({
            text: sLabel,
            x: sLabelX,
            y: sLabelY,
            matrix: transform(rotateMatrix, [['t', -sLabelX, -sLabelY], ['r', rotate], ['t', sLabelX, sLabelY]])
          });
        }

        const endLabelClassName = 'end-' + labelClassName;
        const endLabel = group['shapeMap'][endLabelClassName] || group.find(function (ele: any) {
          return ele.get('className') === endLabelClassName;
        });
        if (endLabel) {
          const eControlPoint = controlPoint.length > 0 ? controlPoint[0] : startPoint;
          const endM = (endPoint.y - eControlPoint.y) / (endPoint.x - eControlPoint.x);
          const endTotalLen = Math.sqrt((endPoint.x - eControlPoint.x) * (endPoint.x - eControlPoint.x) + (endPoint.y - eControlPoint.y) * (endPoint.y - eControlPoint.y))
          const canvas = document.createElement("canvas");
          const context: any = canvas.getContext("2d");
          const eLabel = cfg.tgtCardinality === Infinity || cfg.tgtCardinality === null ? '*' : cfg.tgtCardinality;
          const metrics = context.measureText(eLabel);
          const _endPointX = ((50 + metrics.width) * (eControlPoint.x - endPoint.x)) / endTotalLen + endPoint.x,
            _endPointY = ((50 + metrics.width) * (eControlPoint.y - endPoint.y)) / endTotalLen + endPoint.y;
          let labelX = _endPointX,
            labelY = _endPointY;
          
          if (endM > 0) {
            labelX = _endPointX;
            labelY = _endPointY;
          }
          endLabel.attr({
            text: eLabel,
            x: labelX,
            y: labelY,
            matrix: transform(rotateMatrix, [['t', -_endPointX, -_endPointY], ['r', rotate], ['t', _endPointX, _endPointY]])
          });
        }
      }
    }
  }, 'quadratic');

  G6.registerEdge('connect-loop', {
    afterDraw: function afterDraw(cfg: any, group: any) {
      console.log(cfg)
      const fill = _.get(cfg, 'labelCfg.style.fill', '1C2126')
      cfg.controlPoints = undefined;
      const endPoint = cfg.endPoint, startPoint = cfg.startPoint;
      const startLabelClassName = 'start-' + this.itemType + CLS_LABEL_SUFFIX;
      const startTextShape = group.addShape('text', {
        attrs: {
          text: '1',
          fill,
          textAlign: 'start',
          textBaseline: 'middle',
          x: startPoint.x - 10,
          y: startPoint.y - 2
        },
        name: startLabelClassName
      });
      group['shapeMap'][startLabelClassName] = startTextShape;

      const endLabelClassName = 'end-' + this.itemType + CLS_LABEL_SUFFIX;
      const endTextShape = group.addShape('text', {
        attrs: {
          text: cfg.tgtCardinality === Infinity || cfg.tgtCardinality === null ? '*' : cfg.tgtCardinality,
          fill,
          textAlign: 'start',
          textBaseline: 'middle',
          x: endPoint.x + 10,
          y: endPoint.y
        },
        name: endLabelClassName
      });
      group['shapeMap'][endLabelClassName] = endTextShape;
    },
    afterUpdate: function afterUpdate(cfg: any, item: any) {
      cfg.controlPoints = undefined;

      if (!item) return;
      const labelClassName = this.itemType + CLS_LABEL_SUFFIX;
      const startLabelClassName = 'start-' + labelClassName;
      const group = item.get('group');
      if (group) {
        const startLabel = group['shapeMap'][startLabelClassName] || group.find(function (ele: any) {
          return ele.get('className') === startLabelClassName;
        });
        const endPoint = cfg.endPoint, startPoint = cfg.startPoint;
        startLabel && startLabel.attr({
          x: startPoint.x - 10,
          y: startPoint.y - 2
        });

        const endLabelClassName = 'end-' + labelClassName;
        const endLabel = group['shapeMap'][endLabelClassName] || group.find(function (ele: any) {
          return ele.get('className') === endLabelClassName;
        });
        endLabel && endLabel.attr({
          text: cfg.tgtCardinality === Infinity || cfg.tgtCardinality === null ? '*' : cfg.tgtCardinality,
          x: endPoint.x + 8,
          y: endPoint.y + 3
        });
      }
    }
  }, 'loop');
}