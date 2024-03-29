import G6, { ModelConfig, IGroup, IG6GraphEvent, Item } from '@antv/g6';
import { ROOT_NODE_WIDTH, NODE_WIDTH, NODE_HEIGHT, GLOBAL_FONT_SIZE, fittingString, COLLAPSE_SHAPE_R } from '@/utils/objectGraph';
import store from '@/store';
import { checkImgExists, defaultNodeColor, disabledNodeColor, getBorderColor, getIcon, getTextColor, iconColorMap } from '@/utils/common';
import _ from 'lodash';
import { iconImgWidth } from '../type/node';
import { getImagePath } from '@/actions/minioOperate';

export function registerNode() {
  /**
   * 注册节点的方法
   * @param {string} type 节点类型，外部引用指定必须，不要与已有布局类型重名
   * @param {object} node 节点方法
   */
  G6.registerNode('pbdNode', {
    draw: function draw(cfg: ModelConfig, group: IGroup) {
      const rootId = store.getState().editor.rootNode?.uid;
      const userId = store.getState().app.systemInfo.userId;
      const { parent, name, id, data, childLen } = cfg;
      const isRootNode = parent === rootId;
      const metadata = JSON.parse((data as any)['x.metadata'] || '{}'),
        iconName: any = _.get(cfg, 'icon', '');
      let nodeColor = _.get(metadata, 'color', defaultNodeColor.fill),
        nodeBorderColor = getBorderColor(_.get(metadata, 'borderColor'), nodeColor),
        textColor = getTextColor(nodeColor),
        iconColor = iconColorMap[textColor];
      if ((cfg.isQueryNode && !cfg.target) || cfg.isDisabled) {
        nodeColor = disabledNodeColor.fill;
        nodeBorderColor = disabledNodeColor.border;
        textColor = '#DCDEE1';
        iconColor = '#DCDEE1';
      }
      let iconX = 0,
        textX = 0;
      const { text } = fittingString(name as string, isRootNode ? ROOT_NODE_WIDTH - 140 : NODE_WIDTH - 20, GLOBAL_FONT_SIZE);

      // 节点名称
      const textShape = group.addShape('text', {
        attrs: {
          text,
          fill: textColor,
          cursor: 'pointer',
          fontSize: isRootNode ? 16 : 14,
          fontWeight: isRootNode ? 500 : 400,
          x: 0,
          y: 32,
        },
        name: 'node-text',
        draggable: true
      });
      const textWidth = textShape.getBBox().width,
        width = isRootNode ? ROOT_NODE_WIDTH : (textWidth + 43);
      textX = (width - textWidth + (iconName ? 20 : 0)) / 2;
      iconX = (width - textWidth - 25) / 2;
      group.addShape('rect', {
        attrs: {
          width: width + 10,
          height: NODE_HEIGHT + 10,
          fill: 'rgba(0, 132, 255, 0.2)',
          stroke: '#0084FF',
          radius: 8,
          lineWidth: 0,
          x: -5,
          y: -5
        },
        visible: false,
        name: 'outer-rect'
      });
      const keyShape = group.addShape('rect', {
        attrs: {
          width,
          height: NODE_HEIGHT,
          fill: nodeColor,
          stroke: nodeBorderColor,
          radius: 4,
          cursor: 'pointer',
        },
        name: 'node-rect'
      });

      // 节点上方块区域，用于响应拖拽
      if (!isRootNode) {
        group.addShape('rect', {
          attrs: {
            width,
            height: 10,
            fill: 'transparent',
            stroke: 'transparent',
            radius: 2,
            y: -10
          },
          name: 'top-rect'
        });
      } else {
        group.addShape('rect', {
          attrs: {
            width: 40,
            height: NODE_HEIGHT,
            fill: 'transparent',
            stroke: 'transparent',
            radius: 2,
            x: -40
          },
          name: 'left-rect'
        });
      }

      // 节点图标
      if (iconName) {
        if (iconName.indexOf('studio/' + userId + '/pdb/icons/') > -1) {
          const img = getImagePath(iconName);
          checkImgExists(img, (exist: boolean, proportion = 0) => {
            if (exist) {
              const height = iconImgWidth / proportion < 30 ? (iconImgWidth / proportion) : 30;
              group.addShape('image', {
                attrs: {
                  x: iconX,
                  y: 32 - height + (height - 16) / 2,
                  width: iconImgWidth,
                  height,
                  img
                },
                name: 'node-icon',
              });
            }
          });
        } else {
          group.addShape('text', {
            attrs: {
              x: iconX,
              y: 32,
              fill: iconColor,
              fontFamily: 'iconfont',
              // textAlign: 'center',
              text: getIcon(iconName),
              fontSize: 18
            },
            name: 'node-icon'
          });
        }
      }

      if (Number(childLen) > 0) {
        group.addShape('marker', {
          attrs: {
            r: 8,
            x: 15,
            y: NODE_HEIGHT,
            cursor: 'pointer',
            symbol: function collapse(x: number, y: number, r: number) {
              return [['M', x - r, y], ['a', r, r, 0, 1, 0, r * 2, 0], ['a', r, r, 0, 1, 0, -r * 2, 0]];
            },
            fill: '#F9FBFC',
            stroke: '#DCDEE1',
            lineWidth: 1,
          },
          name: 'collapse-shape',
          draggable: false,
          modelId: id
        });
        group.addShape('marker', {
          attrs: {
            r: 8,
            x: 15,
            y: NODE_HEIGHT,
            symbol: function collapse(x: number, y: number, r: number) {
              if ((data as any).collapsed === undefined || (data as any).collapsed) {
                return [['M', x - r + 4.5, y], ['L', x - r + 2 * r - 4.5, y], ['M', x - r + r, y - r + 4.5], ['L', x, y + r - 4.5]]
              }
              return [['M', x - r + 4.5, y], ['L', x + r - 4.5, y]];
            },
            cursor: 'pointer',
            stroke: '#828D99',
          },
          name: 'collapse-text',
          draggable: false,
          modelId: id
        });
      }

      cfg.width = width;
      textShape.toFront();
      textShape.attr({ x: textX });
      return keyShape;
    },
    afterDraw(cfg: ModelConfig | undefined, group: IGroup | undefined) {
      // dragenter时样式
      const topRect = group?.find(child => child.get('name') === 'top-rect'),
        nodeRect = group?.find(child => child.get('name') === 'node-rect'),
        leftRect = group?.find(child => child.get('name') === 'left-rect');
      if (topRect) {
        topRect.on('dragenter', () => {
          topRect.attr('fill', '#E8F3FF');
        });
        topRect.on('dragleave', () => {
          topRect.attr('fill', 'transparent');
        });

        topRect.on('drop', () => {
          topRect.attr('fill', 'transparent');
        });
      }

      if (leftRect) {
        leftRect.on('dragenter', () => {
          leftRect.attr('fill', '#E8F3FF');
        });
        leftRect.on('dragleave', () => {
          leftRect.attr('fill', 'transparent');
        });

        leftRect.on('drop', () => {
          leftRect.attr('fill', 'transparent');
        });
      }

      if (nodeRect) {
        nodeRect.on('dragenter', (event: IG6GraphEvent) => {
          group?.cfg.item.setState('active', true)
        });
        nodeRect.on('dragleave', () => {
          group?.cfg.item.clearStates(['active']);
        });
      }
    },
    update: function (cfg: ModelConfig, item: Item) {
      const { name, data, id, parent, childLen } = cfg;
      const group = item.getContainer();
      const rootId = store.getState().editor.rootNode?.uid;
      const userId = store.getState().app.systemInfo.userId;
      const nodeText = group.find(ele => ele.get('name') === 'node-text'),
        nodeIcon = group.find(ele => ele.get('name') === 'node-icon'),
        nodeRect = group?.find(ele => ele.get('name') === 'node-rect');
      let leftRect = group?.find(ele => ele.get('name') === 'left-rect');

      if (parent === rootId && !leftRect) {
        leftRect = group.addShape('rect', {
          attrs: {
            width: 40,
            height: NODE_HEIGHT,
            fill: 'transparent',
            stroke: 'transparent',
            radius: 2,
            x: -40
          },
          name: 'left-rect'
        });
        leftRect.on('dragenter', () => {
          leftRect.attr('fill', '#E8F3FF');
        });
        leftRect.on('dragleave', () => {
          leftRect.attr('fill', 'transparent');
        });

        leftRect.on('drop', () => {
          leftRect.attr('fill', 'transparent');
        });
      }

      const metadata = JSON.parse((data as any)['x.metadata'] || '{}'),
        iconName: any = _.get(cfg, 'icon', '');
      let nodeColor = _.get(metadata, 'color', defaultNodeColor.fill),
        nodeBorderColor = getBorderColor(_.get(metadata, 'borderColor'), nodeColor),
        textColor = getTextColor(nodeColor),
        iconColor = iconColorMap[textColor];

      if ((cfg.isQueryNode && !cfg.target) || cfg.isDisabled) { // 搜索返回的节点，但不是目标节点，灰化显示
        nodeColor = disabledNodeColor.fill;
        nodeBorderColor = disabledNodeColor.border;
        textColor = '#DCDEE1';
        iconColor = '#DCDEE1';
      }

      const isRootNode = parent === rootId;
      const { text } = fittingString(name as string, (isRootNode ? (ROOT_NODE_WIDTH - 140) : (NODE_WIDTH - 20)), GLOBAL_FONT_SIZE);
      nodeText.attr({ text });

      const textWidth = nodeText.getBBox().width;
      let width = isRootNode ? ROOT_NODE_WIDTH : (textWidth + 43);
      const textX = (width - textWidth + (iconName ? 20 : 0)) / 2,
        iconX = (width - textWidth - 25) / 2;

      // if (iconName && !isRootNode) width += 22;
      // 更新节点名称
      nodeRect.attr({ width, fill: nodeColor, stroke: nodeBorderColor });
      cfg.width = width;

      const prevIconType = nodeIcon ? nodeIcon.get('type') : '', currentIconType = iconName.indexOf('studio/' + userId + '/pdb/icons/') > -1 ? 'image' : 'text';
      if (iconName) {
        if (nodeIcon && (prevIconType === currentIconType)) {
          if (currentIconType === 'text') {
            nodeIcon.attr({ x: iconX, text: getIcon(iconName), fill: iconColor });
          } else {
            nodeIcon.attr({ x: iconX, img: getImagePath(iconName) });
          }
        } else {
          nodeIcon && nodeIcon.remove();
          if (currentIconType === 'text') {
            group.addShape('text', {
              attrs: {
                x: iconX,
                y: 32,
                fill: iconColor,
                fontFamily: 'iconfont',
                text: getIcon(iconName),
                fontSize: 18
              },
              name: 'node-icon'
            });
          } else {
            const img = getImagePath(iconName);
            checkImgExists(img, (exist: boolean, proportion = 0) => {
              if (exist) {
                const height = iconImgWidth / proportion < 30 ? (iconImgWidth / proportion) : 30;
                group.addShape('image', {
                  attrs: {
                    x: iconX,
                    y: 32 - height,
                    width: iconImgWidth,
                    height,
                    img
                  },
                  name: 'node-icon',
                });
              }
            });
          }
        }
      } else if (nodeIcon) {
        nodeIcon.remove();
      }
      nodeText.attr({ x: textX, fill: textColor });

      const collapseText = group.find(ele => ele.get('name') === 'collapse-text' && ele.get('modelId') === id),
        collapseShape = group.find(ele => ele.get('name') === 'collapse-shape' && ele.get('modelId') === id);
      if (Number(childLen) > 0) {
        if (collapseShape) {
          collapseText.attr({
            opacity: 1,
            symbol: function collapse(x: number, y: number, r: number) {
              if ((data as any).collapsed === undefined || (data as any).collapsed) {
                return [['M', x - r + 4.5, y], ['L', x - r + 2 * r - 4.5, y], ['M', x - r + r, y - r + 4.5], ['L', x, y + r - 4.5]]
              }
              return [['M', x - r + 4.5, y], ['L', x + r - 4.5, y]];
            },
          });
          collapseShape.attr({ opacity: 1 });
        } else {
          group.addShape('marker', {
            attrs: {
              r: 8,
              x: 15,
              y: NODE_HEIGHT,
              cursor: 'pointer',
              symbol: function collapse(x: number, y: number, r: number) {
                return [['M', x - r, y], ['a', r, r, 0, 1, 0, r * 2, 0], ['a', r, r, 0, 1, 0, -r * 2, 0]];
              },
              fill: '#F9FBFC',
              stroke: '#DCDEE1',
              lineWidth: 1,
            },
            name: 'collapse-shape',
            draggable: false,
            modelId: id
          });
          group.addShape('marker', {
            attrs: {
              r: 8,
              x: 15,
              y: NODE_HEIGHT,
              symbol: function collapse(x: number, y: number, r: number) {
                if ((data as any).collapsed === undefined || (data as any).collapsed) {
                  return [['M', x - r + 4.5, y], ['L', x - r + 2 * r - 4.5, y], ['M', x - r + r, y - r + 4.5], ['L', x, y + r - 4.5]]
                }
                return [['M', x - r + 4.5, y], ['L', x + r - 4.5, y]];
              },
              cursor: 'pointer',
              stroke: '#828D99',
            },
            name: 'collapse-text',
            draggable: false,
            modelId: id
          });
        }
      } else if (collapseShape) {
        collapseShape.attr({ opacity: 0 });
        collapseText.attr({
          opacity: 0,
          symbol: function collapse(x: number, y: number, r: number) {
            return [['M', x - r + 4.5, y], ['L', x - r + 2 * r - 4.5, y], ['M', x - r + r, y - r + 4.5], ['L', x, y + r - 4.5]]
          }
        });
      }
      const { currentEditModel } = store.getState().editor;
      if (currentEditModel && currentEditModel.id === id) {
        item.setState('selected', true);
      }
    },
    setState(name, value, item) {
      if (!item) return;
      const outerCircle = item.getContainer().findAll(ele => ele.get('name') === 'outer-rect')[0];
      const currentSelected = item.hasState('selected');
      const outerNodeWidth = item.getOriginStyle()['node-rect'].width + 10;
      if (!outerCircle) return;
      if (name === 'active') {
        if (currentSelected) return;
        outerCircle.attr({ width: outerNodeWidth });
        if (value) {
          outerCircle.show();
        } else {
          outerCircle.hide();
        }
      } else if (name === 'selected') {
        if (value) {
          outerCircle.attr({ lineWidth: 2, width: outerNodeWidth });
          outerCircle.show();
        } else {
          outerCircle.attr({ lineWidth: 0, width: outerNodeWidth });
          outerCircle.hide();
        }
      }
    }
  },
    'rect',
  );
}