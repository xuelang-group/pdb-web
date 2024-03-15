import { Button, Collapse, Empty, Form, Popover, Select, Switch, Tooltip } from "antd";
import { labelThemeStyle } from "@/g6/type/edge";
import G6, { Item } from "@antv/g6";
import _ from "lodash";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { ObjectRelationConig, RelationsConfig, setToolbarConfig } from "@/reducers/editor";
import { ConnectionState } from "@/reducers/template";
import { StoreState } from "@/store";

const { Panel } = Collapse;
const getRelationLabelCfg = (labelColor: string, showLabel: boolean, theme: string) => ({
  autoRotate: true,
  style: {
    fill: labelColor,
    fontSize: 10,
    background: {
      fill: showLabel ? labelThemeStyle[theme].background : 'transparent',
      padding: [2, 2, 2, 2],
    }
  }
});

interface GraphToolbarProps {
  theme: string
}

export default function GraphToolbar(props: GraphToolbarProps) {
  const dispatch = useDispatch();
  const rootId = useSelector((state: StoreState) => state.editor.rootNode?.uid),   // root节点uid
    allObjects = useSelector((state: StoreState) => state.object.data),  // 所有节点数据
    relationMap = useSelector((state: StoreState) => state.editor.relationMap),  // 所有的关系列表 {'r.type.name': xxxx},根据关系唯一键能够快速获取关系详细数据
    toolbarConfig = useSelector((state: StoreState) => state.editor.toolbarConfig),
    currentGraphTab = useSelector((state: StoreState) => state.editor.currentGraphTab);

  const [relationLines, setRelationLines] = useState<RelationsConfig>({}),   // 画布中所有关系边 {[uid]: [{ target: {uid, x.name}, relation }]}
    [showRelationLine, setShowRelationLine] = useState(false),  // 画布工具栏 - 画布是否展示关系边 
    [showRelationLabel, setShowRelationLable] = useState(false),   // 画布工具栏 - 边是否展示关系名称
    [selectedTab, setSelectedTab] = useState({} as any),  // 画布工具栏 - 当前选中项
    [relationList, setRelationList] = useState([] as any), // 画布工具栏 - 支持的关系类型列表
    [typeList, setTypeList] = useState([] as any), // 画布工具栏 - 支持的对象类型列表
    [filterMap, setFilterMap] = useState({ type: {}, relation: {} });  // 画布工具栏 - 视图过滤数据 {'relation': {[r.type.name]: ...}, 'type': {[x.type.name]: ...}}

  const [filterForm] = Form.useForm();

  const tabs = [{
    key: 'setting',
    label: '全局设置',
    icon: 'icon-shezhi'
  }, {
    key: 'filter',
    label: '视图过滤',
    icon: 'icon-shaixuan'
  }];

  useEffect(() => {
    filterForm.resetFields();
    if (!toolbarConfig[currentGraphTab]) return;
    const { relationLines, showRelationLabel, showRelationLine, filters } = toolbarConfig[currentGraphTab];
    setRelationLines(relationLines);
    setShowRelationLable(showRelationLabel);
    setShowRelationLine(showRelationLine);
    filterForm.setFieldValue('filter', filters);
  }, [currentGraphTab]);

  useEffect(() => {
    if (!toolbarConfig[currentGraphTab]) return;
    const _relationLines = toolbarConfig[currentGraphTab].relationLines;
    if (JSON.stringify(relationLines) !== JSON.stringify(_relationLines)) {
      setRelationLines(_relationLines);
    }
  }, [toolbarConfig])

  useEffect(() => {
    if (!(window as any).PDB_GRAPH) return;
    const graph = (window as any).PDB_GRAPH;
    const nodeLen = graph.getNodes().length,
      edgeLen = graph.getEdges().length;
    let currentMode = 'default';
    if ((nodeLen + edgeLen) > 1000) {
      currentMode = 'maxData';
    }
    if (currentMode !== graph.getCurrentMode()) {
      graph.setMode(currentMode);
    }
    showRelationLine ? showRelationLines() : hideRelationLines();
  }, [allObjects]);

  useEffect(() => {
    if (showRelationLine) showRelationLines();
  }, [relationLines]);

  // 显示关系边
  const showRelationLines = function () {
    const graph = (window as any).PDB_GRAPH;
    if (!graph) return;
    let addEdge = false;
    Object.keys(relationLines).forEach((objectUid: string) => {
      const relations = relationLines[objectUid];
      relations && relations.forEach((item: ObjectRelationConig) => {
        const { relation, target } = item;
        if (!relation || !target) return;
        const edgeKey = `${objectUid}-${target.uid}`;
        const edgeId = `${edgeKey}-${relation}`;
        let edgeItem = graph.findById(edgeId);
        const sourceItem = graph.findById(objectUid),
          targetItem = graph.findById(target.uid);
        if (!sourceItem || !targetItem) return;
        const sourceIsVisible = sourceItem.isVisible(),
          targetIsVisible = targetItem.isVisible();
        if (!sourceIsVisible || !targetIsVisible) return;
        if (edgeItem) {
          // 当前边已存在且隐藏，则显示出来
          !edgeItem.isVisible() && edgeItem.show();
        } else if (targetItem && sourceItem) {
          // 当前边不存在，sourc和target节点存在，则创建该边
          const sourceItemModel = sourceItem.get('model');
          const targetItemModel = targetItem.get('model');
          let lineColor = '#F77234', labelColor = labelThemeStyle[props.theme].fill; // 亮化颜色
          if (!_.isEmpty(filterMap.relation) && !_.get(filterMap.relation, relation)) {
            // 有过滤配置，且不在过滤项里的，灰化处理
            lineColor = '#EAECEF';
            labelColor = '#DCDEE1';
          }

          // 默认边类型
          let edgeType = 'quadratic';
          const sourceIsRoot = sourceItemModel.parent === rootId,
            targetIsRoot = targetItemModel.parent === rootId,
            sourceWidth = sourceItemModel.width,
            targetWidth = targetItemModel.width;
          // 同棵树间连线或根节点间连线，边类型为自定义“same-tree-relation-line”
          if ((targetItemModel.xid.split('.')[1] === sourceItemModel.xid.split('.')[1]) || (sourceIsRoot && targetIsRoot)) {
            edgeType = 'same-tree-relation-line';
          }
          const edgeOption = {
            id: edgeId,
            source: objectUid,
            target: target.uid,
            relationName: relation,
            type: edgeType,
            sourceIsRoot,
            sourceWidth,
            targetIsRoot,
            targetWidth,
            style: {
              stroke: lineColor,
              lineWidth: 1.5,
              endArrow: {
                path: G6.Arrow.triangle(5, 5, 1),
                fill: lineColor,
                stroke: lineColor,
              },
              cursor: 'pointer'
            },
            stateStyles: {
              'active': {
                lineWidth: 2.5,
                stroke: '#2EA1FF',
                endArrow: {
                  path: G6.Arrow.triangle(5, 5, 1),
                  fill: '#2EA1FF',
                  stroke: '#2EA1FF',
                },
              }
            },
            labelCfg: getRelationLabelCfg(labelColor, showRelationLabel, props.theme)
          };
          if (showRelationLabel && relationMap[relation]) Object.assign(edgeOption, { label: relationMap[relation]['r.type.label'] });
          edgeItem = graph.addItem('edge', edgeOption);
          addEdge = true;
        }

        if (edgeItem && (_.isEmpty(filterMap.relation) || _.get(filterMap.relation, relation))) {
          edgeItem.toFront();
        }
      });
    });

    if (!addEdge) return;

    const edges: any = graph.save().edges.filter((val: any) => val.type !== 'step-line' && val.type !== 'same-tree-relation-line');
    // 节点节点之间存在多条quadratic类型边, 处理平行边
    G6.Util.processParallelEdges(edges, 15);
    edges.forEach((edge: any, i: number) => {
      graph.updateItem(edge.id, {
        curveOffset: edges[i].curveOffset,
        curvePosition: edges[i].curvePosition,
      });
    });
  }

  // 隐藏关系连线
  const hideRelationLines = function () {
    const graph = (window as any).PDB_GRAPH;
    if (!graph) return;
    graph.findAll('edge', function (edge: Item) {
      if (edge.isVisible() && edge.get('model').type !== 'step-line') {
        edge.hide();
        return true;
      }
      return false;
    });
  }

  // 显示/隐藏关系边
  const handleShowRelationLine = function (checked: boolean) {
    setShowRelationLine(checked);
    dispatch(setToolbarConfig({
      key: currentGraphTab,
      config: {
        showRelationLine: checked
      }
    }));
    checked ? showRelationLines() : hideRelationLines();
  }

  // 显示/隐藏关系边名称
  const handleShowRelationName = function (checked: boolean) {
    const graph = (window as any).PDB_GRAPH;
    if (!graph) return;
    graph.findAll('edge', function (edge: Item) {
      const edgeModel = edge.get('model');
      if (edgeModel.type !== 'step-line') {
        let labelColor = labelThemeStyle[props.theme].fill;
        if (!_.isEmpty(filterMap.relation) && !_.get(filterMap.relation, edgeModel.relationName)) {
          labelColor = '#DCDEE1';
        }
        graph.updateItem(edge, {
          label: checked && relationMap[edgeModel.relationName] ? relationMap[edgeModel.relationName]['r.type.label'] : '',
          labelCfg: getRelationLabelCfg(labelColor, checked, props.theme)
        });
        return true;
      }
      return false;
    });
    setShowRelationLable(checked);
    dispatch(setToolbarConfig({
      key: currentGraphTab,
      config: {
        showRelationLabel: checked
      }
    }));
  }

  const filters = Form.useWatch('filter', filterForm);
  // 监听过滤条件
  useEffect(() => {
    if (!filters) return;
    const filterMap: any = {
      relation: {},
      type: {}
    }
    filters.forEach((item: any) => {
      const { typeName, target } = item;
      Object.assign(filterMap[target], { [typeName]: item });
    });
    setFilterMap(filterMap);
    filterForm.validateFields().then(() => {
      const graph = (window as any).PDB_GRAPH;
      if (!graph) return;
      graph.findAll('edge', function (edge: Item) {
        const edgeModel = edge.get('model');
        if (edgeModel.type === 'step-line') return;
        let lineColor = '#F77234', labelColor = labelThemeStyle[props.theme].fill; // 高亮
        if (!_.isEmpty(filterMap.relation) && !_.get(filterMap.relation, edgeModel.relationName)) {
          // 灰色
          lineColor = '#EAECEF';
          labelColor = '#DCDEE1';
        }
        graph.updateItem(edge, {
          style: {
            stroke: lineColor,
            endArrow: {
              path: G6.Arrow.triangle(5, 5, 1),
              fill: lineColor,
              stroke: lineColor,
            },
          },
          labelCfg: getRelationLabelCfg(labelColor, showRelationLabel, props.theme)
        });
        if (!_.isEmpty(filterMap.relation) && _.get(filterMap.relation, edgeModel.relationName)) {
          edge.toFront();
        }
        return false;
      });

      const shouldSelectedNodes: Item[] = [];
      graph.findAll('node', function (node: Item) {
        const nodeModel = node.get('model'),
          nodeModelData = _.get(nodeModel, 'data'),
          isDisabled = !_.isEmpty(filterMap.type) && !_.get(filterMap.type, nodeModelData['x.type.name'] || '');
        graph.updateItem(node, { isDisabled });
        if (!isDisabled && !_.isEmpty(filterMap.type)) shouldSelectedNodes.push(node);
        node.setState('selected', !isDisabled && !_.isEmpty(filterMap.type));
      });
      if (shouldSelectedNodes.length > 0) {
        const graph = (window as any).PDB_GRAPH;
        graph.emit('nodeselectchange', {
          selectedItems: {
            nodes: shouldSelectedNodes,
            edges: [],
            combos: [],
          },
          select: true,
        });
      }
    }).catch(err => { });

    dispatch(setToolbarConfig({
      key: currentGraphTab,
      config: { filters, filterMap }
    }));
  }, [filters]);

  const renderFilterPanel = function () {
    return (
      <div className="pdb-graph-toolbar-panel-container">
        <Form form={filterForm} autoComplete="off">
          <Form.List name="filter">
            {(fields, { add, remove }) => (
              <>
                <Form.Item style={{ marginBottom: '1.6rem' }}>
                  <Button className='btn-default add-filter-btn' type="primary" onClick={() => add({ target: 'relation' })} block>
                    <i className="spicon icon-plus"></i>
                    添加过滤条件
                  </Button>
                </Form.Item>
                {fields && fields.length > 0 ?
                  fields.map((field, index) => (
                    <div key={field.key}>
                      <Collapse className="filter-item" collapsible="header" defaultActiveKey={[index]}
                        expandIcon={panelProps => (<i className={`spicon ${panelProps.isActive ? 'icon-kuhei-jiantou-xia-zhihui' : 'icon-jiantou-you'}`}></i>)}>
                        <Panel
                          key={index}
                          header={"过滤条件" + (index + 1)}
                          extra={<i className="operation-icon spicon icon-shanchu2" onClick={() => remove(field.name)}></i>}
                          style={{ marginBottom: '1.6rem' }}
                        >
                          <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, curValues) =>
                              prevValues.area !== curValues.area || prevValues.sights !== curValues.sights
                            }
                          >
                            {({ getFieldValue, setFieldValue }) => (
                              <Form.Item
                                {...field}
                                label="目标"
                                name={[field.name, 'target']}
                                rules={[{ required: true }]}
                              >
                                <Select onChange={() => setFieldValue(['filter', field.name, 'typeName'], '')}>
                                  <Select.Option value="relation">关系类型</Select.Option>
                                  <Select.Option value="type">对象类型</Select.Option>
                                </Select>
                              </Form.Item>
                            )}
                          </Form.Item>
                          <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, curValues) => _.get(prevValues[field.name], 'target') !== _.get(curValues[field.name], 'target')}
                          >
                            {({ getFieldValue }) => {
                              const target = getFieldValue(['filter', field.name, 'target']);
                              return (
                                <Form.Item
                                  {...field}
                                  label="类型"
                                  name={[field.name, 'typeName']}
                                  rules={[{ required: true, message: '请选择类型' }]}
                                >
                                  <Select
                                    showSearch
                                    filterOption={(input, option) =>
                                    ((option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase()) ||
                                      (option?.value ?? '').toString() === input)
                                    }
                                  >
                                    {target === 'relation' && relationList.map((info: any) => (
                                      <Select.Option value={info['r.type.name']} disabled={_.get(filterMap.relation, info['r.type.name'])}>{info.metadata['r.type.label']}</Select.Option>
                                    ))}
                                    {target === 'type' && typeList.map((info: any) => (
                                      <Select.Option value={info['type']} disabled={_.get(filterMap.type, info['type'])}>{info.metadata['x.type.label']}</Select.Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                              )
                            }}
                          </Form.Item>
                        </Panel>
                      </Collapse>
                    </div>
                  )) :
                  <Empty image={require('@/assets/images/search_empty.png')} />
                }
              </>
            )}
          </Form.List>
        </Form>
      </div>
    )
  }

  const renderSettingPanel = function () {
    return (
      <div className="pdb-graph-toolbar-setting">
        <div className="pdb-setting-header">全局设置</div>
        <div className="pdb-setting-item">
          <span>展示关系连线：</span>
          <Switch checked={showRelationLine} onChange={handleShowRelationLine} size="small" />
        </div>
        {showRelationLine &&
          <div className="pdb-setting-item">
            <span>展示关系名称：</span>
            <Switch checked={showRelationLabel} onChange={handleShowRelationName} size="small" />
          </div>
        }
      </div>
    )
  }
  return (
    <>
      <div className='pdb-graph-toolbar'>
        {tabs.map((tab) => (
          <Popover
            visible={tab.key === _.get(selectedTab, 'key', '')}
            placement="right"
            trigger="click"
            content={
              _.get(tab, 'key', '') === 'setting' ?
                renderSettingPanel() :
                renderFilterPanel()
            }
            title={_.get(tab, 'key', '') === 'filter' ? (
              <>
                <span>视图过滤</span>
                <i className="operation-icon spicon icon-guanbi" onClick={() => setSelectedTab(null)} />
              </>
            ) : ''}
            rootClassName={_.get(tab, 'key', '') === 'filter' ? 'pdb-graph-toolbar-panel edit_tools pdb-param-editor' : ''}
            getPopupContainer={() => document.getElementsByClassName('pdb-object-graph-content')[0] as HTMLElement}
            arrow={false}
            onVisibleChange={(visible: boolean) => {
              if (!visible) setSelectedTab(null);
            }}
          >
            <Tooltip title={tab.label} placement="right">
              <div
                className={`pdb-graph-toolbar-item ${_.get(selectedTab, 'key', '') === tab.key ? 'selected' : ''}`}
                onClick={() => setSelectedTab(_.get(selectedTab, 'key', '') === tab.key ? null : tab)}
              >
                <div className="pdb-graph-toolbar-icon">
                  <i className={`operation-icon spicon ${tab.icon}`}></i>
                </div>
              </div>
            </Tooltip>
          </Popover>
        ))}
      </div>
      {/* {_.get(selectedTab, 'key') && (_.get(selectedTab, 'key', '') === 'setting' ?
        renderSettingPanel() :
        <PdbPanel
          className='pdb-graph-toolbar-panel edit_tools pdb-param-editor'
          title={_.get(selectedTab, 'label', '')}
          external={<i className="operation-icon spicon icon-guanbi" onClick={() => setSelectedTab(null)} />}
          canCollapsed={false}
        >
          {renderFilterPanel()}
        </PdbPanel>
      )} */}
    </>
  )
}