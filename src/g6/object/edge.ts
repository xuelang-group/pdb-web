import G6, { EdgeConfig } from '@antv/g6';
import _ from 'lodash';
import { COLLAPSE_SHAPE_R, LINE_SYTLE, NODE_HEIGHT, ROOT_NODE_WIDTH } from '../../utils/objectGraph';

export const defaultEdgeStyle = {
  stroke: '#F77234',
  lineWidth: 2,
  type: 'cubic-horizontal',
  endArrow: {
    path: G6.Arrow.triangle(),
    fill: '#F77234',
    stroke: '#F77234',
  }
}

export function registerEdge() {
  /**
   * 注册连线的方法
   * @param {string} type 连线类型，外部引用指定必须，不要与已有布局类型重名
   * @param {object} node 连线方法
   */
  G6.registerEdge('step-line', {
    draw(cfg: EdgeConfig, group) {
      const startPoint = cfg.sourceNode?.getBBox(),
        endPoint = cfg.targetNode?.getBBox();
      const { stroke } = LINE_SYTLE['default'];
      const targetModel = cfg.targetNode?.get('model'),
        sourceModel = cfg.sourceNode?.get('model');
      const lineWidth = cfg.isComboEdge ? 0 : 1;

      // 折线
      let startPoinX = Number(startPoint?.x) + 15;
      if (sourceModel.parent === targetModel.parent) {
        startPoinX = Number(startPoint?.x) - 15;
      }

      let startPointY = Number(startPoint?.y) + NODE_HEIGHT / 2 - 3;
      if (targetModel['xid'] && targetModel['xid'] === (sourceModel['xid'] + '.0')) {
        startPointY = Number(startPoint?.y) + NODE_HEIGHT + COLLAPSE_SHAPE_R;
      } else if (sourceModel['xid'] && sourceModel['xid'].split(".").length === 2) {
        startPointY = Number(startPoint?.y) + NODE_HEIGHT;
      }
      const shape: any = group.addShape('path', {
        attrs: {
          stroke,
          lineWidth,
          path: getPathWithBorderRadiusByPolyline([
            { x: startPoinX, y: startPointY },
            { x: startPoinX, y: Number(endPoint?.y) + NODE_HEIGHT / 2 },
            { x: Number(endPoint?.x), y: Number(endPoint?.y) + NODE_HEIGHT / 2 },
          ], 3),
        },
        name: 'path-shape',
      });
      return shape;
    }
  });

  // 直线
  G6.registerEdge('straight-line', {
    draw(cfg: EdgeConfig, group) {
      const startPoint = cfg.startPoint,
        endPoint = cfg.endPoint;
      const { stroke } = LINE_SYTLE['default'];
      const lineWidth = cfg.isComboEdge ? 0 : 1;
      const shape = group.addShape('path', {
        attrs: {
          stroke,
          lineWidth,
          path: [
            ['M', startPoint?.x, startPoint?.y],
            ['L', endPoint?.x, endPoint?.y],
          ],
        },
        name: 'path-shape',
      });
      return shape;
    }
  });


  // 同树 - 左侧三折线
  G6.registerEdge('left-three-line', {
    draw(cfg: EdgeConfig, group) {
      const startPoint = cfg.startPoint,
        endPoint = cfg.endPoint;
      const { stroke } = LINE_SYTLE['default'];
      const lineWidth = cfg.isComboEdge ? 0 : 1;
      // 折线
      let startPoinX = Number(startPoint?.x),
        endPointX = Number(endPoint?.x);

      const shape = group.addShape('path', {
        attrs: {
          stroke,
          lineWidth,
          path: [
            ['M', startPoinX, startPoint?.y],
            ['L', startPoinX - 25, startPoint?.y],
            ['L', endPointX - 25, endPoint?.y],
            ['L', endPoint?.x, endPoint?.y],
          ],
        },
        name: 'path-shape',
      });
      return shape;
    }
  });

  function getPoint(cfg: any) {
    const { id, sourceIsRoot, targetIsRoot, targetWidth, sourceWidth, source, target, startPoint, endPoint } = cfg;
    const offset = 16;
    if (source === target) {
      let newStartX = startPoint.x + 15,
        newEndX = endPoint.x + sourceWidth - 15,
        newStartY = startPoint.y - 23,
        newEndY = endPoint.y - 23;
      const middleY = changeLineY(newStartY - offset, id, newStartX, newEndX, true);
      return [
        { x: newStartX, y: newStartY },
        { x: newStartX, y: middleY },
        { x: newEndX, y: middleY },
        { x: newEndX, y: newEndY }
      ];
    }
    if (sourceIsRoot && targetIsRoot) {
      if (startPoint.x < endPoint.x) {
        let newStartX = startPoint.x - sourceWidth + 15,
          newEndX = endPoint.x + 15,
          newStartY = startPoint.y - 23,
          newEndY = endPoint.y - 23;
        const middleY = changeLineY(newStartY - offset, id, newStartX, newEndX);
        return [
          { x: newStartX, y: newStartY },
          { x: newStartX, y: middleY },
          { x: newEndX, y: middleY },
          { x: newEndX, y: newEndY }
        ];
      }
      let newStartX = startPoint.x + 15,
        newEndX = endPoint.x - targetWidth + 15,
        newStartY = startPoint.y - 23,
        newEndY = endPoint.y - 23;
      const middleY = changeLineY(newStartY - offset, id, newStartX, newEndX);
      return [
        { x: newStartX, y: newStartY },
        { x: newStartX, y: middleY },
        { x: newEndX, y: middleY },
        { x: newEndX, y: newEndY }
      ];
    }
    if (startPoint.y < endPoint.y) {
      const newStartX = startPoint.x + sourceWidth,
        newEndX = endPoint.x + targetWidth;
      const offsetStartX = newStartX + offset,
        offsetEndX = newEndX + offset;

      let middleX = newStartX < newEndX ? offsetEndX : offsetStartX;
      middleX = changeLineX(middleX, id, startPoint.y, endPoint.y - 5);
      return [
        { x: newStartX, y: startPoint.y },
        { x: middleX, y: startPoint.y },
        { x: middleX, y: endPoint.y - 5 },
        { x: newEndX, y: endPoint.y - 5 }
      ];
    } else {
      const offsetStartX = startPoint.x - offset,
        offsetEndX = endPoint.x - offset;
      let middleX = startPoint.x < endPoint.x ? offsetStartX : offsetEndX;

      middleX = changeLineX(middleX, id, startPoint.y, endPoint.y + 5);
      return [
        startPoint,
        { x: middleX, y: startPoint.y },
        { x: middleX, y: endPoint.y + 5 },
        { x: endPoint.x, y: endPoint.y + 5 }
      ];
    }
  }

  G6.registerEdge('tree-relation-line', {
    getPath(points: any) {
      const startPoint = points[0], endPoint = points[1];
      //曲线的起点终点
      let startX = startPoint.x + 5;
      let startY = startPoint.y;
      let endX = endPoint.x - 8;
      let endY = endPoint.y;

      if (startY === endY) {
        return [
          ['M', startPoint.x, startPoint.y],
          ['L', endPoint.x, endPoint.y],
        ];
      }

      if (startPoint.x > endPoint.x) {
        startX = startPoint.x - 5;
        startY = startPoint.y;
        endX = endPoint.x + 8;
        endY = endPoint.y;
      }

      // 曲线控制点坐标
      let cp1X = startX;
      let cp1Y = startY + (endY - startY) / 2;
      let cp2X = endX;
      let cp2Y = endY - (endY - startY) / 2;

      if (startY < endY) {
        cp1X = (startX + endX) / 2;
        cp1Y = startY;
        cp2X = (startX + endX) / 2;
        cp2Y = endY;
      } else {
        cp1X = startX + (endX - startX) / 2;
        cp1Y = startY;
        cp2X = endX - (endX - startX) / 2;
        cp2Y = endY;
      }

      return [
        ['M', startPoint.x, startY],
        ['L', startX, startY],
        ['C', cp1X, cp1Y, cp2X, cp2Y, endX, endY],
        ['L', endPoint.x, endY],
      ];
    }
  }, 'single-line');

  // 同棵树间连线或根节点间连线，边类型为自定义“same-tree-relation-line”
  G6.registerEdge('same-tree-relation-line', {
    curveOffset: 20,
    clockwise: 1,
    getPath(points: any) {
      const path = [];
      const { sourceWidth, targetWidth } = this.mergeStyle;

      const startPoint: any = { ...points[0] },
        endPoint: any = { ...points[1] };
      if (startPoint.y < endPoint.y) {
        startPoint.x = startPoint.x + (sourceWidth || 0);
        endPoint.x = endPoint.x + (targetWidth || 0);
      }

      let endX = endPoint.x + 8;
      if (startPoint.y > endPoint.y) {
        endX = endPoint.x - 8;
      }

      path.push(['M', startPoint.x, startPoint.y]);
      var midPoint = {
        x: (startPoint.x + endX) / 2,
        y: (startPoint.y + endPoint.y) / 2
      };
      var center;
      var arcPoint;
      this.curveOffset = Math.min(Math.abs(startPoint.y - endPoint.y) * 0.1, 100);

      var vec = {
        x: endX - startPoint.x,
        y: endPoint.y - startPoint.y
      };
      var edgeAngle = Math.atan2(vec.y, vec.x);
      arcPoint = {
        x: this.curveOffset * Math.cos(-Math.PI / 2 + edgeAngle) + midPoint.x,
        y: this.curveOffset * Math.sin(-Math.PI / 2 + edgeAngle) + midPoint.y
      };
      center = getCircleCenterByPoints(startPoint, arcPoint, endPoint);
      var radius = _distance(startPoint, center);
      var controlPoint = {
        x: radius,
        y: radius
      };

      path.push(['A', controlPoint.x, controlPoint.y, 0, 0, this.clockwise, endX, endPoint.y]);
      path.push(['L', endPoint.x, endPoint.y]);
      return path;
    },
  }, 'single-line');

  G6.registerEdge('same-root-relation-line', {
    curveOffset: 20,
    clockwise: 1,
    getPath(points: any) {
      const path = [];

      const startPoint: any = { ...points[0] },
        endPoint: any = { ...points[1] };
      startPoint.x = startPoint.x - ROOT_NODE_WIDTH  + 15;
      endPoint.x = endPoint.x + 15;

      startPoint.y = startPoint.y - NODE_HEIGHT / 2;
      endPoint.y = endPoint.y - NODE_HEIGHT / 2;

      this.curveOffset = Math.min(Math.abs(startPoint.y - endPoint.y) * 0.1, 100);
      this.clockwise = 1;
      if (points[0].x > points[1].x) {
        endPoint.x = points[1].x - ROOT_NODE_WIDTH  + 15;
        startPoint.x = points[0].x + 15;

        startPoint.y = points[0].y - NODE_HEIGHT / 2;
        endPoint.y = points[1].y - NODE_HEIGHT / 2;

        this.curveOffset = Math.min(Math.abs(startPoint.x - endPoint.x) * 0.1, 100);
        this.clockwise = 0;
      }


      let endY = endPoint.y - 9;

      path.push(['M', startPoint.x, startPoint.y]);
      var midPoint = {
        x: (startPoint.x + endPoint.x) / 2,
        y: (startPoint.y + endPoint.y) / 2
      };
      var center;
      var arcPoint;
      this.curveOffset = 20;

      var vec = {
        x: endPoint.x - startPoint.x,
        y: endPoint.y - startPoint.y
      };
      var edgeAngle = Math.atan2(vec.y, vec.x);
      arcPoint = {
        x: this.curveOffset * Math.cos(-Math.PI / 2 + edgeAngle) + midPoint.x,
        y: this.curveOffset * Math.sin(-Math.PI / 2 + edgeAngle) + midPoint.y
      };
      center = getCircleCenterByPoints(startPoint, arcPoint, endPoint);
      var radius = _distance(startPoint, center);
      var controlPoint = {
        x: radius,
        y: radius
      };

      path.push(['A', controlPoint.x, controlPoint.y, 0, 0, this.clockwise, endPoint.x, endY]);
      path.push(['L', endPoint.x, endPoint.y]);
      return path;
    },
  }, 'single-line');

  const _matrixUtil = require("@antv/matrix-util");
  const PI = Math.PI, transform = _matrixUtil.ext.transform, CLS_LABEL_SUFFIX = '-label';
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
}

