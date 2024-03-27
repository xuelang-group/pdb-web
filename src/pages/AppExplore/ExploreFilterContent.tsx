import { Card, DatePicker, Empty, Form, Input, InputNumber, Radio, Select, Switch, Tag } from "antd";
import locale from 'antd/es/date-picker/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import _ from "lodash";
import { useImperativeHandle, useState } from "react";

import { commonOptionKeys, conditionOptionMap, optionLabelMap, optionSymbolMap } from "@/utils/common";

interface ExploreFilterProps {
  originType: any
  onRef: any
  configForm: any
  isNew: boolean
  setIsNew: Function
  editConditionIndex: number
  setEditConditionIndex: Function
  onSave?: Function
}

const operators: any = {
  "AND": "与",
  "OR": "或"
};

export default function ExploreFilterContent(props: ExploreFilterProps) {
  const { originType, configForm, isNew, setIsNew, editConditionIndex, setEditConditionIndex, onSave } = props;

  const [filterOptions, setFilterOption] = useState<any>(_.get(originType, 'config.options', [])),
    [activePanelKey, setActivePanelKey] = useState<any[] | any>([]),
    [editCondition, setEditCondition] = useState<any>(null);
  const tagType: string = _.get(originType, 'type', ''),
    data: any = _.get(originType, 'data');
  let attrs = JSON.parse(JSON.stringify(data[tagType === 'type' ? "x.type.attrs" : "r.type.constraints"]));
  if (tagType === 'relation') {
    delete attrs['r.binds'];
    delete attrs['r.constraints'];
    attrs = Object.values(attrs);
  }

  //用useImperativeHandle暴露一些外部ref能访问的属性
  useImperativeHandle(props.onRef, () => {
    // 需要将暴露的接口返回出去
    return {
      filterOptions,
      isNew,
      editConditionIndex,
      setIsNew,
      setActivePanelKey,
      setEditCondition,
    };
  });

  const handleCancel = function () {
    setActivePanelKey([]);
    setEditCondition(null);
    setEditConditionIndex(-1);
    if (isNew) setIsNew(false);
    configForm.resetFields();
  }

  const handleSave = function () {
    configForm.validateFields().then((values: any) => {
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
      onSave && onSave(_filterOption);
    }).catch(() => { });
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
    <div className="pdb-explore-filter-content">
      {filterOptions.map((opt: any, index: number) => {
        const condition = _.get(opt, 'condition.value', ""),
          label = _.get(opt, 'attr.label');
        let title;
        if (condition === "has") {
          title = `${opt.isNot ? "NOT " : ""}存在属性 ${label}`
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
  )
}