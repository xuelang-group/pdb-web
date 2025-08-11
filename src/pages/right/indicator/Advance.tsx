import {
  Button,
  Card,
  Col,
  Flex,
  Form,
  Input,
  message,
  Modal,
  Popover,
  Radio,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import { useState, useEffect, Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  CodeOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  PlusOutlined,
  VerticalAlignTopOutlined,
} from "@ant-design/icons";
import {
  compact,
  filter,
  find,
  forEach,
  get,
  isEmpty,
  map,
  toNumber,
  isArray,
} from "lodash";
import PdbPanel from "@/components/Panel";
import { StoreState } from "@/store";
import {
  inidcatorSymbolMap,
  funcOptionsObj,
  typeMap,
  getConditionRaw,
} from "@/utils/common";
import { clearQuery, ConditionState, CsvHeaderState } from "@/reducers/query";
import { ColumnConfig, setAdvReadonly, setCalc, setCodeMode, setGraphData, setMetricInfo, setMetricParams, setPqlParams, updateColumnConfig, exitAdv } from "@/reducers/indicatorAdvance";
import { operators } from "@/pages/AppExplore/ExploreFilter";
import ColumnConfigModal from "./ColumnConfig";
import ConditionsConfigModal from "./ConditionsConfig";
import { addMetric, getFuncResult, getMetricDetail2, getMetrics } from "@/actions/indicator";
import SaveModal from "./SaveModal";
import { exit, setEditId, setMetrics } from "@/reducers/indicator";
import UpdateModal from "./UpdateModal";
import AdvanceCodeMode from "./AdvanceCodeMode";
import AdvanceCalc from "@/pages/indicator/AdvanceCalc";


export default function Advance(props: any) {
  const navigate = useNavigate();
  const routerParams = useParams();
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [columnForm] = Form.useForm();
  const [modal, contextHolder] = Modal.useModal();
  // const requestId = useSelector(
  //   (state: StoreState) => state.indicator.requestId
  // );
  const api = useSelector((state: StoreState) => state.query.api);
  const systemInfo = useSelector((state: StoreState) => state.app.systemInfo);
  const checkId = useSelector((state: StoreState) => state.indicator.checkId);
  const selected = useSelector(
    (state: StoreState) => state.indicatorAdvance.selected
  );
  const upstreams = useSelector(
    (state: StoreState) => state.indicatorAdvance.upstreams
  );
  const column_config = useSelector(
    (state: StoreState) => state.indicatorAdvance.column_config
  );
  const metric_params = useSelector(
    (state: StoreState) => state.indicatorAdvance.metric_params
  );
  const pql_params = useSelector(
    (state: StoreState) => state.indicatorAdvance.pql_params
  );
  const basic_info = useSelector(
    (state: StoreState) => state.indicatorAdvance.basic_info
  );
  const readonly = useSelector(
    (state: StoreState) => state.indicatorAdvance.readonly
  );
  const [upEnd, setUpEnd] = useState(""); // 减法、除法符号节点，选择被减数或被除数
  const [columnsMap, setColumnsMap] = useState<{
    [metricId: string]: {
      id: string;
      name: string;
      name_cn: string;
      type: number;
      columns: CsvHeaderState[];
      [key: string]: any;
    };
  }>({}); // 画布中指标节点的维度
  const [open, setOpen] = useState<boolean>(false); // 维度对齐弹窗
  const [conditionOpen, setConditionOpen] = useState<boolean>(false); // 过滤条件编辑弹窗
  const [conditionCfg, setConditionCfg] = useState<ColumnConfig>(); // 过滤条件编辑弹窗
  // 保存弹窗
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const [modalLoading, setModalLoading] = useState<boolean>(false)
  const [updateModalVisible, setUpdateModalVisible] = useState<boolean>(false)
  const [calcModalOpen, setCalcModalOpen] = useState<boolean>(false)
  const [calculating, setCalculating] = useState<boolean>(false)
  const [alignLoading, setAlignLoading] = useState<boolean>(false)

  useEffect(() => {
    const dimension = get(metric_params, 'dimension.name', '')
    const func = get(metric_params, 'func', '')
    const groupBy = !isEmpty(metric_params?.group_by) ? map(get(metric_params, 'group_by', []), 'name') : ['']
    form.setFieldsValue({
      dimension,
      func,
      groupBy,
    })
  }, [metric_params])

  useEffect(() => {
    const values = getColumnFormInitialValues()
    columnForm.setFieldsValue(values)
    // 维度对齐修改后，如果指标度量、groupBy已经不在新的维度中，则清空
    // const groupBy = form.getFieldValue('groupBy')
    // const names = map(column_config, 'name')
    // const removedIndex = findIndex(groupBy, (gp: string) => !names.includes(gp))
    // if (removedIndex > -1) {
    //   form.setFieldValue('groupBy', [''])
    // }
  }, [column_config])

  // 处理上游
  const handleChangeUpstream = (edgeId: string) => {
    const graph = (window as any).INDICATOR_GRAPH;
    const model = graph.findById(edgeId).getModel();
    setUpEnd(edgeId);
    graph.updateItem(edgeId, { ...model, end: true });
    graph.setItemState(edgeId, "end", true);
    forEach(upstreams, (item) => {
      if (item.edgeId !== edgeId) {
        graph.setItemState(item.edgeId, "end", false);
        const md = graph.findById(item.edgeId).getModel();
        graph.updateItem(item.edgeId, { ...md, end: false });
      }
    });
  };

  useEffect(() => {
    if (upstreams) {
      const end = find(upstreams, { end: true });
      setUpEnd(end?.edgeId || "");
    }
  }, [upstreams]);

  // 点击“维度对齐”按钮
  const handleClickAlign = async () => {
    // 请求画布中所有指标详情获取他们的维度数据
    const graph = (window as any).INDICATOR_GRAPH;
    const { nodes } = graph.save();
    if (isEmpty(nodes)) {
      message.warning('没有可以对齐的源指标！')
      return
    }
    const indicatorNodes = nodes.filter(
      (n: any) => n.type !== "symbol" && n.id !== "end"
    );
    if (isEmpty(indicatorNodes)) {
      message.warning('没有可以对齐的源指标！')
      return
    }
    setAlignLoading(true)
    const indicators = compact(map(indicatorNodes, (n: any) => n.data));
    const obj: { [id: string]: any } = {};
    const missingInidators = []
    for(let data of indicators) {
      const res = await getMetricDetail2({ id: data.id });
      if (res.status === 200 && !isEmpty(res.data)) {
        const cols = get(res.data, "pql_params.params.csv.header", []);
        const dimensionName = get(res.data, "metric_params.dimension.name");
        obj[data.id] = {
          ...data,
          columns: dimensionName ? filter(cols, item => item.attrId !== dimensionName) : cols,
        };
      } else {
        missingInidators.push(data)
      }
    }
    setColumnsMap(obj);
    if (!isEmpty(missingInidators)) {
      modal.warning({        
        icon: <ExclamationCircleOutlined />,
        title: "数据丢失",
        content: (
          <>
            <div style={{marginTop: 8, marginBottom: 8}}>以下指标的数据已经找不到了</div>
            <ul className="list">{
              map(missingInidators, item => (
              <li key={item.id}>
                {
                  item.type !== 2 ? <i className="item-icon iconfont icon-zhibiao"></i> :
                  <svg className="svg-icon" aria-hidden="true">
                    <use xlinkHref="#icon-gaojizhibiao">
                    </use>
                  </svg>
                }
                <span className='item-label'>{item.name}</span><span className="item-label2">{item.name_cn}</span>
              </li>
            ))
            }</ul>
          </>
        ),
        onOk: () => {
          setAlignLoading(false)
          setOpen(true);
        }
      })
    } else {
      setAlignLoading(false)
      setOpen(true);
    }
  };

  // 维度设置- 过滤
  const onEditCondition = (item: ColumnConfig) => {
    setConditionOpen(true)
    setConditionCfg(item)
  }

  // 维度设置- 自定义维度名称
  const handleChangeCondition = (id: string | number, key: string, value: any) => {
    const col_cfgs = map(column_config, (cfg) => (cfg.id !== id ? cfg : {...cfg, [key]: value}))
    dispatch(updateColumnConfig(col_cfgs))
  }

  // 维度设置- 保存数据过滤条件
  const onConditionSave = (id: number | string, conditions: ConditionState[]) => {
    handleChangeCondition(id, 'conditions', conditions)
  }

  const updateList = (callback?: Function) => {
    getMetrics(function (response: any) {
      if (response) {
        dispatch(setMetrics(response || []));
      } else {
        message.error("获取列表数据失败：" + response.message || response.msg);
      }
      callback && callback();
    });
  };

  const onSave = (values: any) => {
    const graph = (window as any).INDICATOR_GRAPH;
    const { nodes, edges } = graph.save();
    const graph_data = {
      nodes: map(nodes, n => ({id: n.id, type: n.type, label: n.label, x: n.x, y: n.y, data: n.data})),
      edges: map(edges, edg => ({id: edg.id, source: edg.source, target: edg.target, end: edg.end}))
    }
    setModalLoading(true)
    // editId ? updateMetric({
    //   ...values,
    //   id: editId,
    //   type: 2,
    //   graph_data,
    //   column_config,
    //   metric_params,
    //   pql_params
    // }, (success: boolean, res: any) => {
    //   if (success) {
    //     message.success("编辑指标成功");
    //     updateList();
    //     dispatch(setMetricInfo(values))
    //     setModalVisible(false)
    //   } else {
    //     message.error("编辑指标失败：" + res.message || res.msg);
    //   }
    // }) : 
    addMetric({
      ...values,
      type: 2,
      graph_data,
      column_config,
      metric_params,
      pql_params
    }, (success: boolean, res: any) => {
      if (success) {
        message.success(`${basic_info?.id ? '更新' : '保存'}指标成功`);
        updateList();
        dispatch(setMetricInfo(values))
        dispatch(setGraphData(graph_data))
        dispatch(setEditId(res))
        basic_info?.id ? setUpdateModalVisible(false) : setModalVisible(false)
      } else {
        message.error(`${basic_info?.id ? '更新' : '保存'}指标失败：${res.message || res.msg}`);
      }
      setModalLoading(false)
    });
  }

  const onAddVersion = ({version, ori_id}: any) => {
    onSave({
      name_cn: basic_info?.name_cn,
      name: basic_info?.name,
      unit: basic_info?.unit || '',
      desc: basic_info?.desc || '',
      ori_id: ori_id,
      version: version,
    })
  }

  // 保存指标
  const handleSave = () => {
    const graph = (window as any).INDICATOR_GRAPH;
    const { nodes } = graph.save();
    if (isEmpty(nodes)) {
      message.warning('画布内容空白！')
      return
    }
    form.validateFields().then(values => {
      const metric_params = {
        dimension: { name: values.dimension, name_cn: values.dimension },
        func: values.func,
        group_by: map(filter(values.groupBy, item => !!item), item => ({name: item, name_cn: item}))
      }
      const pql_params = {
        api: api,
        params: {
          graphId: routerParams.id || "",
          pql: [[]],
          csv: {
            header: map(column_config, cfg => ({
              attrName: cfg.name,
              attrType: cfg.type || compact(cfg.cols)[0].attrName,
              attrId: cfg.id,
              index: 0,
              typeId: ''
            })),
          },
        }
      }
      basic_info?.id ? setUpdateModalVisible(true) : setModalVisible(true)
      dispatch(setMetricParams(metric_params))
      dispatch(setPqlParams(pql_params))
    })
  }

  // 数据过量
  const [formExcess] = Form.useForm()
  const handleCalc = (total: number, params: any) => {
    const excess = total > 1000
    const options = [{value: -1, label: '全量'}, {value: 1000, label: '1000条'}, {value: 500, label: '500条'}, {value: 100, label: '100条'}]
    modal.confirm({
      icon: <ExclamationCircleOutlined />,
      title: "提示",
      okText: "计算",
      content: (
        <>
          <Typography.Text type={excess ? "warning" : 'secondary'}>
            系统检测到数据量 {total} 条，{ total > 100 ? '可能会影响体验' : '是否开始计算？'}
          </Typography.Text>
          { excess && <Form form={formExcess} initialValues={{limit: 100}} style={{ marginTop: 16,  marginBottom: 16 }} name="excess" layout="vertical">
            <Form.Item label="请选择数据量：" name="limit">
              <Radio.Group
                options={options}
              />
            </Form.Item>
          </Form>}
        </>
      ),
      onOk() {
        const limit = formExcess.getFieldValue('limit')
        if (excess && limit > 0 ) {
          Object.assign(params, {limit})
        }
        return getFuncResult(params, handleFuncCallback)
      },
    });
  };

  const handleFuncCallback = (success: boolean, response: any) => {
    if (success) {
      if (response.csv.trim() && isArray(response.result)) {
        dispatch(setCalc(response))
        setCalcModalOpen(true)
      } else {
        dispatch(setCalc(''))
        modal.info({
          title: "计算结果",
          okText: "确认",
          content: (<Typography.Title level={4}>{response.result}</Typography.Title>)
        })
      }
    } else {
      message.error(response.message || response.msg);
    }
    setCalculating(false)
    formExcess.resetFields()
  }

  // 试计算
  const handleTryCompute = () => {
    const graph = (window as any).INDICATOR_GRAPH;
    const { nodes, edges } = graph.save();
    if (isEmpty(nodes)) {
      message.warning('画布空白内容，不能计算')
      return
    }
    form.validateFields().then(values => {
      const graph_data = {
        nodes: map(nodes, n => ({id: n.id, type: n.type, label: n.label, x: n.x, y: n.y, data: n.data})),
        edges: map(edges, edg => ({id: edg.id, source: edg.source, target: edg.target, end: edg.end}))
      }
      const metric_params = {
        dimension: { name: values.dimension, name_cn: values.dimension },
        func: values.func,
        group_by: map(values.groupBy, item => ({name: item, name_cn: item}))
      }
      const pql_params = {
        api: api,
        params: {
          graphId: routerParams.id || "",
          pql: [[]],
          csv: {
            header: map(column_config, cfg => ({
              attrName: cfg.name,
              attrType: cfg.type || compact(cfg.cols)[0].attrName,
              attrId: cfg.id,
              index: 0,
              typeId: ''
            })),
          },
        }
      }
      dispatch(setMetricParams(metric_params))
      dispatch(setPqlParams(pql_params))

      setCalculating(true)
      getFuncResult({
        cal_type: 2,
        graph_data,
        metric_params,
        metric_type: 2,
        column_config,
        pql_params,
      }, function(success: boolean, response: any) {
        if (success) {
          const total = toNumber(response.total)
          const params = {
            cal_type: 1,
            graph_data,
            metric_params,
            metric_type: 2,
            column_config,
            pql_params,
          }
          total > 100 ? handleCalc(total, params) : getFuncResult(params, handleFuncCallback)
        } else {
          setCalculating(false)
          message.error(response.message || response.msg);
        }
      })
    })
  }

  const renderCondition = (conditions: ConditionState[], name: string) => {
    const content = map(conditions, (item, index) => {
      let text = getConditionRaw(item, name)
      return (
        <Fragment key={index}>
          {item.connectives ? `${operators[item.connectives]} ` : ""}{" "}
          <Tag>{text}</Tag>
        </Fragment>
      );
    });
    return (
      <Popover
        title="过滤条件"
        content={ isEmpty(conditions) ? '无' : <Space>{content}</Space> }
      >
        <Button type="text" size="small" icon={<EyeOutlined />} />
      </Popover>
    );
  };

  const getColumnFormInitialValues = () => {
    const values: {[id: string]: {name: string}} = {}
    forEach(column_config, cfg => {
      values[cfg.id] = {
        name: cfg.name,
      }
    })
    return values
  }

  return (
    <div className="pdb-right-panel">
      <PdbPanel title="指标配置" direction="right" canCollapsed={true}>
        <div style={{maxHeight: 'calc(100vh - 21rem', overflow: 'auto'}}>
        {selected?.type === "symbol" &&
          ["divide", "minus"].includes(selected?.label) && (
            <Form.Item style={{padding: '1.5rem 1.6rem 0'}}
              label={`被${selected?.label === "divide" ? "除" : "减"}数`}
            >
              {upstreams && (
                <Radio.Group disabled={readonly}
                  value={upEnd}
                  onChange={(e) => handleChangeUpstream(e.target.value)}
                >
                  {upstreams.map((item) => (
                    <Radio key={item.edgeId} value={item.edgeId}>
                      {inidcatorSymbolMap[item.label] || item.label}
                    </Radio>
                  ))}
                </Radio.Group>
              )}
            </Form.Item>
          )}
        <Card className={`pdb-indicator-advCard${isEmpty(column_config) ? ' no-body': ''}`} title="维度设置" bordered={false} extra={
          <Button type="primary" loading={alignLoading} disabled={readonly} onClick={handleClickAlign} size="small" icon={<VerticalAlignTopOutlined />}>
            维度对齐
          </Button>
        }>
          <Form className="pdb-indicator-advColumns"
            form={columnForm} disabled={readonly}
            initialValues={getColumnFormInitialValues()}
          >
            {!isEmpty(column_config) &&
              column_config.map((item) => {
                return (
                  <div className="pdb-indicator-advCol" key={item.id}>
                    <div className="pdb-indicator-advCol-title">
                      {item.cols[0].attrName}({item.cols[0].metric.name})
                    </div>
                    <Form.Item noStyle name={[item.id, 'name']}>
                      <Input
                        addonBefore={typeMap.type[item.cols[0].attrType]}
                        placeholder="自定义维度名称"
                        onBlur={(e) => e.target.value !== item.name && handleChangeCondition(item.id, 'name', e.target.value)}
                      />
                    </Form.Item>
                    <Flex
                      className="pdb-indicator-advCol-extra"
                      gap={8}
                      justify="space-between"
                      align="center"
                    >
                      <Space>
                        <Typography.Text>过滤:</Typography.Text>
                        {renderCondition(item.conditions, item.name)}
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => onEditCondition(item)}
                        />
                      </Space>
                    </Flex>
                  </div>
                );
              })}
          </Form>
        </Card>
        <Form
          className="pdb-indicator-info"
          name="advance"
          form={form}
          disabled={readonly || isEmpty(column_config)}
          style={{ maxWidth: 600 }}
          autoComplete="off"
          layout="vertical"
          initialValues={{
            dimension: get(metric_params, 'dimension.name', ''),
            func: get(metric_params, 'func', ''),
            groupBy: metric_params?.group_by ? map(metric_params?.group_by, 'name') : ['']
          }}
        >
          <Form.Item label="度量别名" name={"dimension"}>
            <Input />
          </Form.Item>
          <Form.Item name={"func"} label="统计算法">
            <Select
              placeholder="统计算法"
              allowClear
              options={map(funcOptionsObj['int'], (item) => ({
                label: item,
                value: item,
              }))}
            />
          </Form.Item>
          <Form.Item label="Group by" style={{margin: 0}}>
            <Form.List name="groupBy">
              {(fields, { add, remove }, { errors }) => (
                <>
                  {fields.map((field, index) => (
                    <Form.Item 
                      label={""}
                      required={false}
                      key={field.key}
                      style={{ marginBottom: 12 }}
                    >
                      <Form.Item {...field} noStyle >
                        <Select
                          placeholder="请选择"
                          options={map(filter(column_config, item => !!item.name), (item) => ({
                            label: item.name,
                            value: item.name,
                            disabled: form
                              .getFieldValue("groupBy")
                              ?.includes(item.name),
                          }))}                          
                          onChange={(value) => {
                            form.setFieldsValue({
                              groupBy: form
                                .getFieldValue("groupBy")
                                .map((item: any, i: number) => {
                                  if (i === index) {
                                    return value;
                                  }
                                  return item;
                                }),
                            });
                          }}
                          className="pdb-select-group-by"
                        />
                      </Form.Item>
                      <Button icon={<DeleteOutlined />} type="text"
                        className="dynamic-delete-button"
                        onClick={() => {
                          if (index === 0 && fields.length === 1) {
                            form.setFieldsValue({
                              groupBy: ['']
                            })
                          } else {
                            remove(field.name)
                          }
                        }}
                      />
                    </Form.Item>
                  ))}
                  <Form.Item>
                    {form.getFieldValue("groupBy")?.[fields.length - 1] && (
                      <Button
                        block
                        type="dashed"
                        onClick={() => add()}
                        style={{ width: "100%" }}
                        icon={<PlusOutlined />}
                      />
                    )}
                    <Form.ErrorList errors={errors} />
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>
        </Form>
        </div>
        <Space
          direction="vertical"
          style={{ margin: "auto 0 16px", padding: "0 17px" }}
          size={16}
        >
          <Row gutter={8}>
            <Col span={10}>
              <Button block loading={calculating} type="primary" disabled={readonly} onClick={handleTryCompute}>
                试计算
              </Button>
            </Col>
            <Col span={10}>
              { readonly
                ? <Button block type="primary" onClick={() => {
                  dispatch(setAdvReadonly(false))
                  dispatch(setEditId(checkId))
                }}>编辑指标</Button>
                : <Button block type="primary" onClick={handleSave}>{basic_info?.id ? "更新指标" : "保存指标"}</Button>
              }
            </Col>
            <Col span={4}>
              <Button icon={<CodeOutlined />} disabled={readonly} onClick={() => dispatch(setCodeMode(true))} />
            </Col>
          </Row>
          <Button
            block
            onClick={() => {
              dispatch(exit())
              dispatch(clearQuery())
              dispatch(exitAdv())
              navigate(`/${systemInfo.graphId}/indicator/index`);
            }}
          >
            退出
          </Button>
        </Space>
      </PdbPanel>
      <ConditionsConfigModal
        visible={conditionOpen}
        column={conditionCfg}
        onCancel={() => setConditionOpen(false)}
        onSave={onConditionSave}
      />

      <ColumnConfigModal
        visible={open}
        columnsMap={columnsMap}
        onCancel={() => setOpen(false)}
      />
      <SaveModal
        visible={modalVisible}
        editId={basic_info?.id}
        onCancel={() => setModalVisible(false)}
        onOk={onSave}
        modalLoading={modalLoading}
      />
      <UpdateModal
        visible={updateModalVisible}
        editId={basic_info?.id}
        onCancel={() => setUpdateModalVisible(false) }
        onOk={onAddVersion}
        modalLoading={modalLoading}
      />
      <AdvanceCodeMode />
      <AdvanceCalc open={calcModalOpen} onClose={() => setCalcModalOpen(false)} />      
      {contextHolder}
    </div>
  );
}
