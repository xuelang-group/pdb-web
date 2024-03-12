import { commonOptionKeys, conditionOptionMap, optionLabelMap, optionSymbolMap } from "@/utils/common";
import { Button, Card, DatePicker, Empty, Form, Input, InputNumber, Radio, Select, Switch, Tag } from "antd";
import locale from 'antd/es/date-picker/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import _ from "lodash";
import { useState } from "react";
import { typeLabelMap } from ".";

interface ExploreFilterProps {
  originType: any
  saveConfig: Function
  close: Function
}

const operators: any = {
  "AND": "与",
  "OR": "或"
};

export default function ExploreFilter(props: ExploreFilterProps) {
  const { originType, saveConfig, close } = props;
  const [configForm] = Form.useForm();

  const [filterOptions, setFilterOption] = useState<any>(_.get(originType, 'config.options', [])),
    [isNew, setIsNew] = useState(false),
    [activePanelKey, setActivePanelKey] = useState<any[] | any>([]),
    [editConditionIndex, setEditConditionIndex] = useState(-1),
    [editCondition, setEditCondition] = useState<any>(null);
  const tagType: string = _.get(originType, 'type', ''),
    data: any = _.get(originType, 'data');
  let attrs = JSON.parse(JSON.stringify(data[tagType === 'type' ? "x.type.attrs" : "r.type.constraints"]));
  if (tagType === 'relation') {
    delete attrs['r.binds'];
    delete attrs['r.constraints'];
    attrs = Object.values(attrs);
  }

  const handleCancel = function () {
    setActivePanelKey([]);
    setEditCondition(null);
    setEditConditionIndex(-1);
    if (isNew) setIsNew(false);
    configForm.resetFields();
  }

  const handleSave = function () {
    configForm.validateFields().then(values => {
      const { isNot, operator, keyword } = values;
      const _filterOption = JSON.parse(JSON.stringify(filterOptions));
      const _config = {
        ...editCondition,
        isNot,
        operator,
        keyword
      };
      if (isNew) {
        _filterOption.push(_config);
      } else {
        _filterOption[editConditionIndex] = _config;
      }

      setFilterOption(_filterOption);
      handleCancel();
    }).catch(err => { });
  }

  const hanldeDelete = function (index: number) {
    const _filterOption = JSON.parse(JSON.stringify(filterOptions));
    _filterOption.splice(index, 1);
    setFilterOption(_filterOption);
  }

  const getExtra = (key: any, opt: any) => (
    <span>
      <i
        className={"spicon " + (activePanelKey[0] === key ? "icon-baocun1" : "icon-shanchu2")}
        onClick={() => (activePanelKey[0] === key ? handleSave() : hanldeDelete(key))}
      ></i>
      <i
        className={"spicon " + (activePanelKey[0] === key ? "icon-guanbi" : "icon-bianji")}
        onClick={() => {
          if (activePanelKey[0] === key) {
            handleCancel();
          } else {
            configForm.setFieldsValue(opt);
            setActivePanelKey([key]);
            setEditCondition(opt);
            setEditConditionIndex(key === "new" ? -1 : key);
          }
        }}></i>
    </span>
  );

  const renderPanelChildren = () => {
    return (
      <Form form={configForm} layout="vertical" className="pdb-explore-filter-config">
        {(editConditionIndex > 0 || (isNew && filterOptions.length > 0)) &&
          <Form.Item name="operator" label="">
            <Radio.Group>
              {Object.keys(operators).map(key => (
                <Radio value={key}>{operators[key]}</Radio>
              ))}
            </Radio.Group>
          </Form.Item>
        }
        <Form.Item name={["attr", "value"]} rules={[{ required: true, message: "" }]} label="类型属性">
          <Select
            showSearch
            options={attrs.map((attr: any) => ({
              value: attr.name,
              label: attr.display,
              data: attr
            }))}
            style={{ width: '100%' }}
            onChange={(_, option) => setEditCondition({ ...editCondition, attr: option })}
            onClick={event => event.stopPropagation()}
            onKeyDown={event => event.stopPropagation()}
            filterOption={(input, option: any) =>
            ((option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase()) ||
              (option?.value ?? '').toString() === input)
            }
          >
          </Select>
        </Form.Item>
        <Form.Item
          label="属性条件"
          shouldUpdate={(prevValue, curValue) =>
            _.get(prevValue, "condition.value") !== _.get(curValue, "condition.value") ||
            _.get(prevValue, "attr.value") !== _.get(curValue, "attr.value")
          }>
          {({ getFieldValue, setFieldValue }) => {
            const condition = getFieldValue(["condition", "value"]),
              attrType = _.get(editCondition, 'attr.data.type', '');
            const selectContent = (
              <Select
                className="pdb-explore-filter-config-attr"
                options={_.get(conditionOptionMap, attrType, commonOptionKeys).map((condition: string) => ({
                  value: condition,
                  label: optionLabelMap[condition]
                }))}
                onSelect={(_, option) => {
                  setEditCondition({ ...editCondition, condition: option });
                }}
                onClick={event => event.stopPropagation()}
                onKeyDown={event => event.stopPropagation()}
              >
                {_.get(conditionOptionMap, attrType, []).map((condition: string) => (
                  <Select.Option value={condition}>{optionLabelMap[condition]}</Select.Option>
                ))}
              </Select>
            );

            const renderConditionInput = function () {
              let input = null;
              switch (attrType) {
                case "int":
                  input = (
                    <InputNumber
                      className="pdb-explore-filter-config-condition"
                      precision={0}
                      onClick={event => event.stopPropagation()}
                      onMouseDown={event => event.stopPropagation()}
                      onKeyDown={event => event.stopPropagation()}
                    />
                  );
                  break;
                case "float":
                  input = (
                    <InputNumber
                      className="pdb-explore-filter-config-condition"
                      onClick={event => event.stopPropagation()}
                      onMouseDown={event => event.stopPropagation()}
                      onKeyDown={event => event.stopPropagation()}
                    />
                  );
                  break;
                case "boolean":
                  input = (
                    <Select
                      options={[{
                        label: "True",
                        value: "true"
                      }, {
                        label: "False",
                        value: "false"
                      }]}
                      className="pdb-explore-filter-config-condition"
                      onClick={event => event.stopPropagation()}
                      onMouseDown={event => event.stopPropagation()}
                    ></Select>
                  );
                  break;
                case "datetime":
                  if (typeof getFieldValue("keyword") !== "object") {
                    setFieldValue("keyword", null);
                  }
                  input = (
                    <DatePicker locale={locale} />
                  );
                  break;
                default:
                  input = (
                    <Input
                      className="pdb-explore-filter-config-condition"
                      onClick={event => event.stopPropagation()}
                      onMouseDown={event => event.stopPropagation()}
                      onKeyDown={event => event.stopPropagation()}
                    />
                  )
                  break;
              }
              return input;
            }
            if (condition === "has") {
              return (
                <Form.Item name={["condition", "value"]} rules={[{ required: true, message: "" }]} noStyle>
                  {selectContent}
                </Form.Item>
              )
            }
            return (
              <div className="pdb-explore-filter-config-combination" style={{ display: 'flex' }}>
                <Form.Item name={["condition", "value"]} rules={[{ required: true, message: "" }]} noStyle>
                  {selectContent}
                </Form.Item>
                <Form.Item name="keyword" rules={[{ required: true, message: "" }]} noStyle>
                  {renderConditionInput()}
                </Form.Item>
              </div>
            )
          }}
        </Form.Item>

        <Form.Item name="isNot" label="不具备条件(NOT) :" className="pdb-explore-filter-isNot">
          <Switch />
        </Form.Item>
      </Form >
    )
  }

  return (
    <div className="pdb-explore-filter">
      <div className="pdb-explore-filter-header">
        <span>过滤条件 - {typeLabelMap[tagType]}</span>
        <i className="spicon icon-guanbi" onClick={() => close()}></i>
      </div>
      <div className="pdb-explore-filter-content">
        {filterOptions.map((opt: any, index: number) => {
          const condition = _.get(opt, 'condition.value', ""),
            label = _.get(opt, 'attr.label');
          let title;
          if (condition === "has") {
            title = `存在属性 ${label}`
          } else {
            let keyword = _.get(opt, 'keyword', "");
            if (typeof keyword === "object") {
              keyword = keyword.format("YYYY-MM-DD");
            }
            const conditionLabel = (condition === "anyofterms" || condition === "allofterms" ? optionLabelMap[condition] : optionSymbolMap[condition]) || ""
            title = `${opt.isNot ? "NOT " : ""}${label} ${conditionLabel} ${keyword}`;
          }
          return (
            <>
              {index > 0 &&
                <div className="pdb-explore-filter-connection">
                  <Tag color="volcano">{operators[opt.operator]}</Tag>
                </div>
              }
              <Card
                size="small"
                extra={getExtra(index, opt)}
                title={title}
              >
                {activePanelKey[0] === index ? renderPanelChildren() : null}
              </Card>
            </>
          )
        })}
        {filterOptions.length === 0 && !isNew &&
          <Empty description="暂无过滤条件" />
        }
        {isNew &&
          <Card
            size="small"
            extra={getExtra("new", {})}
            title="新建属性条件"
            style={filterOptions.length === 0 ? {} : { marginTop: "1rem" }}
          >
            {renderPanelChildren()}
          </Card>
        }
      </div>
      <div className="pdb-explore-filter-add">
        <Button
          icon={<i className="spicon icon-add"></i>}
          onClick={() => {
            configForm.resetFields();
            const initalValue = {
              condition: {
                value: "has",
                label: optionLabelMap["has"]
              }
            }
            if (filterOptions.length > 0) {
              Object.assign(initalValue, { operator: "AND" });
            }
            setEditCondition(initalValue);
            configForm.setFieldsValue(initalValue);
            setActivePanelKey(["new"]);
            setIsNew(true);
          }}
          disabled={isNew || (editConditionIndex > -1)}
        >添加条件</Button>
        <Button
          type="primary"
          icon={<i className="spicon icon-baocun1"></i>}
          onClick={() => {
            let filterLabel = "", filterKey = "", conditions: any = [];
            if (filterOptions && filterOptions.length > 0) {
              // filterLabel = " (";
              // filterKey = "(";
              filterOptions.forEach((opt: any, index: number) => {
                const condition = _.get(opt, 'condition.value', ""),
                  attrLabel = _.get(opt, 'attr.label'),
                  attrValue = _.get(opt, 'attr.value');
                let keyword = _.get(opt, 'keyword', ""),
                  keywordValue = keyword;
                if (typeof keyword === "object") {
                  keyword = keyword.format("YYYY-MM-DD HH:mm:ss");
                  keywordValue = new Date(keywordValue).getTime();
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
                  raw += `${opt.isNot ? "NOT " : ""}${attrValue} ${optionSymbolMap[condition] || ""} ${typeof _.get(opt, 'keyword', "") === "string" ? `'${keywordValue}'` : keywordValue}`;
                }
                Object.assign(conditionDetail, {
                  raw,
                  name: attrValue,
                  function: optionSymbolMap[condition] || "",
                  value: keywordValue
                });
                conditions.push(conditionDetail);
                filterKey += raw;
                if (index < filterOptions.length - 1) {
                  filterLabel += " ";
                  filterKey += " ";
                } else {
                  // filterLabel += ")";
                  // filterKey += ")";
                }
              });
            }
            saveConfig({
              key: filterKey,
              label: filterLabel,
              conditions,
              options: filterOptions
            });
          }}
          disabled={isNew || (editConditionIndex > -1)}
        >保存配置</Button>
      </div>
    </div>
  )
}