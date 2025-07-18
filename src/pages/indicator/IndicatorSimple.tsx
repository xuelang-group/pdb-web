import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Col, Divider, Flex, Form, Input, message, Modal, notification, Radio, Row, Select, Space, Typography, } from "antd";
import { DeleteOutlined, ExclamationCircleOutlined, LeftOutlined, PlusOutlined } from "@ant-design/icons";
import { capitalize, compact, filter, find, get, isArray, isEmpty, map } from "lodash";
import dayjs from "dayjs";
import moment from "moment";
import ExploreFilterContent from "@/pages/AppExplore/ExploreFilterContent";
import { StoreState } from "@/store";
import { getAdapterTypeHistory, getAdapterTypeList, getBuzProcess } from "@/actions/adapter";
import { addMetric, getCsv, getFuncResult, getMetrics, updateMetric } from "@/actions/indicator";
import { AttrConfig, TypeConfig } from "@/reducers/type";
import { ConditionState, CsvHeaderState, initialParams, ParamsState, setQueryParams } from "@/reducers/query";
import {  functionSymbolMap, funcOptionsObj, optionLabelMap, optionSymbolMap, typeIconMap, typeMap } from '@/utils/common';
import { operators } from "../AppExplore/ExploreFilter";
import { getImgHref } from "@/actions/minioOperate";
import Loading from "@/assets/images/loading-apng.png";
import { setMetrics } from "@/reducers/indicator";
import { exit } from "@/reducers/indicatorSimple";

const { confirm } = Modal;

const layout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 16 },
};

interface OriginType {
  label: string;
  value: string;
  key: string;
  type: string;
  data?: TypeConfig;
  csv: CsvHeaderState[];
  prevSearchTagType: string;
  config?: {
    conditions: any[];
    key: string;
    options: any[];
    label: string;
  };
}

interface ConditionOption {
  attr: { value: string; label: any; data: any; };
  condition: { value: any; label: any; };
  isNot: boolean | undefined;
  keyword: any;
  operator: string | undefined;
}

