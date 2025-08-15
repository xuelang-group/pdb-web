import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Col,
  Divider,
  Flex,
  Form,
  Input,
  message,
  Modal,
  notification,
  Popover,
  Radio,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  LeftOutlined,
  PlusOutlined,
  SmallDashOutlined,
} from "@ant-design/icons";
import {
  compact,
  filter,
  find,
  get,
  isArray,
  isEmpty,
  map,
  toNumber,
} from "lodash";
import dayjs from "dayjs";
import moment from "moment";
import ExploreFilterContent from "@/pages/AppExplore/ExploreFilterContent";
import { StoreState } from "@/store";
import {
  getAdapterTypeHistory,
  getAdapterTypeList,
  getBuzProcess,
} from "@/actions/adapter";
import {
  addMetric,
  checkVersion,
  getFuncResult,
  getMetricDetail2,
  getMetricReference,
  getMetrics,
  updateMetric,
} from "@/actions/indicator";
import { AttrConfig, TypeConfig } from "@/reducers/type";
import {
  clearQuery,
  ConditionState,
  CsvHeaderState,
  ParamsState,
  PqlState,
} from "@/reducers/query";
import {
  functionSymbolMap,
  funcOptionsObj,
  optionLabelMap,
  optionSymbolMap,
  typeIconMap,
  getConditionRaw,
} from "@/utils/common";
import { operators } from "../AppExplore/ExploreFilter";
import { getImgHref } from "@/actions/minioOperate";
import Loading from "@/assets/images/loading-apng.png";
import { exit, setMetrics, setEditId } from "@/reducers/indicator";
import { exitSimple, MetricItem, setCalc, setReadonly, updateCurrent } from "@/reducers/indicatorSimple";
import VersionHeader from "./components/VersionHeader";

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
  attr: { value: string; label: any; data: any };
  condition: { value: any; label: any };
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
  const [metricForm] = Form.useForm();
  const [modal, contextHolder] = Modal.useModal();
  
  const checkId = useSelector((state: StoreState) => state.indicator.checkId);
  const current = useSelector(
    (state: StoreState) => state.indicatorSimple.current
  );
  const checkVersionList = useSelector(
    (state: StoreState) => state.indicator.checkVersionList
  );
  const calc = useSelector((state: StoreState) => state.indicatorSimple.calc);
  const readonly = useSelector((state: StoreState) => state.indicatorSimple.readonly);
  const requestId = useSelector(
    (state: StoreState) => state.indicator.requestId
  );
  const currentBuzProcess = useSelector(
    (state: StoreState) => state.indicator.currentBuzProcess
  );
  const types = useSelector((state: StoreState) => state.type.data);
  const api = useSelector((state: StoreState) => state.query.api);

  const [open, setOpen] = useState(false);
  const [typeList, setTypeList] = useState<TypeConfig[]>([]); // 数据资产单选项
  const [processOptions, setProcessOptions] = useState([]);
  const [buzProcessArr, setBuzProcessArr] = useState([]);
  const [dimension, setDimension] = useState<CsvHeaderState>(); // 指标度量
  const [funcOptions, setfuncOptions] = useState<string[]>(); // 统计算法选项
  const [originType, setOriginType] = useState<OriginType>(); // 选中的数据资产单数据
  const [groupOptions, setGroupOptions] = useState<CsvHeaderState[]>([]); // GroupBy 的选项

  const updateBuzProcess = (strArr: string[]) => {
    if (requestId) {
      getBuzProcess(
        { requestId: requestId, xTypeNames: strArr },
        (success: boolean, res: any) => {
          if (success) {
            setBuzProcessArr(res.data || []);
            setProcessOptions(
              (res.data || []).map((item: any) => ({
                label: item?.name || item,
                value: item?.id || item,
              }))
            );
          }
        }
      );
    }
  }

  useEffect(() => {
    const pql = get(current, "pql_params.params.pql");
    const strArr: string[] = [];
    pql?.forEach((item: any) => {
      if (isArray(item)) {
        item.forEach((subItem: any) => {
          if (subItem.id) {
            strArr.push(subItem.id);
          }
        });
      }
    });
    updateBuzProcess(strArr);
  }, [requestId, current?.pql_params]);

  useEffect(() => {
    if (requestId) {
      getAdapterTypeList({ requestId }, (success: boolean, response: any) => {
        if (success) {
          const typeList = get(response, "data", []);
          if (!isEmpty(typeList)) {
            setTypeList(compact(typeList));
          } else {
            getAdapterTypeHistory(
              { requestId },
              (success: boolean, response: any) => {
                setTypeList(get(response, "data", []));
                if (!success) {
                  notification.error({
                    message: "获取对象类型列表失败",
                    description: response.message || response.msg,
                  });
                }
              }
            );
          }
        } else {
          notification.error({
            message: "获取对象类型列表失败",
            description: response.message || response.msg,
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
      const { name, name_cn, unit, desc, version, metric_params, pql_params } = current;
      !isEmpty(types) && reverseParsing(pql_params.params);
      const dimension = metric_params.dimension.name;
      const csvHeader = get(pql_params, "params.csv.header", []);
      const columns = map(csvHeader, "attrId");
      const index = columns.indexOf(dimension);
      if (index > -1) {
        columns.splice(index, 1);
      }
      const _dimension = find(csvHeader, { attrId: dimension });
      setDimension(_dimension);
      const attrType = get(_dimension, "attrType", "");
      const funcs = get(funcOptionsObj, attrType, []);
      setfuncOptions(funcs);
      setGroupOptions(filter(csvHeader, ({attrId}) => columns.includes(attrId)));
      const typeId = csvHeader[0].typeId;
      form.setFieldsValue({
        name,
        name_cn,
        unit,
        desc,
        version,
        buzProcess: currentBuzProcess?.id,
      });
      metricForm.setFieldsValue({
        dimension,
        func: metric_params.func,
        groupBy: !isEmpty(metric_params.group_by) ? map(metric_params.group_by, "name") : [''],
        columns,
        typeName: typeId,
      });
    } else {
      // 创建初级指标
      form.resetFields();
      metricForm.resetFields();
      setDimension(undefined);
    }
  }, [current?.id]);

  useEffect(() => {
    if (!requestId) {
      setTypeList(types);
    }
    if (current && !isEmpty(types)) {
      reverseParsing(current.pql_params.params);
    }
  }, [types]);

  const handleBack = () => {
    dispatch(exit());
    dispatch(clearQuery())
    dispatch(exitSimple())
    form.resetFields();
    metricForm.resetFields();
    navigate(`/${routerParams.id}/indicator/index`);
  };

  const reverseParsing = (queryParams: ParamsState) => {
    const { pql, csv } = queryParams;
    const typeId = get(csv.header[0], "typeId");
    const detail = find(types, { ["x.type.name"]: typeId });
    if (!detail) {
      message.warning("未找到相关的数据资产单");
      return;
    }
    const originTypes = map(
      pql[0],
      function (
        { id, name, type, conditions, conditionRaw, ...other }: any,
        index
      ) {
        const conditionOptions: ConditionOption[] = [];
        let conditionLabel = "";
        const typeDetail = find(types, { ["x.type.name"]: id });
        const attrs = compact(get(typeDetail, "x.type.attrs", []));
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
                data: attrData,
              },
              condition = {
                value: functionVal,
                label: get(optionLabelMap, functionVal),
              },
              isNot = val.not,
              operator = val.connectives;

            let keyword = val.value,
              keywordLabel = val.value;
            if (attrData.type === "datetime") {
              keywordLabel = moment(keyword).format(attrData.datetimeFormat);
              keyword = dayjs(keywordLabel, attrData.datetimeFormat);
            }

            conditionOptions.push({
              attr,
              condition,
              isNot,
              keyword,
              operator,
            });

            if (functionVal === "has") {
              conditionLabel += `存在属性 ${attrLabel}`;
            } else {
              const label =
                (functionVal === "anyofterms" || functionVal === "allofterms"
                  ? optionLabelMap[functionVal]
                  : optionSymbolMap[functionVal]) || "";
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
            index: 0,
          })),
          data: typeDetail,
          config: {
            conditions,
            key: conditionRaw,
            options: conditionOptions,
            label: conditionLabel,
          },
        };
      }
    );
    const _originType = originTypes[0];
    setOriginType(_originType);
  };

  // 指标度量选择
  const handleDimensionChange = (value: string) => {
    const dimension = find(originType?.csv, { attrId: value });
    const attrType = get(dimension, "attrType", "");
    const funcs = get(funcOptionsObj, attrType, []);
    setfuncOptions(funcs);
    setDimension(dimension);
  };

  // 数据资产单选择后，根据选中的x.type.name，设置query
  const handleTypeNameChange = (value: string) => {
    const detail = find(typeList, { "x.type.name": value });
    if (!detail) {
      message.warning("未找到相关的数据资产单");
      return;
    }
    const attrs = compact(detail["x.type.attrs"]);
    const csv = map(attrs, ({ display, name, type }: AttrConfig) => ({
      typeId: detail["x.type.name"],
      attrId: name,
      attrName: display,
      attrType: type,
      index: 0,
    }));
    setOriginType({
      label: detail["x.type.label"],
      value: detail["x.type.name"],
      key: detail["x.type.name"],
      type: "type",
      data: { ...detail },
      prevSearchTagType: "",
      csv,
    });
    setGroupOptions([]);
    metricForm.setFieldsValue({
      dimension: '',
      func: '',
      columns: [],
      groupBy: ['']
    })
    updateBuzProcess([detail["x.type.name"]])
  };

  const handleColumnsChange = (values: string[]) => {
    const cols = filter(originType?.csv, ({attrId}) => values.includes(attrId))
    console.log('--- columns: ', cols)
    setGroupOptions(cols)
  }

  const handleFilterOptions = (filterOptions: any) => {
    let filterLabel = "",
      filterKey = "",
      conditions: any = [];
    if (filterOptions && filterOptions.length > 0) {
      filterOptions.forEach((opt: any, index: number) => {
        const condition = get(opt, "condition.value", ""),
          attrLabel = get(opt, "attr.label"),
          attrValue = get(opt, "attr.value");
        let keyword = get(opt, "keyword", "");
        if (typeof keyword === "object") {
          keyword = keyword.format("YYYY-MM-DD")
        }
        let conditionDetail = {};
        if (index > 0) {
          filterLabel += `${operators[opt.operator]} `;
          filterKey += `${opt.operator} `;
          Object.assign(conditionDetail, {
            connectives: opt.operator,
          });
        }
        let raw = "";
        if (condition === "has") {
          filterLabel += `存在属性 ${attrLabel}`;
          raw += `HAS ${attrValue}`;
        } else {
          const conditionLabel =
            (condition === "anyofterms" || condition === "allofterms"
              ? optionLabelMap[condition]
              : optionSymbolMap[condition]) || "";
          filterLabel += `${opt.isNot ? "NOT " : ""}${attrLabel} ${conditionLabel} ${keyword}`;
          raw += `${opt.isNot ? "NOT " : ""}${attrValue} ${optionSymbolMap[condition] || ""} ${typeof get(opt, "keyword", "") === "string" ? `'${keyword}'` : keyword}`;
        }
        Object.assign(conditionDetail, {
          // raw,
          name: attrValue,
          function: optionSymbolMap[condition] || "",
          value: keyword,
          not: opt.isNot,
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
      options: filterOptions,
    };
  };

  // 数据筛选条件
  const getFilterConfig = function () {
    const { filterOptions } = childRef.current as any;
    const config = handleFilterOptions(filterOptions);
    // console.log("--- get: ", config);
    return config;
  };

  // const onFilterSave = function(filterOptions: any) {
  //   const config = handleFilterOptions(filterOptions)
  //   console.log('=== get: ', config)
  // }

  const getPqlParams = () => {
    const columns = metricForm.getFieldValue("columns");
    const config = getFilterConfig();
    const detail = originType?.data;
    const pql = [
      [
        {
          type: "object",
          conditionRaw: get(config, "key", ""),
          conditions: get(config, "conditions", []),
          id: detail?.["x.type.name"] || "",
          name: detail?.["x.type.label"] || "",
        },
      ],
    ];
    // 指标维度
    const csv = !originType?.csv
      ? []
      : originType?.csv.filter(({ attrId }) => columns.includes(attrId));
    // 加入度量列
    dimension && csv.push(dimension);
    return {
      api: api,
      params: {
        graphId: routerParams.id || "",
        pql,
        csv: {
          header: csv,
        },
      },
    };
  };

  const getMetricParams = () => {
    const func = metricForm.getFieldValue("func");
    const groupBy = metricForm.getFieldValue("groupBy");
    const groups = compact(
      filter(originType?.csv, ({ attrId }) => groupBy.includes(attrId))
    );
    return {
      dimension: {
        name: dimension?.attrId || "",
        name_cn: dimension?.attrName || "",
      },
      func,
      group_by: groups.map((attr: any) => ({
        name: attr.attrId,
        name_cn: attr.attrName,
      })),
    };
  };

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

  // 创建指标
  const handleAdd = (values: any) => {
    const savingModal = modal.confirm({
      className: "pdb-indicator-save-loading",
      width: 164,
      icon: <img src={getImgHref(Loading)} />,
      title: "指标保存中...",
    });
    if(values.buzProcess) {
      const buzProcess = buzProcessArr.find((item: any) => item.id === values.buzProcess)
      if(buzProcess) {
        values.buzProcess = buzProcess
      }
    }
    const params: MetricItem = {
      name_cn: values.name_cn,
      name: values.name,
      unit: values.unit || "",
      desc: values.desc || "",
      version: values.version,
      requestId: requestId,
      buzProcess: values.buzProcess,
      type: 1,
      ori_id: current?.ori_id,
      metric_params: getMetricParams(),
      pql_params: getPqlParams(),
    };
    addMetric(params, (success: boolean, res: any) => {
      savingModal && savingModal.destroy();
      if (success) {
        message.success("保存指标成功");
        updateList();
        handleBack();
      } else {
        message.error("保存指标失败：" + res.message || res.msg);
      }
    });
  };

  // 编辑指标
  const handleUpdate = (data: any) => {
    updateMetric(data, (success: boolean, res: any) => {
      if (success) {
        message.success("编辑指标成功");
        updateList();
        handleBack();
      } else {
        message.error("编辑指标失败：" + res.message || res.msg);
      }
    });
  };

  // 保存
  const onSubmit = () => {
    form.validateFields().then((values) => {
      metricForm.validateFields().then(async() => {
        if (current?.ori_id) {
          const { data } = await getMetricReference(current?.ori_id)
          if (data.success && !isEmpty(data.data)) {
            const names = map(data.data, 'name')
            confirm({
              title: '提示',
              content: `本指标被 ${names.join('、')} 指标引用，是否确定要继续保存？`,
              onOk: function() {
                handleAdd(values)
              }
            })
            return
          }
        }
        handleAdd(values)
      })
      .catch(err => {
        console.log('--- err: ', err)
      })
    })
    .catch(err => {
      console.log('--- err: ', err)
    })
  };

  // 数据过量
  const [formExcess] = Form.useForm()
  const handleCalc = (total: number, params: any) => {
    const excess = total > 1000
    const options = [{value: -1, label: '全量'}, {value: 1000, label: '1000条'}, {value: 500, label: '500条'}, {value: 100, label: '100条'}]
    confirm({
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
        return getFuncResult(params, function(success: boolean, response: any) {
          if (success) {
            setOpen(true);
            dispatch(setCalc(response))
          } else {
            message.error(response.message || response.msg);
          }
          formExcess.resetFields()
        })
      },
    });
  };

  // 试计算
  const handleTryCompute = () => {
    const detail = originType?.data;
    if (current && !detail) {
      message.warning("未找到相关的数据资产单");
      return;
    }
    metricForm.validateFields().then((values) => {      
      const metric_params = getMetricParams()
      const pql_params = getPqlParams()
      dispatch(updateCurrent({metric_params, pql_params}))
      getFuncResult({
        metric_params,
        pql_params,
        cal_type: 2,
        metric_type: 1,
      }, function(success: boolean, response: any) {
        if (success) {
          const total = toNumber(response.total)
          const params = {
            metric_params,
            pql_params,
            cal_type: 1,
            metric_type: 1,
          }
          total > 100 ? handleCalc(total, params) : getFuncResult(params, function(success: boolean, response: any) {
            if (success) {
              setOpen(true);
              dispatch(setCalc(response))
            } else {
              message.error(response.message || response.msg);
            }
          })
        } else {
          message.error(response.message || response.msg);
        }
      })
    })
    .catch(err => {});
  };

  const renderColumnItem = (condition: ConditionState, item: CsvHeaderState) => {
    if (condition.function == "=") {
      const _symbol = condition.not ? '≠' : condition.function
      return (
        <div className="pdb-indicator-result-column" key={item.attrId}>
          <span className="tag">
            { item.attrName } {_symbol}
          </span>
          <span className="name">{condition.value}</span>
        </div>
      );
    }
    return (
      <div className="pdb-indicator-result-column" key={item.attrId}>
        <span className="tag">
          { item.attrName }
        </span>
        <span className="name">{item.attrName}</span>
      </div>
    );
  };

  const renderPopConditions = (conditions: ConditionState[], attrMap: {[prop: string]: CsvHeaderState}) => (
    <div className="pdb-indicator-conditions">
      {
        conditions.map((item: ConditionState, index: number) => {
          const label = attrMap[item.name]['attrName']
          const title = getConditionRaw(item, label)
          return (<Tag key={index}>{title}</Tag>)
        })
      }
    </div>
  )

  const renderPopColumns = (attrs: CsvHeaderState[], conditionMap: { [prop: string]: ConditionState[] }) => {
    return (
      <div className="pdb-indicator-columns">
        {attrs.map((item) => {
          return conditionMap[item.attrId] &&
            conditionMap[item.attrId].length == 1 ? (
            renderColumnItem(conditionMap[item.attrId][0], item)
          ) : (
            <div className="pdb-indicator-result-column" key={item.attrId}>
              <span className="tag">
                {conditionMap[item.attrId] ? "所选" : "所有"}
              </span>
              <span className="name">{item.attrName}</span>
            </div>
          );
        })}
      </div>
    )
  }

  const renderResultColumns = () => {
    const label = originType?.label
    const header = current?.pql_params.params.csv.header || []
    const attrs = map(filter(header, ({attrId}) => attrId !== calc?.dimension.name), item => ({...item, attrName: item.attrName.replace(`_${label}`, '')}));
    const pql = get(current, "pql_params.params.pql", [[]]);
    const conditions: ConditionState[] = pql[0][0]?.conditions;
    const dimension = get(current, "metric_params.dimension");
    const conditionMap: { [prop: string]: ConditionState[] } = {};
    const attrMap: {[prop: string]: CsvHeaderState} = {}
    conditions?.forEach((item: ConditionState) => {
      if (!conditionMap[item.name]) conditionMap[item.name] = [];
      conditionMap[item.name].push(item);
    });
    attrs.forEach(item => {
      attrMap[item.attrId] = item
    })
    const result = calc?.result[0];
    return (
      <>
        <Flex align="flex-end">
          {!isEmpty(attrs) &&
            attrs.slice(0, 3).map((item) => {
              return conditionMap[item.attrId] &&
                conditionMap[item.attrId].length == 1 ? (
                renderColumnItem(conditionMap[item.attrId][0], item)
              ) : (
                <div className="pdb-indicator-result-column" key={item.attrId}>
                  <span className="tag">
                    {conditionMap[item.attrId] ? "所选" : "所有"}
                  </span>
                  <span className="name">{item.attrName}</span>
                </div>
              );
            })}
          <Space>
            {
              !isEmpty(attrs) && (<>
                <Popover
                  content={renderPopColumns(attrs, conditionMap)}
                >
                  <Button type="text" size="small" icon={<SmallDashOutlined />} />
                </Popover>
                <span>的</span>
              </>)
            }
            <span>“{dimension && dimension.name_cn}” 为</span>
          </Space>
        </Flex>
        <Flex align="flex-end" className="pdb-indicator-result">
          <h4 className="result">{result?.value}</h4>
          <span className="unit">{current?.unit}</span>
        </Flex>
        {!isEmpty(conditions) && <div className="pdb-indicator-result-filter">
          {conditions.slice(0, 3).map((item: ConditionState, index: number) => {
            const label = attrMap[item.name]['attrName']
            const title = getConditionRaw(item, label)
            return (<Tag key={index}>{title}</Tag>)
          })}
          {conditions?.length > 3 && <Popover
            content={renderPopConditions(conditions, attrMap)}
          >
            <Button type="text" size="small" icon={<SmallDashOutlined />} />
          </Popover>}
        </div>}
      </>
    );
  };

  const isVersion = !isEmpty(checkVersionList)
  return (
    <>
      { !isVersion ?
        <div className="pdb-indicator-title">
          <Button
            className="pdb-indicator-back"
            type="text"
            size="small"
            icon={<LeftOutlined />}
            onClick={handleBack}
          />
          <Typography.Text>初级指标{current ? "编辑" : "创建"}</Typography.Text>
        </div> :
        <div style={{padding: '12px 24px 0', borderBottom: 'solid 1px var(--border-color2)'}}><VersionHeader /></div>
      }
      <div className="pdb-indicator-simple" style={{height: `calc(100% - ${isVersion ? 56 : 40}px)`}}>
        <div className="pdb-indicator-simple-body">
          <Divider orientation="left" orientationMargin={16}>
            基础信息
          </Divider>
          <Form name="simple" {...layout} form={form} disabled={readonly} initialValues={{version: '1.0.0'}}>
            <Flex wrap className="pdb-indicator-flex">
              <Form.Item
                label="中文名称"
                rules={[{ required: true, message: "请输入中文名称" }]}
                name={"name_cn"}
              >
                <Input placeholder="请输入中文名称" />
              </Form.Item>
              <Form.Item
                label="英文名称"
                rules={[{ required: true, message: "请输入英文名称" }]}
                name={"name"}
              >
                <Input placeholder="请输入英文名称" />
              </Form.Item>
              <Form.Item label="所属业务过程" name={"buzProcess"}>
                <Select
                  placeholder="请选择所属业务过程"
                  options={processOptions}
                />
              </Form.Item>
              <Form.Item label="相关业务过程">---</Form.Item>
              <Form.Item label="指标描述" name={"desc"}>
                <Input.TextArea placeholder="请输入指标描述" rows={3} />
              </Form.Item>
              <Form.Item
                label="版本号"
                name={"version"}
                rules={[
                  { required: true, message: '请输入版本号' },
                  {
                    validateTrigger: 'onBlur',
                    validator: async (_, value) =>
                    {
                      if (!value) return Promise.reject(new Error("请输入版本号"))
                      if(current?.id) {
                        const resD = await getMetricDetail2({id: current?.id})
                        if(resD.data) {
                          const res = await checkVersion({new_version: value, ori_id: resD.data?.ori_id})
                          if(res.data?.success) {
                            return Promise.resolve()
                          } else {
                            return Promise.reject(new Error(res.data?.message))
                          }
                        } else {
                          return Promise.reject(new Error(resD.data?.message))
                        }
                      } else {
                        const res = await checkVersion({new_version: value})
                        if(res.data?.success) {
                          return Promise.resolve()
                        } else {
                          return Promise.reject(new Error(res.data?.message))
                        }
                      }
                    }
                  },
                ]}
                tooltip="1.格式X.X.X，仅允许使用数字和.作为分隔符，不支持字母、特殊字符等。
                  2.不允许前导l零，如00.01.02是无效的，应改为0.1.2。"
              >
                <Input addonBefore="V" placeholder="仅允许数字以.为分隔符，例:1.0.0" />
              </Form.Item>
            </Flex>
          </Form>
          <Divider orientation="left" orientationMargin={16}>
            指标定义
          </Divider>
          <Form name="metric_params" {...layout} form={metricForm} disabled={readonly}>
            <Flex wrap className="pdb-indicator-flex">
              <Form.Item
                name={"typeName"}
                label="数据资产单"
                rules={[{ required: true }]}
              >
                <Select
                  placeholder="数据资产单"
                  options={map(typeList, (val) => ({
                    label: val["x.type.label"],
                    value: val["x.type.name"],
                  }))}
                  onChange={handleTypeNameChange}
                />
              </Form.Item>
              <Form.Item
                name={"dimension"}
                label="指标度量"
                rules={[{ required: true }]}
              >
                <Select
                  placeholder="请选择指标度量"
                  options={map(originType?.csv, (item) => ({
                    label: item.attrName,
                    value: item.attrId,
                    type: item.attrType,
                  }))}
                  optionRender={(opt) => (
                    <Space>
                      <i
                        className={`attr-type-icon iconfont icon-${typeIconMap[opt.data.type]}`}
                      />
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
                  placeholder="统计算法"
                  allowClear
                  options={map(funcOptions, (item) => ({
                    label: item,
                    value: item,
                  }))}
                />
              </Form.Item>
            </Flex>
            <Form.Item
              labelCol={{ span: 3 }}
              wrapperCol={{ span: 20 }}
              name={"columns"}
              label="指标维度"
            >
              <Select
                mode="multiple"
                allowClear
                options={map(originType?.csv, (item) => ({
                  label: item.attrName,
                  value: item.attrId,
                  type: item.attrType,
                  disabled: dimension?.attrId === item.attrId,
                }))}
                optionRender={(opt) => (
                  <Space>
                    <i
                      className={`attr-type-icon iconfont icon-${typeIconMap[opt.data.type]}`}
                    />
                    {opt.data.label}
                    {/* <Typography.Text type="secondary"> - {typeMap.type[opt.data.type]}</Typography.Text> */}
                  </Space>
                )}
                onChange={handleColumnsChange}
              />
            </Form.Item>
            <Form.Item
              labelCol={{ span: 3 }}
              wrapperCol={{ span: 20 }}
              label="Group by"
              colon={false}
              shouldUpdate
            >
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
                            options={map(groupOptions, (item) => ({
                                label: item.attrName,
                                value: item.attrId,
                                disabled: metricForm
                                  .getFieldValue("groupBy")
                                  ?.includes(item.attrId),
                              })
                            )}
                            onChange={(value) => {
                              metricForm.setFieldsValue({
                                groupBy: metricForm
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
                          onClick={() => {
                            if (index === 0 && fields.length === 1) {
                              metricForm.setFieldsValue({
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
                      {metricForm.getFieldValue("groupBy")?.[fields.length - 1] && (
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
          <Divider orientation="left" orientationMargin={16}>
            数据筛选
          </Divider>
          <Row style={{ marginBottom: 16 }}>
            <Col span={18} offset={3}>
              <ExploreFilterContent
                readOnly={readonly}
                visible={true}
                onRef={childRef}
                originType={originType}
                // onSave={onFilterSave}
              />
            </Col>
          </Row>
        </div>
        <div className="pdb-indicator-simple-footer">
          <Button type="primary" disabled={readonly} onClick={handleTryCompute}>
            试计算
          </Button>
          <Space size={16}>
            <Button onClick={handleBack}>关闭</Button>
            {
              readonly
              ? <Button block type="primary" onClick={() => {
                dispatch(setReadonly(false))
                dispatch(setEditId(checkId))
              }}>编辑指标</Button>
              : <Button type="primary" disabled={readonly} onClick={onSubmit}>{ current ? '更新指标' : '保存指标'}</Button>
            }
          </Space>
        </div>
      </div>
      <Modal
        open={open}
        title="计算结果"
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      >
        <Flex justify="space-between" className="pdb-indicator-result-header">
          <h4 className="title">
            {form.getFieldValue("name_cn")}
          </h4>
          <h4 className="title">
            业务域【{form.getFieldValue("buzProcess")}】
          </h4>
        </Flex>
        {renderResultColumns()}
      </Modal>
      { contextHolder }
    </>
  );
}