/**
 *
 * @param p1 First coordinate
 * @param p2 second coordinate
 * @param p2 three coordinate
 */
function getCircleCenterByPoints(p1: { x: number; y: number; }, p2: { x: number; y: number; }, p3: { x: number; y: number; }) {
  const a = p1.x - p2.x;
  const b = p1.y - p2.y;
  const c = p1.x - p3.x;
  const d = p1.y - p3.y;
  const e = (p1.x * p1.x - p2.x * p2.x - p2.y * p2.y + p1.y * p1.y) / 2;
  const f = (p1.x * p1.x - p3.x * p3.x - p3.y * p3.y + p1.y * p1.y) / 2;
  const denominator = b * c - a * d;
  return {
    x: -(d * e - b * f) / denominator,
    y: -(a * f - c * e) / denominator
  };
};

/**
 * get distance by two points
 * @param p1 first point
 * @param p2 second point
 */
function _distance(p1: PolyPoint, p2: PolyPoint) {
  var vx = p1.x - p2.x;
  var vy = p1.y - p2.y;
  return Math.sqrt(vx * vx + vy * vy);
};

// 检查线条重叠
function checkLineCollision(line1: any, line2: any) {
  // 检查线段1的两个端点是否都在线段2的一侧
  const s1 = ((line2.y2 - line2.y1) * (line1.x1 - line2.x1) - (line2.x2 - line2.x1) * (line1.y1 - line2.y1));
  const s2 = ((line2.y2 - line2.y1) * (line1.x2 - line2.x1) - (line2.x2 - line2.x1) * (line1.y2 - line2.y1));

  // 检查线段2的两个端点是否都在线段1的一侧
  const s3 = ((line1.y2 - line1.y1) * (line2.x1 - line1.x1) - (line1.x2 - line1.x1) * (line2.y1 - line1.y1));
  const s4 = ((line1.y2 - line1.y1) * (line2.x2 - line1.x1) - (line1.x2 - line1.x1) * (line2.y2 - line1.y1));

  // 如果两条线段的端点都在对方的一侧，它们重叠
  return (s1 * s2 <= 0) && (s3 * s4 <= 0);
}

