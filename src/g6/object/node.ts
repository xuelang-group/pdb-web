import G6, { ModelConfig, IGroup, IG6GraphEvent, Item, UpdateType } from '@antv/g6';
import { ROOT_NODE_WIDTH, NODE_WIDTH, NODE_HEIGHT, GLOBAL_FONT_SIZE, fittingString, COLLAPSE_SHAPE_R } from '@/utils/objectGraph';
import store from '@/store';
import { checkImgExists, defaultNodeColor, disabledNodeColor, getBorderColor, getIcon, getTextColor, iconColorMap } from '@/utils/common';
import _ from 'lodash';
import { iconImgWidth } from '../type/node';
import { getImagePath } from '@/actions/minioOperate';
import { PAGE_SIZE } from './behavior';

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

export function registerNode() {
  /**
   * 注册节点的方法
   * @param {string} type 节点类型，外部引用指定必须，不要与已有布局类型重名
   * @param {object} node 节点方法
   */
  G6.registerNode('pdbNode', {
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
            y: -12
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

      if ((data as any)['x.version']) {
        const versionGroup = group.addGroup({
          name: 'version-group',
          visible: (data as any)['x.checkout']
        });
        versionGroup.addShape('circle', {
          attrs: {
            r: 12,
            x: width - 0.5,
            y: -0.5,
            cursor: 'pointer',
            fill: "#f9fbfc",
          },
          name: 'version-circle',
          draggable: false,
          modelId: id
        });
        versionGroup.addShape('circle', {
          attrs: {
            r: 10.5,
            x: width - 0.5,
            y: -0.5,
            cursor: 'pointer',
            fill: '#f9fbfc',
            stroke: "#C2C7CC",
            lineWidth: 1,
          },
          name: 'version-shape',
          draggable: false,
          modelId: id
        });
        versionGroup.addShape('text', {
          attrs: {
            x: width - 0.5,
            // y: 6,
            fill: "#4C5A67",
            fontFamily: 'iconfont',
            textAlign: 'center',
            textBaseline: 'middle',
            text: String.fromCodePoint(59376),
            fontSize: 12
          },
          name: 'version-icon'
        });
      }

      const searchGroup = group.addGroup({
        name: 'search-group',
        visible: false
      });
      searchGroup.addShape('marker', {
        attrs: {
          r: 10,
          x: width - 0.5,
          y: -0.5,
          cursor: 'pointer',
          symbol: function collapse(x: number, y: number, r: number) {
            return [['M', x - r, y], ['a', r, r, 0, 1, 0, r * 2, 0], ['a', r, r, 0, 1, 0, -r * 2, 0]];
          },
          fill: "#f9fbfc",
          stroke: "#f9fbfc",
          lineWidth: 2,
        },
        name: 'search-circle',
        draggable: false,
        modelId: id
      });
      searchGroup.addShape('marker', {
        attrs: {
          r: 10,
          x: width - 0.5,
          y: -0.5,
          cursor: 'pointer',
          symbol: function collapse(x: number, y: number, r: number) {
            return [['M', x - r, y], ['a', r, r, 0, 1, 0, r * 2, 0], ['a', r, r, 0, 1, 0, -r * 2, 0]];
          },
          fill: nodeColor,
          stroke: "#f9fbfc",
          lineWidth: 2,
        },
        name: 'search-shape',
        draggable: false,
        modelId: id
      });
      searchGroup.addShape('text', {
        attrs: {
          x: width - 0.5,
          y: 6,
          fill: textColor,
          fontFamily: 'iconfont',
          textAlign: 'center',
          text: String.fromCodePoint(58909),
          fontSize: 12
        },
        name: 'search-icon'
      });

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
          topRect.attr('fill', '#0084FF');
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
          leftRect.attr('fill', '#0084FF');
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
      const searchShape = group?.find(ele => ele.get('name') === 'search-shape'),
        searchIcon = group?.find(ele => ele.get('name') === 'search-icon');
      let leftRect = group?.find(ele => ele.get('name') === 'left-rect'),
        topRect = group?.find(child => child.get('name') === 'top-rect');

      const versionGroup = group.find(ele => ele.get('name') === 'version-group');
      if (versionGroup) {
        if ((data as any)['x.checkout']) {
          versionGroup.show();
        } else {
          versionGroup.hide();
        }
      }

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
      const width = isRootNode ? ROOT_NODE_WIDTH : (textWidth + 43);
      const textX = (width - textWidth + (iconName ? 20 : 0)) / 2,
        iconX = (width - textWidth - 25) / 2;

      // if (iconName && !isRootNode) width += 22;
      // 更新节点名称
      nodeRect.attr({ width, fill: nodeColor, stroke: nodeBorderColor });
      searchShape.attr({ fill: nodeColor });
      searchIcon.attr({ fill: textColor });
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

      if (isRootNode) {
        if (!leftRect) {
          const _leftRect = group.addShape('rect', {
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
          _leftRect.on('dragenter', () => {
            _leftRect.attr('fill', '#0084FF');
          });
          _leftRect.on('dragleave', () => {
            _leftRect.attr('fill', 'transparent');
          });

          _leftRect.on('drop', () => {
            _leftRect.attr('fill', 'transparent');
          });
        }
        if (topRect) topRect.remove();
      } else {
        if (!topRect) {
          const _topRect = group.addShape('rect', {
            attrs: {
              width,
              height: 10,
              fill: 'transparent',
              stroke: 'transparent',
              radius: 2,
              y: -12
            },
            name: 'top-rect'
          });

          _topRect.on('dragenter', () => {
            _topRect.attr('fill', '#0084FF');
          });
          _topRect.on('dragleave', () => {
            _topRect.attr('fill', 'transparent');
          });
          _topRect.on('drop', () => {
            _topRect.attr('fill', 'transparent');
          });
        }
        if (leftRect) leftRect.remove();
      }
    },
    setState(name, value, item) {
      if (!item) return;
      const outerCircle = item.getContainer().findAll(ele => ele.get('name') === 'outer-rect')[0];
      const currentSelected = item.hasState('selected');
      const outerNodeWidth = item.getOriginStyle()['node-rect'].width + 10;
      const searchGroup = item.getContainer().findAll(ele => ele.get('name') === 'search-group')[0];

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
      } else if (name === 'searchAround') {
        if (value) {
          searchGroup.show();
          searchGroup.attr({ visible: true })
        } else {
          searchGroup.hide();
        }
      }
    }
  },
    'rect',
  );

  G6.registerNode('paginationBtn', {
    afterDraw(cfg: any, group: any, rst) {
      const iconTextClassName = 'icon-text';
      const iconAttrs = { ...cfg.icon };
      if (cfg.nextDisabled) {
        Object.assign(iconAttrs, {
          fill: "#C2C7CC",
          cursor: "auto"
        });
      }
      const iconTextShape = group.addShape('text', {
        attrs: iconAttrs,
        name: iconTextClassName
      });
      group['shapeMap'][iconTextClassName] = iconTextShape;

      if (cfg.totalPage) {
        const totalTextClassName = 'total-text';
        const currentOffset = Number(cfg.id.split("-")[2]);
        const totalnTextShape = group.addShape('text', {
          attrs: {
            text: (currentOffset === 0 ? 1 : Math.floor(currentOffset / PAGE_SIZE())) + " / " + cfg.totalPage,
            fill: '#595959',
            x: 15,
            y: -2,
            fontSize: 10,
          },
          name: totalTextClassName
        });
        group['shapeMap'][totalTextClassName] = totalnTextShape;
      }
    },
    setState(name, value, item: any) {
      const iconText = item.getContainer().findAll((ele: any) => ele.get('name') === 'icon-text')[0];
      const { nextDisabled } = item.getModel();
      if (name === "active") {
        if (value && !nextDisabled) {
          iconText.attr({ fill: "#0084FF" });
        } else {
          iconText.attr({ fill: nextDisabled ? "#C2C7CC" : "#4C5A67" });
        }
      }
    },
    afterUpdate(cfg: any, item: any) {
      const iconText = item.getContainer().findAll((ele: any) => ele.get('name') === 'icon-text')[0];
      const { nextDisabled, totalPage } = cfg;
      iconText.attr({ fill: nextDisabled ? "#C2C7CC" : "#4C5A67" });
      if (totalPage) {
        const totalText = item.getContainer().findAll((ele: any) => ele.get('name') === 'total-text')[0];
        const currentOffset = Number(cfg.id.split("-")[2]);
        totalText.attr({ text: (currentOffset === 0 ? 1 : Math.floor(currentOffset / PAGE_SIZE())) + " / " + cfg.totalPage });
      }
    }
  }, 'rect');

  G6.registerNode('circle-node', {
    afterDraw(cfg: any, group: any) {
      if (!group) return;

      if (cfg && cfg.data) {
        const icon = _.get(cfg, 'icon'),
          name = _.get(cfg.data, 'x.type.label', ''),
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
          innerCircle.attr(outerCircleStyle['selected']);
        } else {
          innerCircle.attr(defaultNodeStyle);
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