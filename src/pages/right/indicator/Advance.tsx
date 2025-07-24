import {
  Button,
  Checkbox,
  Col,
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
import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  LeftOutlined,
  PlusOutlined,
  SmallDashOutlined,
} from "@ant-design/icons";
import { compact, find, forEach, get, isEmpty, keys, map } from "lodash";
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
} from "@/utils/common";
import { ConditionState, CsvHeaderState } from "@/reducers/query";

interface ConditionsMap {
  [typeId: string]: {
    [attrId: string]: ConditionState;
  };
}

export default function Advance(props: any) {
  const navigate = useNavigate();
  const location = useLocation();
  const routerParams = useParams();
  const [form] = Form.useForm();
  const [modal, contextHolder] = Modal.useModal();
  const requestId = useSelector(
    (state: StoreState) => state.indicator.requestId
  );
  const api = useSelector((state: StoreState) => state.query.api);
  const query = useSelector((state: StoreState) => state.query.params);
  const systemInfo = useSelector((state: StoreState) => state.app.systemInfo);
  const allIndicators = useSelector((state: StoreState) => state.indicator.list);
  const selected = useSelector(
    (state: StoreState) => state.indicatorAdvance.selected
  );
  const upstreams = useSelector(
    (state: StoreState) => state.indicatorAdvance.upstreams
  );
  const params = useSelector(
    (state: StoreState) => state.indicatorAdvance.pql_params.params
  );
  const metric_params = useSelector(
    (state: StoreState) => state.indicatorAdvance.metric_params
  );
  const [upEnd, setUpEnd] = useState(""); // 减法、除法符号节点，选择被减数或被除数
  const [funcOptions, setfuncOptions] = useState<string[]>(); // 统计算法选项
  const [conditionsMap, setConditionsMap] = useState<ConditionsMap>({}); // 统计算法选项
  const [columnsMap, setColumnsMap] = useState<{[id: string]: any}>({}); // 画布中指标节点的维度
  const [open, setOpen] = useState<boolean>(false);  // 维度对齐弹窗

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

  useEffect(() => {
    const pql = params.pql[0];
    const cons: ConditionsMap = {};
    forEach(pql, (item) => {
      if (!cons[item.id]) cons[item.id] = {};
      item.conditions.forEach((con) => {
        cons[item.id][con.name] = con;
      });
    });
    setConditionsMap(cons);
  }, [params]);

  // 点击“维度对齐”按钮
  const handleClickAlign = () => {
    // 请求画布中所有指标详情获取他们的维度数据
    const graph = (window as any).INDICATOR_GRAPH;
    const { nodes } = graph.save()
    const obj: {[id: string]: any} = {}
    const indicatorNodes = nodes.filter((n: any) => n.type !== 'symbol' && n.id !== 'end')
    const indicators = compact(map(indicatorNodes, (n: any) => n.data))
    forEach(indicators, (data: any) => {
      const metricDetail = find(allIndicators,  {id: data.id})
      if (metricDetail) {
        obj[data.id] = { ...data, columns: get(metricDetail, 'pql_params.params.csv.header', []) }
      }
    })
    setColumnsMap(obj)
    setOpen(true)
  }

  const renderCondition = (item: ConditionState, attr: CsvHeaderState) => {
    let text = "--";
    if (item) {
      const condition = functionSymbolMap[item.function];
      if (condition === "has") {
        text = `${item.not ? "NOT " : ""}存在属性 ${attr.attrName}`;
      } else {
        const keyword =
          typeof item.value === "object"
            ? item.value.format("YYYY-MM-DD")
            : item.value;
        const conditionLabel =
          (condition === "anyofterms" || condition === "allofterms"
            ? optionLabelMap[condition]
            : optionSymbolMap[condition]) || "";
        text = `${item.not ? "NOT " : ""} ${conditionLabel} ${keyword}`;
      }
    }
    const conditionOptions = get(conditionOptionMap, attr.attrType, ["eq"]);
    const options = conditionOptions.map((condition: string) => ({
      value: condition,
      label: optionLabelMap[condition],
    }));
    return (
      <Popover
        title="过滤条件"
        content={
          <Space direction="vertical" size="small">
            <Space.Compact>
              <Select
                style={{ width: 100 }}
                defaultValue={functionSymbolMap[item?.function] || "eq"}
                options={options}
              />
              <Input style={{ width: 200 }} defaultValue={item?.value || ""} />
            </Space.Compact>
            <Form.Item label="不具备条件(NOT)">
              <Switch defaultChecked={!!item?.not} />
            </Form.Item>
          </Space>
        }
      >
        <Tag>{text}</Tag>
      </Popover>
    );
  };
  console.log('columnsMap: ', columnsMap)
  return (
    <div className="pdb-right-panel">
      <PdbPanel title="指标配置" direction="right" canCollapsed={true}>
        <Form
          className="pdb-indicator-info"
          name="advance"
          form={form}
          style={{ maxWidth: 600 }}
          autoComplete="off"
          layout="vertical"
        >
          {selected?.type === "symbol" &&
            ["divide", "minus"].includes(selected?.label) && (
              <Form.Item
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
          <Form.Item label="指标度量">
            <Input />
          </Form.Item>
          <Form.Item label="维度设置">
            <Button block onClick={handleClickAlign}>维度对齐</Button>
            <div className="pdb-indicator-advColumns">
              {!isEmpty(params.csv.header) &&
                params.csv.header.map((item) => {
                  return (
                    <div className="pdb-indicator-advCol" key={item.attrId}>
                      <div className="pdb-indicator-advCol-title">
                        {item.attrName}
                      </div>
                      <Form.Item noStyle>
                        <Input
                          addonBefore={typeMap.type[item.attrType]}
                          placeholder="自定义维度名称"
                        />
                      </Form.Item>
                      <Flex
                        className="pdb-indicator-advCol-extra"
                        gap={8}
                        justify="space-between"
                        align="center"
                      >
                        {/* <Button size="small" icon={<FilterOutlined />}>过滤</Button> */}
                        <Typography.Text>
                          过滤：
                          {renderCondition(
                            conditionsMap[item.typeId]?.[item.attrId],
                            item
                          )}
                        </Typography.Text>
                        <Form.Item noStyle>
                          <Checkbox>distinct</Checkbox>
                        </Form.Item>
                      </Flex>
                    </div>
                  );
                })}
            </div>
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
      <Modal title="维度对齐" open={open} width={800}
        onCancel={() => setOpen(false)}
      >
        <div className="pdb-indicator-modal">
          <div className="pdb-indicator-modal-fix">
            <div className="pdb-indicator-modal-th"></div>
            <div className="pdb-indicator-modal-td">
              <Button size="small" icon={<PlusOutlined />} />
            </div>
          </div>
          {
            keys(columnsMap).map((id: string) => (
              <div className="pdb-indicator-modal-col" key={id}>
                <div className="pdb-indicator-modal-th">
                  {
                    columnsMap[id].type !== 2 ? <i className="iconfont icon-zhibiao" /> :
                    <svg className="svg-icon" aria-hidden="true">
                      <use xlinkHref="#icon-gaojizhibiao">
                      </use>
                    </svg>
                  }
                  <b>{columnsMap[id].name_cn}</b>
                </div>
                <div className="pdb-indicator-modal-td"></div>
                <ul className="pdb-indicator-modal-list">
                  {
                    map(columnsMap[id]['columns'], (item: CsvHeaderState) => (
                      <li key={item.attrId}>
                        <i className={`attr-type-icon iconfont icon-${typeIconMap[item.attrType]}`} />
                        {item.attrName}
                      </li>
                    ))
                  }
                </ul>
              </div>
            ))
          }
        </div>
      </Modal>
      {contextHolder}
    </div>
  );
}