export let xaxisMap: any = {};
export let lineXaxisMap: any = {};

export function updateXaxisMap(value: any) {
  xaxisMap = { ...value };
}

export function updateLineXaxisMap(value: any) {
  lineXaxisMap = { ...value };
}

function changeLineX(sameX: number, id: string, startPointY: any, endPointY: any) {
  let currentSameX = sameX;
  if (xaxisMap[currentSameX]) {
    for (let i = 0; i < Object.keys(xaxisMap[sameX]).length; i++) {
      let _id = Object.keys(xaxisMap[sameX])[i];
      if (_id !== id) {
        const isLineCollision = checkLineCollision(
          { x1: sameX, y1: startPointY, x2: sameX, y2: endPointY },
          { x1: sameX, y1: xaxisMap[sameX][_id][0], x2: sameX, y2: xaxisMap[sameX][_id][1] },
        );
        if (isLineCollision) {
          currentSameX = changeLineX(sameX + 12, id, startPointY, endPointY);
          break;
        }
      }
    }
    if (xaxisMap[currentSameX]) {
      Object.assign(xaxisMap[currentSameX], {
        [id]: [startPointY, endPointY]
      });
    } else {
      Object.assign(xaxisMap, {
        [currentSameX]: {
          [id]: [startPointY, endPointY]
        }
      });
    }
  } else {
    Object.assign(xaxisMap, {
      [currentSameX]: {
        [id]: [startPointY, endPointY]
      }
    });
  }
  Object.assign(lineXaxisMap, {
    [id]: currentSameX
  });
  return currentSameX;
}

