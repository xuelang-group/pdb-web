import {
  Button,
  Card,
  Checkbox,
  Col,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Popover,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from "antd";
import React, { useState, useEffect, Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  compact,
  filter,
  find,
  forEach,
  get,
  isEmpty,
  keys,
  map,
} from "lodash";
import PdbPanel from "@/components/Panel";
import { StoreState } from "@/store";
import {
  inidcatorSymbolMap,
  funcOptionsObj,
  typeMap,
  functionSymbolMap,
  optionLabelMap,
  optionSymbolMap,
  conditionOptionMap,
  typeIconMap,
  getConditionRaw,
} from "@/utils/common";
import { ConditionState, CsvHeaderState } from "@/reducers/query";
import { ColumnConfig, updateColumnConfig } from "@/reducers/indicatorAdvance";
import { operators } from "@/pages/AppExplore/ExploreFilter";
import ColumnConfigModal from "./ColumnConfig";
import ConditionsConfigModal from "./ConditionsConfig";


export default function Advance(props: any) {
  const navigate = useNavigate();
  const location = useLocation();
  const routerParams = useParams();
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [columnForm] = Form.useForm();
  const [modal, contextHolder] = Modal.useModal();
  const requestId = useSelector(
    (state: StoreState) => state.indicator.requestId
  );
  const api = useSelector((state: StoreState) => state.query.api);
  const query = useSelector((state: StoreState) => state.query.params);
  const systemInfo = useSelector((state: StoreState) => state.app.systemInfo);
  const allIndicators = useSelector(
    (state: StoreState) => state.indicator.list
  );
  const selected = useSelector(
    (state: StoreState) => state.indicatorAdvance.selected
  );
  const upstreams = useSelector(
    (state: StoreState) => state.indicatorAdvance.upstreams
  );
  const params = useSelector(
    (state: StoreState) => state.indicatorAdvance.pql_params.params
  );
  const column_config = useSelector(
    (state: StoreState) => state.indicatorAdvance.column_config
  );
  const metric_params = useSelector(
    (state: StoreState) => state.indicatorAdvance.metric_params
  );
  const [upEnd, setUpEnd] = useState(""); // 减法、除法符号节点，选择被减数或被除数
  const [funcOptions, setfuncOptions] = useState<string[]>(); // 统计算法选项
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
      }
    });
  };

  useEffect(() => {
    if (upstreams) {
      const end = find(upstreams, { end: true });
      setUpEnd(end?.edgeId || "");
    }
  }, [upstreams]);

  // 指标度量选择
  const handleDimensionChange = (value: string) => {
    const dimension = find(column_config, { id: value });
    console.log(value, dimension)
    const attrType = get(dimension, "type", "");
    const funcs = get(funcOptionsObj, attrType, []);
    setfuncOptions(funcs);
  };

  // 点击“维度对齐”按钮
  const handleClickAlign = () => {
    // 请求画布中所有指标详情获取他们的维度数据
    const graph = (window as any).INDICATOR_GRAPH;
    const { nodes } = graph.save();
    const obj: { [id: string]: any } = {};
    const indicatorNodes = nodes.filter(
      (n: any) => n.type !== "symbol" && n.id !== "end"
    );
    const indicators = compact(map(indicatorNodes, (n: any) => n.data));
    forEach(indicators, (data: any) => {
      const metricDetail = find(allIndicators, { id: data.id });
      if (metricDetail) {
        obj[data.id] = {
          ...data,
          columns: get(metricDetail, "pql_params.params.csv.header", []),
        };
      }
    });
    setColumnsMap(obj);
    setOpen(true);
  };

  // 维度设置- 过滤
  const onEditCondition = (item: ColumnConfig) => {
    setConditionOpen(true)
    setConditionCfg(item)
  }

  // 维度设置- 自定义维度名称，更新Distinct
  const handleChangeCondition = (id: string | number, key: string, value: any) => {
    const col_cfgs = map(column_config, (cfg) => (cfg.id !== id ? cfg : {...cfg, [key]: value}))
    dispatch(updateColumnConfig(col_cfgs))
  }

  const onConditionSave = (id: number | string, conditions: ConditionState[]) => {
    handleChangeCondition(id, 'conditions', conditions)
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
        <Button type="link" size="small" icon={<EyeOutlined />} />
      </Popover>
    );
  };

  return (
    <div className="pdb-right-panel">
      <PdbPanel title="指标配置" direction="right" canCollapsed={true}>
        {selected?.type === "symbol" &&
          ["divide", "minus"].includes(selected?.label) && (
            <Form.Item style={{padding: '1.5rem 1.6rem 0'}}
              label={`被${selected?.label === "divide" ? "除" : "减"}数`}
            >
              {upstreams && (
                <Radio.Group
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
        <Card size="small" title="维度设置" bordered={false} extra={
          <Button onClick={handleClickAlign} size="small">
            维度对齐
          </Button>
        }>
          <Form className="pdb-indicator-advColumns" form={columnForm}>
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
                          type="link"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => onEditCondition(item)}
                        />
                      </Space>
                      <Form.Item noStyle name={[item.id, 'distinct']} valuePropName="checked">
                        <Checkbox onChange={(e) => handleChangeCondition(item.id, 'distinct', e.target.checked)}>distinct</Checkbox>
                      </Form.Item>
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
          style={{ maxWidth: 600 }}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item label="指标度量">
            {/* <Input /> */}
            <Select
              placeholder="指标度量"
              allowClear
              options={map(column_config, (item) => ({
                label: item.name || compact(item.cols)[0].attrName,
                value: item.id,
                type: item.type,
              }))}
              optionRender={(opt) => (
                <Space>
                  <i
                    className={`attr-type-icon iconfont icon-${typeIconMap[opt.data?.type || '']}`}
                  />
                  {opt.data.label}
                </Space>
              )}
              onChange={handleDimensionChange}
            />
          </Form.Item>
          <Form.Item name={"func"} label="统计算法">
            <Select
              placeholder="统计算法"
              allowClear
              options={map(funcOptions, (item) => ({
                label: item,
                value: item,
              }))}
            />
          </Form.Item>
          <Form.Item label="Group by">
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
                      <Form.Item {...field} noStyle>
                        <Select
                          placeholder="请选择"
                          options={map(params.csv.header, (item) => ({
                            label: item.attrName,
                            value: item.attrId,
                            disabled: form
                              .getFieldValue("groupBy")
                              ?.includes(item.attrId),
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
                      {fields.length > 1 && (
                        <DeleteOutlined
                          className="dynamic-delete-button"
                          onClick={() => remove(field.name)}
                          style={{ marginLeft: 8 }}
                        />
                      )}
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
        <Space
          direction="vertical"
          style={{ margin: "auto 0 16px", padding: "0 17px" }}
          size={16}
        >
          <Row gutter={8}>
            <Col span={12}>
              <Button block type="primary" onClick={() => {}}>
                试计算
              </Button>
            </Col>
            <Col span={12}>
              <Button block type="primary" onClick={() => {}}>
                保存指标
              </Button>
            </Col>
          </Row>
          <Button
            block
            onClick={() => {
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
      {contextHolder}
    </div>
  );
}