export default function SimpleIndicator(props: any) {
  const childRef = React.createRef();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const routerParams = useParams();
  const [form] = Form.useForm();
  const [modal, contextHolder] = Modal.useModal();

  const current = useSelector((state: StoreState) => state.indicatorSimple.current);
  const requestId = useSelector((state: StoreState) => state.indicator.requestId);
  const currentBuzProcess = useSelector((state: StoreState) => state.indicator.currentBuzProcess);
  const types = useSelector((state: StoreState) => state.type.data)
  const typeMap = useSelector((state: StoreState) => state.editor.typeMap)
  const api = useSelector((state: StoreState) => state.query.api);

  const [open, setOpen] = useState(false);
  const [typeList, setTypeList] = useState<TypeConfig[]>([]);// 数据资产单选项
  const [processOptions, setProcessOptions] = useState([])
  const [buzProcessArr, setBuzProcessArr] = useState([])
  const [dimension, setDimension] = useState<CsvHeaderState>()      // 指标度量
  const [funcOptions, setfuncOptions] = useState<string[]>() // 统计算法选项
  const [originType, setOriginType] = useState<OriginType>() // 选中的数据资产单数据
  const [limit, setLimit] = useState(100)
  
  useEffect(() => {
    const pql = get(current, 'pql_params.params.pql')
    if(requestId && pql) {
      const strArr: string[] = []
      pql.forEach((item: any) => {
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
  }, [requestId, current?.pql_params])
  
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
    if (current) {
      // 编辑初级指标
      const { name, name_cn, unit, desc, metric_params, pql_params } = current
      !isEmpty(types) && reverseParsing(pql_params.params)
      const dimension = metric_params.dimension.name
      const csvHeader = get(pql_params, 'params.csv.header', [])
      const columns = map(csvHeader, 'attrId')
      const index = columns.indexOf(dimension)
      if (index > -1) {
        columns.splice(index, 1)
      }
      const _dimension = find(csvHeader, {attrId: dimension})
      setDimension(_dimension)
      const attrType = get(_dimension, 'attrType', '')
      const funcs = get(funcOptionsObj, attrType, [])
      setfuncOptions(funcs)
      const typeId = csvHeader[0].typeId
      form.setFieldsValue({
        name, name_cn, unit, desc,
        dimension,
        func: metric_params.func,
        groupBy: map(metric_params.group_by, 'name'),
        columns,
        typeName: typeId,
      })
    } else {
      // 创建初级指标
      form.resetFields()
      setDimension(undefined)
    }

  }, [current])
  
  useEffect(() => {
    if (!requestId) {
      setTypeList(types);
    }
    if (current && !isEmpty(types)) {
      reverseParsing(current.pql_params.params)
    }
  }, [types]);
  
  const handleBack = () => {
    dispatch(exit())
    form.resetFields()
    navigate(`/${routerParams.id}/indicator/index`)
  }

  const reverseParsing = (queryParams: ParamsState) => {
    const { pql, csv } = queryParams;
    const typeId = get(csv.header[0], 'typeId')
    const detail = find(types, {['x.type.name']: typeId})
    if (!detail) {
      message.warning('未找到相关的数据资产单')
      return
    }
    const originTypes = map(pql[0], function ({ id, name, type, conditions, conditionRaw, ...other }: any, index) {
      const conditionOptions: ConditionOption[] = [];
      let conditionLabel = "";
      const typeDetail = find(types, {['x.type.name']: id})
      const attrs = compact(get(typeDetail, "x.type.attrs", []))
      if (!isEmpty(conditionRaw) && typeDetail) {
        let attrMap: any = {};
        attrs.forEach((val: any) => {
          Object.assign(attrMap, { [val?.name]: val });
        });
        conditions.forEach((val: ConditionState) => {
          const attrName = val.name,
            functionVal = functionSymbolMap[val.function],
            attrLabel = get(attrMap[attrName], "display", ""),
            attrData = attrMap[attrName] || {};
          const attr = {
            value: attrName,
            label: attrLabel,
            data: attrData
          },
            condition = {
              value: functionVal,
              label: get(optionLabelMap, functionVal)
            },
            isNot = val.not,
            operator = val.connectives;

          let keyword = val.value, keywordLabel = val.value;
          if (attrData.type === "datetime") {
            keywordLabel = moment(keyword).format(attrData.datetimeFormat);
            keyword = dayjs(keywordLabel, attrData.datetimeFormat);
          }

          conditionOptions.push({
            attr, condition, isNot, keyword, operator
          });

          if (functionVal === "has") {
            conditionLabel += `存在属性 ${attrLabel}`;
          } else {
            const label = (functionVal === "anyofterms" || functionVal === "allofterms" ? optionLabelMap[functionVal] : optionSymbolMap[functionVal]) || ""
            conditionLabel += `${val.not ? "NOT " : ""}${attrLabel} ${label} ${keywordLabel}`;
          }
        });
      }
      return {
        key: typeId,
        value: id,
        type: type === "object" ? "type" : type,
        prevSearchTagType: "",
        label: name,
        csv: map(attrs, ({ display, name, type }: AttrConfig) => ({
          typeId: id,
          attrId: name,
          attrName: display,
          attrType: type,
          index: 0
        })),
        data: typeDetail,
        config: {
          conditions,
          key: conditionRaw,
          options: conditionOptions,
          label: conditionLabel
        }
      }
    })
    const _originType = originTypes[0]
    setOriginType(_originType)
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

  const getPqlParams = () => {
    const columns = form.getFieldValue('columns')
    const config = getFilterConfig()
    const detail = originType?.data
    const pql = [[{
      type: "object",
      conditionRaw: get(config, "key", ""),
      conditions: get(config, "conditions", []),
      id: detail?.['x.type.name'],
      name: detail?.['x.type.label'],
    }]]
    // 指标维度
    const csv = filter(originType?.csv, ({attrId}) => columns.includes(attrId))
    // 加入度量列
    dimension && csv.push(dimension)
    return {
      api: api,
      params: {
        graphId: routerParams.id || '',
        pql,
        csv: {
          header: csv
        }
      }
    }
  }

  const getMetricParams = () => {
    const func = form.getFieldValue('func')
    const groupBy = form.getFieldValue('groupBy')
    const groups = filter(originType?.csv, ({attrId}) => groupBy.includes(attrId))
    return {
      dimension: { name: dimension?.attrId, name_cn: dimension?.attrName },
      func,
      groupBy: map(groups, (attr: CsvHeaderState) => ({ name: attr.attrId, name_cn: attr.attrName})),
    }
  }
  
  const updateList = (callback?: Function) => {
    getMetrics(function (response: any) {
      if (response) {
        dispatch(setMetrics(response || []));
      } else {
        message.error('获取列表数据失败：' + response.message || response.msg);
      }
      callback && callback()
    })
  }

  // 创建指标
  const handleAdd = (data: any) => {    
    const savingModal = modal.confirm({
      className: "pdb-indicator-save-loading",
      width: 164,
      icon: (<img src={getImgHref(Loading)} />),
      title: "指标保存中..."
    });
    addMetric(data, (success: boolean, res: any) => {
      if (success) {
        message.success('保存指标成功')
        updateList()
      } else {
        message.error('保存指标失败：' + res.message || res.msg);
        savingModal && savingModal.destroy();
      }
    })
  }

  // 编辑指标
  const handleUpdate = (data: any) => {
    updateMetric(data, (success: boolean, res: any) => {
      if (success) {
        message.success('编辑指标成功');
        updateList()
      } else {
        message.error('编辑指标失败：' + res.message || res.msg);
      }
    })
  }

  // 保存
  const onSubmit = () => {
    form.validateFields().then((values) => {
      const params = {
        name_cn: values.name_cn,
        name: values.name,
        unit: values.unit || '',
        desc: values.desc || '',
        type: 1,
        metric_params: getMetricParams(),
        pql_params: getPqlParams(),
      }
      !current ? handleAdd({
        ...params,
        requestId: requestId,
        buzProcess: values.buzProcess,
      }) : handleUpdate({
        ...params,
        id: current.id,
      })
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

  // 试计算
  const handleTryCompute = () => {
    form.validateFields().then(values => {      
      const detail = originType?.data
      if (!detail) {
        message.warning('未找到相关的数据资产单')
        return
      }
      const metric_params = getMetricParams()
      getFuncResult({
        ...metric_params,
        pql_params: getPqlParams()
      }, function(success: boolean, response: any) {
        if (success) {
          console.log('--- 试计算结果：', response)
        } else {
          message.error('获取列表数据失败：' + response.message || response.msg);
        }
      })
    })
    // handleExcess()
  }

  return (
    <>
    <div className="pdb-indicator-title">
      <Button className="pdb-indicator-back" type="text" size="small" icon={<LeftOutlined />} onClick={handleBack} />
      <Typography.Text>初级指标{current ? '编辑' : '创建'}</Typography.Text>
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
          <Form.Item
            labelCol={{ span: 3 }}
            wrapperCol={{ span: 20 }}
            label='Group by'
            colon={false}
            shouldUpdate
          >
            <Form.List
              name="groupBy"
            >
              {(fields, { add, remove }, { errors }) => (
                <>
                  {fields.map((field, index) => (
                    <Form.Item
                      label={''}
                      required={false}
                      key={field.key}
                      style={{marginBottom: 12}}
                    >
                      <Form.Item
                        {...field}
                        noStyle
                      >
                        <Select
                          placeholder='请选择'
                          options={
                            map(originType?.csv, (item) => ({
                              label: item.attrName,
                              value: item.attrId,
                              disabled: form.getFieldValue('groupBy')?.includes(item.attrId) }))
                          }
                          onChange={(value) => {
                            form.setFieldsValue({
                              groupBy: form.getFieldValue('groupBy').map((item: any, i: number) => {
                                if (i === index) {
                                  return value
                                }
                                return item
                              })
                            })
                          }}
                          className="pdb-select-group-by"
                        />
                      </Form.Item>
                      { fields.length > 1 && (
                        <DeleteOutlined
                          className="dynamic-delete-button"
                          onClick={() => remove(field.name)}
                          style={{ marginLeft: 8 }}
                        />
                      )}
                    </Form.Item>
                  ))}
                  <Form.Item>
                    {form.getFieldValue('groupBy')?.[fields.length - 1] && <Button block
                      type="dashed"
                      onClick={() => add()}
                      style={{ width: '100%' }}
                      icon={<PlusOutlined />}
                    />}
                    <Form.ErrorList errors={errors} />
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>
        </Form>
        <Divider orientation="left" orientationMargin={16}>
          数据筛选
        </Divider>
        <Row style={{marginBottom: 16}}>
          <Col span={18} offset={3}>
            <ExploreFilterContent
              readOnly={false}
              visible={true}
              onRef={childRef}
              originType={originType}
            />
          </Col>
        </Row>
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
