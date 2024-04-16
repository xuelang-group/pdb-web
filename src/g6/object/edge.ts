import G6, { EdgeConfig } from '@antv/g6';
import { COLLAPSE_SHAPE_R, LINE_SYTLE, NODE_HEIGHT } from '../../utils/objectGraph';

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
      } else if (sourceModel['xid'].split(".").length === 2) {
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
  // 同棵树间连线或根节点间连线，边类型为自定义“same-tree-relation-line”
  G6.registerEdge('same-tree-relation-line', {
    getPath(points: any) {
      return getPathWithBorderRadiusByPolyline(getPoint(this.mergeStyle), 5);
    },
    afterDraw(cfg: any, group: any) {
      const textShape = group.find((ele: any) => ele.get('name') === 'text-shape'),
        textBgShape = group.find((ele: any) => ele.get('name') === 'text-bg-shape'),
        textBgWidth = textBgShape.getBBox().width,
        textBgHeight = textBgShape.getBBox().height;
      const { source, target } = cfg;
      if (source === target && textShape) {
        const points = getPoint(cfg),
          x = (points[2].x - points[1].x) / 2 + points[1].x,
          y = points[1].y;
        textShape.attr({ x, y });
        textBgShape.attr({ x: x - textBgWidth / 2, y: y - textBgHeight / 2 });
      }
    },
    afterUpdate(cfg: any, item: any) {
      const group = item.get('group');
      const textShape = group.find((ele: any) => ele.get('name') === 'text-shape'),
        textBgShape = group.find((ele: any) => ele.get('name') === 'text-bg-shape'),
        textBgWidth = textBgShape.getBBox().width,
        textBgHeight = textBgShape.getBBox().height;
      const { source, target } = cfg;
      if (source === target && textShape) {
        const points = getPoint(cfg),
          x = (points[2].x - points[1].x) / 2 + points[1].x,
          y = points[1].y;
        textShape.attr({ x, y });
        textBgShape.attr({ x: x - textBgWidth / 2, y: y - textBgHeight / 2 });
      }
    }
  }, 'line');
}

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