export let yaxisMap: any = {};
function changeLineY(sameY: number, id: string, startPointX: any, endPointX: any, isSelfEdge = false) {
  let currentSameY = sameY;
  if (yaxisMap[currentSameY]) {
    for (let i = 0; i < Object.keys(yaxisMap[sameY]).length; i++) {
      let _id = Object.keys(yaxisMap[sameY])[i];
      if (_id !== id) {
        const isLineCollision = checkLineCollision(
          { y1: sameY, x1: startPointX, y2: sameY, x2: endPointX },
          { y1: sameY, x1: yaxisMap[sameY][_id][0], y2: sameY, x2: yaxisMap[sameY][_id][1] },
        );
        if (isLineCollision) {
          currentSameY = changeLineY(sameY - 12, id, startPointX, endPointX);
          break;
        }
      }
    }
    if (!isSelfEdge) {
      if (yaxisMap[currentSameY]) {
        Object.assign(yaxisMap[currentSameY], {
          [id]: [startPointX, endPointX]
        });
      } else {
        Object.assign(yaxisMap, {
          [currentSameY]: {
            [id]: [startPointX, endPointX]
          }
        });
      }
    }
  } else if (!isSelfEdge) {
    Object.assign(yaxisMap, {
      [currentSameY]: {
        [id]: [startPointX, endPointX]
      }
    });
  }
  return currentSameY;
}

