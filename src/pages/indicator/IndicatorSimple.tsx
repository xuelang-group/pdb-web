import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Col, Divider, Flex, Form, Input, message, Modal, notification, Radio, Row, Select, Space, Typography, } from "antd";
import { ExclamationCircleOutlined, LeftOutlined, PlusOutlined } from "@ant-design/icons";
import { capitalize, compact, filter, find, get, isArray, map } from "lodash";
import ExploreFilterContent from "@/pages/AppExplore/ExploreFilterContent";
import { StoreState } from "@/store";
import { getAdapterTypeHistory, getAdapterTypeList, getBuzProcess } from "@/actions/adapter";
import { checkVersion, getMetricDetail2 } from "@/actions/indicator";
import { AttrConfig, TypeConfig } from "@/reducers/type";
import { ConditionState, initialParams, setQueryParams } from "@/reducers/query";
import { funcOptionsObj, optionLabelMap, optionSymbolMap, typeIconMap, typeMap } from '@/utils/common';
import { operators } from "../AppExplore/ExploreFilter";

const { confirm } = Modal;

const layout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 16 },
};

interface CsvAttr { typeId: any; attrId: string; attrName: string; attrType: string; index: number }

interface OriginType {
  label: string;
  value: string;
  key: string;
  type: string;
  data: TypeConfig;
  csv: CsvAttr[];
  prevSearchTagType: string;
  config?: {
    conditions: any[];
    key: string;
    options: any[];
    label: string;
  };
}

