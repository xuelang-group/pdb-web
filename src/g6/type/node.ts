import { getImagePath } from '@/actions/minioOperate';
import store from '@/store';
import { checkImgExists, defaultNodeColor, disabledNodeColor, getBorderColor, getIcon, getTextColor, iconColorMap } from '@/utils/common';
import { fittingString, GLOBAL_FONT_SIZE } from '@/utils/objectGraph';
import G6, { Item, UpdateType } from '@antv/g6';
import _ from 'lodash';

export const defaultCircleR = 60;

export const nodeStateStyle: any = {
  default: {
    r: defaultCircleR,
    lineWidth: 1.5,
    stroke: defaultNodeColor.border,
    fill: defaultNodeColor.fill,
    shadowBlur: 0,
    cursor: 'pointer'
  },
  sourceHightLight: {
    fill: '#E8FFEA',
    stroke: '#00B42A',
    lineWidth: 3
  },
  targetHightLight: {
    fill: '#E8FFEA',
    stroke: '#00B42A',
    lineWidth: 3
  }
}

export const outerCircleStyle: any = {
  default: {
    r: defaultCircleR + 5,
    fill: 'rgba(0, 132, 255, 0.2)',
    lineWidth: 0
  },
  selected: {
    stroke: '#0084FF',
    fill: 'rgba(0, 132, 255, 0.2)',
    lineWidth: 3,
    r: defaultCircleR + 7
  },
  sourceHightLight: {
    lineWidth: 0,
    fill: '#00B42A',
    r: defaultCircleR + 5
  }
}
export const iconImgWidth = 20;
export function registerNode() {
  G6.registerNode('circle-node', {
    afterDraw(cfg: any, group: any) {
      if (!group) return;

      if (cfg && cfg.data) {
        const icon = _.get(cfg, 'icon'),
          name = _.get(cfg.data, 'x.type.name', ''),
          { text, textWidth, hasEllipsis } = fittingString(name as string, defaultCircleR * 2 - 40, GLOBAL_FONT_SIZE),
          textShape = group.find((ele: any) => ele.get('name') === 'text-shape');
        if (icon) {
          let _textWidth = textWidth;
          if (hasEllipsis) _textWidth += 10;
          const userId = store.getState().app.systemInfo.userId;
          const textColor: string = _.get(textShape, 'attrs.fill', '#1C2126'),
            iconColor = iconColorMap[textColor],
            iconX = -_textWidth / 2 - 5;

          if (icon.indexOf('studio/' + userId + '/pdb/icons/') > -1) {
            const img = getImagePath(icon);
            checkImgExists(img, (exist: boolean, proportion = 0) => {
              if (exist) {
                const height = iconImgWidth / proportion;
                group.addShape('image', {
                  attrs: {
                    x: iconX - iconImgWidth / 2,
                    y: -height / 2,
                    width: iconImgWidth,
                    height,
                    img,
                    fill: 'transparent'
                  },
                  name: 'node-icon',
                });
                if (textShape) {
                  textShape.attr({ text, x: (defaultCircleR < _textWidth ? (_textWidth - defaultCircleR) / 2 : 10) });
                }
              }
            });
          } else {
            group.addShape('text', {
              attrs: {
                x: iconX,
                y: 8,
                fill: iconColor,
                fontFamily: 'iconfont',
                textAlign: 'center',
                text: getIcon(icon),
                fontSize: 18
              },
              name: 'node-icon'
            });
            if (textShape) {
              textShape.attr({ text, x: (defaultCircleR < _textWidth ? (_textWidth - defaultCircleR) / 2 : 10) });
            }
          }
        } else if (textShape) {
          textShape.attr({ text });
        }
      }
    },
    update: function (cfg: any, item: Item, updateType: UpdateType) {
      const group = item.getContainer(),
        textShape = group.find((ele: any) => ele.get('name') === 'text-shape'),
        nodeIcon = group.find((ele: any) => ele.get('name') === 'node-icon'),
        nodeShape = group.find((ele: any) => ele.get('name') === 'circle-node-keyShape');

      const { name } = cfg;
      const { text, textWidth, hasEllipsis } = fittingString(name as string, defaultCircleR * 2 - 40, GLOBAL_FONT_SIZE);
      let _textWidth = textWidth;
      if (hasEllipsis) _textWidth += 10;
      if (cfg && cfg.data) {
        const metadata = JSON.parse(cfg.data['x.type.metadata'] || '{}'),
          icon = _.get(cfg, 'icon'),
          fill = _.get(metadata, 'color', defaultNodeColor.fill),
          stroke = getBorderColor(_.get(metadata, 'borderColor'), fill),
          textColor = getTextColor(fill),
          iconColor = iconColorMap[textColor];
        if (icon) {
          let textX = 10, iconX = textX - _textWidth / 2 - 15;
          if (defaultCircleR < _textWidth) {
            textX = (_textWidth - defaultCircleR) / 2;
            iconX = textX - _textWidth / 2 - 15;
          } else if ((defaultCircleR - 20) < _textWidth) {
            textX = (defaultCircleR - _textWidth) / 2 + 10;
            iconX = textX - _textWidth / 2 - 20;
          }
          const prevIconType = nodeIcon ? nodeIcon.get('type') : '',
            userId = store.getState().app.systemInfo.userId,
            currentIconType = icon.indexOf('studio/' + userId + '/pdb/icons/') > -1 ? 'image' : 'text';

          if (nodeIcon && (prevIconType === currentIconType)) {
            if (currentIconType === 'text') {
              nodeIcon.attr({ x: iconX, text: getIcon(icon), fill: iconColor });
              textShape && textShape.attr({ text, x: textX, fill: textColor });
            } else {
              const img = getImagePath(icon);
              checkImgExists(img, (exist: boolean, proportion = 0) => {
                if (exist) {
                  const height = iconImgWidth / proportion;
                  nodeIcon.attr({
                    x: iconX - iconImgWidth / 2,
                    y: -height / 2,
                    width: iconImgWidth,
                    height,
                    img
                  });
                  textShape && textShape.attr({ text, x: textX, fill: textColor });
                }
              });
            }
          } else {
            nodeIcon && nodeIcon.remove();
            if (currentIconType === 'text') {
              group.addShape('text', {
                attrs: {
                  x: iconX,
                  y: 8,
                  fill: iconColor,
                  fontFamily: 'iconfont',
                  textAlign: 'center',
                  text: getIcon(icon),
                  fontSize: 18
                },
                name: 'node-icon'
              });
              textShape && textShape.attr({ text, x: textX, fill: textColor });
            } else {
              const img = getImagePath(icon);
              checkImgExists(img, (exist: boolean, proportion = 0) => {
                if (exist) {
                  const height = iconImgWidth / proportion;
                  group.addShape('image', {
                    attrs: {
                      x: iconX - iconImgWidth / 2,
                      y: -height / 2,
                      width: iconImgWidth,
                      height,
                      img
                    },
                    name: 'node-icon',
                  });
                  textShape && textShape.attr({ text, x: textX, fill: textColor });
                }
              });
            }
          }
        } else if (nodeIcon) {
          nodeIcon && nodeIcon.remove();
          textShape && textShape.attr({ text, x: 0, fill: textColor });
        } else {
          textShape && textShape.attr({ text });
        }

        nodeShape.attr({ fill, stroke });
      } else {
        textShape && textShape.attr({ text });
      }
    },
    // response the state changes and show/hide the link-point circles
    setState(name, value, item) {
      if (!item) return;
      const group = item.getContainer(),
        outerCircle = group.find(ele => ele.get('name') === 'outer-circle'),
        innerCircle = group.find(ele => ele.get('name') === 'circle-node-keyShape'),
        textShape = group.find(ele => ele.get('name') === 'text-shape'),
        nodeIcon = group.find(ele => ele.get('name') === 'node-icon'),
        itemModelData: any = _.get(item.getModel(), 'data', {}),
        metadata = JSON.parse(itemModelData['x.type.metadata'] || '{}'),
        fill = _.get(metadata, 'color', defaultNodeColor.fill),
        stroke = getBorderColor(_.get(metadata, 'borderColor'), fill),
        defaultNodeStyle = {
          ...nodeStateStyle.default,
          fill,
          stroke
        };

      let newFill = fill,
        textColor = getTextColor(newFill),
        iconColor = iconColorMap[textColor];


      if (name === 'selected') {
        if (value) {
          outerCircle.attr(outerCircleStyle['selected']);
          innerCircle.attr(defaultNodeStyle);
          outerCircle.show();
        } else {
          outerCircle.hide();
        }
      } else if (name === 'inactive') {
        if (value) {
          textColor = "#C2C7CC";
          iconColor = "#C2C7CC"
        }
        innerCircle.attr(value ? {
          fill: disabledNodeColor.fill,
          stroke: disabledNodeColor.border
        } : defaultNodeStyle);
      }

      textShape && textShape.attr({ fill: textColor });
      nodeIcon && nodeIcon.attr({ fill: nodeIcon.get('type') !== 'image' ? iconColor : 'transparent' });
    }
  }, 'circle');
}