export const isBending = (p0: PolyPoint, p1: PolyPoint, p2: PolyPoint): boolean =>
  !((p0.x === p1.x && p1.x === p2.x) || (p0.y === p1.y && p1.y === p2.y));

export const getPathWithBorderRadiusByPolyline = (
  points: PolyPoint[],
  borderRadius: number,
): string => {
  const pathSegments: any = [];
  const startPoint = points[0];
  pathSegments.push(['M', startPoint.x, startPoint.y]);
  points.forEach((p, i) => {
    const p1 = points[i + 1];
    const p2 = points[i + 2];
    if (p1 && p2) {
      if (isBending(p, p1, p2)) {
        const [ps, pt] = getBorderRadiusPoints(p, p1, p2, borderRadius);
        pathSegments.push(['L', ps.x, ps.y]);
        pathSegments.push(['Q', p1.x, p1.y, pt.x, pt.y]);
        pathSegments.push(['L', pt.x, pt.y]);
      } else {
        pathSegments.push(['L', p1.x, p1.y]);
      }
    } else if (p1) {
      pathSegments.push(['L', p1.x, p1.y]);
    }
  });
  return pathSegments;
};

export const getBorderRadiusPoints = (
  p0: PolyPoint,
  p1: PolyPoint,
  p2: PolyPoint,
  r: number,
): PolyPoint[] => {
  const d0 = distance(p0, p1);
  const d1 = distance(p2, p1);
  if (d0 < r) {
    r = d0;
  }
  if (d1 < r) {
    r = d1;
  }
  const ps = {
    x: p1.x - (r / d0) * (p1.x - p0.x),
    y: p1.y - (r / d0) * (p1.y - p0.y),
  };
  const pt = {
    x: p1.x - (r / d1) * (p1.x - p2.x),
    y: p1.y - (r / d1) * (p1.y - p2.y),
  };
  return [ps, pt];
};

export const distance = (p1: PolyPoint, p2: PolyPoint): number =>
  Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);

export interface PolyPoint {
  x: number;
  y: number;
  id?: string;
}