export default function SimpleIndicator(props: any) {
  const childRef = React.createRef();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const routerParams = useParams();
  const [form] = Form.useForm();

  const query = useSelector((state: StoreState) => state.query.params);
  const requestId = useSelector((state: StoreState) => state.indicator.requestId);
  const currentBuzProcess = useSelector((state: StoreState) => state.indicator.currentBuzProcess);
  const types = useSelector((state: StoreState) => state.type.data)

  const [open, setOpen] = useState(false);
  const [typeList, setTypeList] = useState<TypeConfig[]>([]);
  const [processOptions, setProcessOptions] = useState([])
  const [buzProcessArr, setBuzProcessArr] = useState([])
  const [dimension, setDimension] = useState<CsvAttr>()
  const [funcOptions, setfuncOptions] = useState<string[]>()
  const [originType, setOriginType] = useState<OriginType>()
  const [limit, setLimit] = useState(100)
  
  useEffect(() => {
    if(requestId && query.pql?.length) {
      const strArr: string[] = []
      query.pql.forEach((item: any) => {
        if(isArray(item)) {
          item.forEach((subItem: any) => {
            if(subItem.id) {
              strArr.push(subItem.id)
            }
          })
        }
      })
      getBuzProcess({ requestId: requestId, xTypeNames: strArr }, (success:boolean, res: any) => {
        if (success) {
          setBuzProcessArr(res.data || [])
          setProcessOptions((res.data || []).map((item: any) => ({ label: item?.name || item, value: item?.id || item })))
        }
      })
    }
  }, [requestId, query])
  
  useEffect(() => {
    if (requestId) {
      getAdapterTypeList({ requestId }, (success: boolean, response: any) => {
        if (success) {
          const typeList = get(response, "data", []);
          if (typeList.length > 0) {
            setTypeList(compact(typeList));
          } else {
            getAdapterTypeHistory({ requestId }, (success: boolean, response: any) => {
              setTypeList(get(response, "data", []));
              if (!success) {
                notification.error({
                  message: '获取对象类型列表失败',
                  description: response.message || response.msg
                });
              }
            });
          }
        } else {
          notification.error({
            message: '获取对象类型列表失败',
            description: response.message || response.msg
          });
        }
      });
    } else {
      setTypeList(types);
    }
  }, [requestId]);
  
  useEffect(() => {
    if (!requestId) {
      setTypeList(types);
    }
  }, [types]);
  
  const handleBack = () => {
    navigate(`/${routerParams.id}/indicator/index`)
  }

  // 指标度量选择
  const handleDimensionChange = (value: string) => {
    const dimension = find(originType?.csv, {'attrId': value})
    const attrType = get(dimension, 'attrType', '')
    const funcs = get(funcOptionsObj, attrType, [])
    setfuncOptions(funcs)
    setDimension(dimension)
  }

  // 数据资产单选择后，根据选中的x.type.name，设置query
  const handleTypeNameChange = (value: string) => {
    const detail = find(typeList, {'x.type.name': value})
    if (!detail) {
      message.warning('未找到相关的数据资产单')
      return
    }
    const attrs = compact(detail['x.type.attrs'])
    const csv = map(attrs, ({ display, name, type }: AttrConfig) => ({
      typeId: detail['x.type.name'],
      attrId: name,
      attrName: display,
      attrType: type,
      index: 0
    }))
    setOriginType({
      label: detail['x.type.label'],
      value: detail['x.type.name'],
      key: detail['x.type.name'],
      type: "type",
      data: {...detail},
      prevSearchTagType: "",
      csv,
    })
  }

  // 数据筛选条件
  const getFilterConfig = function () {
    const { filterOptions } = childRef.current as any;

    let filterLabel = "", filterKey = "", conditions: any = [];
    if (filterOptions && filterOptions.length > 0) {
      filterOptions.forEach((opt: any, index: number) => {
        const condition = get(opt, 'condition.value', ""),
          attrLabel = get(opt, 'attr.label'),
          attrValue = get(opt, 'attr.value');
        let keyword = get(opt, 'keyword', ""),
          keywordValue = keyword;
        if (typeof keyword === "object") {
          keyword = keyword.format(get(opt, 'attr.data.datetimeFormat', "YYYY-MM-DD"));
          keywordValue = new Date(keyword);
        }
        let conditionDetail = {};
        if (index > 0) {
          filterLabel += `${operators[opt.operator]} `;
          filterKey += `${opt.operator} `;
          Object.assign(conditionDetail, {
            connectives: opt.operator
          });
        }
        let raw = "";
        if (condition === "has") {
          filterLabel += `存在属性 ${attrLabel}`;
          raw += `HAS ${attrValue}`;
        } else {
          const conditionLabel = (condition === "anyofterms" || condition === "allofterms" ? optionLabelMap[condition] : optionSymbolMap[condition]) || ""
          filterLabel += `${opt.isNot ? "NOT " : ""}${attrLabel} ${conditionLabel} ${keyword}`;
          raw += `${opt.isNot ? "NOT " : ""}${attrValue} ${optionSymbolMap[condition] || ""} ${typeof get(opt, 'keyword', "") === "string" ? `'${keywordValue}'` : keywordValue}`;
        }
        Object.assign(conditionDetail, {
          // raw,
          name: attrValue,
          function: optionSymbolMap[condition] || "",
          value: keywordValue,
          not: opt.isNot
        });
        conditions.push(conditionDetail);
        filterKey += raw;
        if (index < filterOptions.length - 1) {
          filterLabel += " ";
          filterKey += " ";
        }
      });
    }
    return {
      key: filterKey,
      label: filterLabel,
      conditions,
      options: filterOptions
    }
  }

  const updateQueryParams = () => {
    const detail = originType?.data
    if (!detail) {
      message.warning('未找到相关的数据资产单')
      return
    }
    const columns = form.getFieldValue('columns')
    const config = getFilterConfig()
    const pql = [[{
      type: "object",
      conditionRaw: get(config, "key", ""),
      conditions: get(config, "conditions", []),
      id: detail['x.type.name'],
      name: detail['x.type.label'],
    }]]
    const csv = filter(originType.csv, ({attrId}) => columns.includes(attrId))
    dispatch(setQueryParams({
      graphId: routerParams.id || '',
      pql,
      csv: {
        header: csv
      }
    }));
  }

  const onSubmit = () => {
    form.validateFields().then((values) => {
      console.log("finish: ", values);
    })
  }

  // 数据过量
  const handleExcess = () => {
    confirm({
      icon: <ExclamationCircleOutlined />,
      title: '提示',
      content: (
        <>
        <Typography.Text type="warning">系统检测到数据量过大，可能会影响体验</Typography.Text>
        <Form.Item style={{marginTop: 8}} layout='vertical' label='请选择数据量：'>
          <Radio.Group defaultValue={limit} onChange={(e) => setLimit(e.target.value)}>
            <Radio value={-1}>全量</Radio>
            <Radio value={500}>500条</Radio>
            <Radio value={100}>100条</Radio>
          </Radio.Group>
        </Form.Item>
        </>
      ),
      onOk() {
        console.log('--- 最大数据量：', limit);
      },
    })
  }

  const handleTryCompute = () => {
    handleExcess()
  }

  return (
    <>
    <div className="pdb-indicator-title">
      <Button className="pdb-indicator-back" type="text" size="small" icon={<LeftOutlined />} onClick={handleBack} />
      <Typography.Text>初级指标创建</Typography.Text>
    </div>
    <div className="pdb-indicator-simple">
      <div className="pdb-indicator-simple-body">
        <Form name="simple" {...layout} form={form}>
          <Divider orientation="left" orientationMargin={16}>
            基础信息
          </Divider>
          <Flex wrap className="pdb-indicator-flex">
            <Form.Item label="中文名称" rules={[{ required: true, message: '请输入中文名称' }]} name={'name_cn'}>
              <Input placeholder="请输入中文名称" />
            </Form.Item>
            <Form.Item label="英文名称" rules={[{ required: true, message: '请输入英文名称' }]} name={'name'}>
              <Input placeholder="请输入英文名称" />
            </Form.Item>
            <Form.Item label="所属业务过程" name={'buzProcess'}>
              <Select placeholder="请选择所属业务过程" options={processOptions} />
            </Form.Item>
            <Form.Item label="相关业务过程">
              ---
            </Form.Item>
            <Form.Item label="指标描述" name={'desc'}>
              <Input.TextArea placeholder="请输入指标描述" rows={3} />
            </Form.Item>
          </Flex>
          <Divider orientation="left" orientationMargin={16}>
            指标定义
          </Divider>
          <Flex wrap className="pdb-indicator-flex">
            <Form.Item
              name={"typeName"}
              label="数据资产单"
              rules={[{ required: true }]}
            >
              <Select
                placeholder='数据资产单'
                options={map(typeList, (val) => ({label: val['x.type.label'], value: val['x.type.name']}))}
                onChange={handleTypeNameChange}
              />
            </Form.Item>
            <Form.Item
              name={"dimension"}
              label="指标度量"
              rules={[{ required: true }]}
            >
              <Select
                placeholder='请选择指标度量'
                options={
                  map(originType?.csv, (item) => ({
                    label: item.attrName,
                    value: item.attrId,
                    type: item.attrType
                  }))
                }
                optionRender={(opt) => (
                  <Space>
                    <i className={`attr-type-icon iconfont icon-${typeIconMap[opt.data.type]}`} />
                    {opt.data.label}
                    {/* <Typography.Text type="secondary" code>
                      { capitalize(opt.data.type) }
                    </Typography.Text> */}
                  </Space>
                )}
                onChange={handleDimensionChange}
              />
            </Form.Item>
            <Form.Item name={"unit"} label="单位">
              <Input />
            </Form.Item>
            <Form.Item
              name={"func"}
              label="统计算法"
              rules={[{ required: true }]}
            >
              <Select
                placeholder='统计算法'
                allowClear
                options={map(funcOptions, (item) => ({ label: item, value: item }))}
              />
            </Form.Item>
          </Flex>
          <Form.Item
            labelCol={{ span: 3 }}
            wrapperCol={{ span: 20 }}
            name={"columns"}
            label="指标维度"
          >
            <Select mode="tags"
              allowClear
              options={
                map(originType?.csv, (item) => ({
                  label: item.attrName,
                  value: item.attrId,
                  type: item.attrType,
                  disabled: dimension?.attrId === item.attrId
                }))
              }
              optionRender={(opt) => (
                <Space>
                  <i className={`attr-type-icon iconfont icon-${typeIconMap[opt.data.type]}`} />                  
                  {opt.data.label}
                  {/* <Typography.Text type="secondary"> - {typeMap.type[opt.data.type]}</Typography.Text> */}
                </Space>
              )}
            />
          </Form.Item>
        </Form>
        <Divider orientation="left" orientationMargin={16}>
          数据筛选
        </Divider>
        <Row>
          <Col span={18} offset={3}>
            <ExploreFilterContent
              readOnly={false}
              visible={true}
              onRef={childRef}
              originType={originType}
            />
          </Col>
        </Row>
        <Divider orientation="left" orientationMargin={16}>
          分组设置
        </Divider>
        <Form name="group">
          <Form.Item
            labelCol={{ span: 3 }}
            wrapperCol={{ span: 20 }}
            name={"groupBy"}
            label="Group by"
          >
            <Select />
          </Form.Item>
        </Form>
      </div>
      <div className="pdb-indicator-simple-footer">
        <Button type="primary" onClick={handleTryCompute}>试计算</Button>
        <Space size={16}>
          <Button onClick={handleBack}>关闭</Button>
          <Button type="primary" onClick={onSubmit}>保存</Button>
        </Space>
      </div>
    </div>
    </>
  );
}
