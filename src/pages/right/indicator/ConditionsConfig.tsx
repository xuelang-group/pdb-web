import { Fragment, useEffect, useState } from "react";
import { Button, Card, DatePicker, Empty, Form, Input, InputNumber, Modal, Radio, Select, Space, Switch, Tag } from "antd";
import { get, isEmpty, map } from "lodash";
import locale from 'antd/es/date-picker/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import { ColumnConfig } from "@/reducers/indicatorAdvance";
import { ConditionState } from "@/reducers/query";
import { conditionOptionMap, functionSymbolMap, getConditionRaw, optionLabelMap, optionSymbolMap } from "@/utils/common";
import { operators } from "@/pages/AppExplore/ExploreFilter";

interface ConditionConfigProps {
  visible: boolean;
  column?: ColumnConfig;
  onCancel: Function;
  onSave: Function;
}

export default function ConditionsConfigModal({visible, column, onCancel, onSave}: ConditionConfigProps) {
  const [configForm] = Form.useForm();
  const [conditions, setConditions] = useState<ConditionState[]>([]);
  const [activePanelKey, setActivePanelKey] = useState<number>(-1);
  
  const attrType = column?.type || column?.cols[0].attrType || '';
  const conditionOptions = get(conditionOptionMap, attrType, ['eq']);

  useEffect(() => {
    setConditions(column?.conditions || [])
  }, [column])

  const handleCancel = () => {
    configForm.resetFields();
    setActivePanelKey(-1)
    onCancel()
  }

  const handleOk = () => {
    onSave(column?.id, conditions)
    handleCancel()
  }
  
  const renderConditionInput = function () {
    switch (attrType) {
      case "int":
        return (
          <InputNumber
            className="pdb-explore-filter-config-condition"
            precision={0}
          />
        );
      case "float":
        return (
          <InputNumber
            className="pdb-explore-filter-config-condition"
          />
        );
      case "boolean":
        return (
          <Select
            options={[{
              label: "True",
              value: "true"
            }, {
              label: "False",
              value: "false"
            }]}
            className="pdb-explore-filter-config-condition"
          />
        );
      case "datetime":
        if (typeof configForm.getFieldValue("value") !== "object") {
          configForm.setFieldValue("value", null);
        }
        return (
          <DatePicker className="pdb-explore-filter-config-condition" locale={locale} />
        );
      default:
        return (
          <Input
            className="pdb-explore-filter-config-condition"
          />
        )
    }
  }

  const hanldeDelete = (index: number) => {
    const cds = JSON.parse(JSON.stringify(conditions))
    cds.splice(index, 1)
    setConditions(cds)
  }

  const handleEdit = (index: number, condition: ConditionState) => {
    setActivePanelKey(index)
    const { name, value, not, connectives } = condition
    configForm.setFieldsValue({ name, function: functionSymbolMap[condition.function], value, not, connectives });
  }

  const add = () => {
    const index = conditions.length || 0
    setActivePanelKey(index)
    const initialValue: ConditionState = {name: '', function: functionSymbolMap['='], value: '', not: false}
    if (conditions.length > 0) initialValue.connectives = 'AND'
    configForm.setFieldsValue(initialValue);
  }

  const handleSave = () => {
    configForm.validateFields().then(values => {
      const cds = JSON.parse(JSON.stringify(conditions))
      cds[activePanelKey] = { ...values, function: optionSymbolMap[values.function] }
      setConditions(cds)
      setActivePanelKey(-1)
    }).catch(err => {})
  }

  const getExtra = (key: any, opt: any) => (
    <Space>
      <i className="spicon icon-shanchu2" onClick={() => hanldeDelete(key)} />
      <i className="spicon icon-bianji" onClick={() => handleEdit(key, opt)} />
    </Space>
  );

  const renderPanelChildren = () => {
    return (
      <Form form={configForm} layout="vertical" className="pdb-explore-filter-config">
        { activePanelKey > 0 &&
          <Form.Item name="connectives" label="">
            <Radio.Group>
              {Object.keys(operators).map(key => (
                <Radio key={key} value={key}>{operators[key]}</Radio>
              ))}
            </Radio.Group>
          </Form.Item>
        }
        <Form.Item label='过滤条件'>
          <div className="pdb-explore-filter-config-combination" style={{ display: 'flex' }}>
            <Form.Item name={"function"} rules={[{ required: true, message: "" }]} noStyle>
              <Select
                className="pdb-explore-filter-config-attr"
                options={conditionOptions.map((condition: string) => ({
                  value: condition,
                  label: optionLabelMap[condition]
                }))}
              />
            </Form.Item>
            <Form.Item name="value" rules={[{ required: true, message: "" }]} noStyle>
              {renderConditionInput()}
            </Form.Item>
          </div>
        </Form.Item>
        <Form.Item name="not" label="不具备条件(NOT) :" className="pdb-explore-filter-isNot">
          <Switch />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button onClick={() => {
              setActivePanelKey(-1)
              configForm.resetFields()
            }}>取消</Button>
            <Button type="primary" onClick={handleSave}>保存</Button>
          </Space>
        </Form.Item>
      </Form >
    )
  }
  
  const renderConditionsConfig = () => {
    if (activePanelKey == -1 && isEmpty(conditions)) {
      return <Empty />
    }
    const name = get(column, 'name', '')
    return map(conditions, (condition: ConditionState, index: number) => {
      return (
        <Fragment key={index}>
          {index > 0 && condition.connectives &&
            <Tag className="connectives" color="volcano">{operators[condition.connectives]}</Tag>
          }
          <Card  key={index}
            size="small"
            extra={activePanelKey === index ? null : getExtra(index, condition)}
            title={getConditionRaw(condition, name)}
            className={activePanelKey !== index ? "no-body-card" : ""}
          >
            {activePanelKey === index ? renderPanelChildren() : null}
          </Card>
        </Fragment>
      )
    })
  }
  
  return (
    <Modal
      title="设置过滤条件"
      className="pdb-indicator-advConditions"
      open={visible}
      onCancel={handleCancel}
      onOk={handleOk}
    >
      { renderConditionsConfig() }
      { conditions.length == activePanelKey && (
        <Card
          size="small"
          title={`新建${column?.name || '属性'}条件`}
          style={conditions.length === 0 ? {} : { marginTop: "1rem" }}
        >
          {renderPanelChildren()}
        </Card>
      )}
      {activePanelKey == -1 && <div className={"pdb-explore-filter-add"}>
        <Button
          icon={<i className="spicon icon-add"></i>}
          onClick={add}
        >添加条件</Button>
      </div>}
    </Modal>
  )
}