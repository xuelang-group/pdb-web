import { AttrConfig } from "@/reducers/type";
import { Button, Form, Input, Radio, Select } from "antd";
import 'dayjs/locale/zh-cn';
import _ from "lodash";
import { useEffect, useRef, useState } from "react";

interface ExploreFilterProps {
  sourceTag: any
  targetTag: any
  initialValue: any
  saveConfig: Function
  close: Function
}

export const operators: any = {
  "AND": "与",
  "OR": "或"
};

export default function NewRelation(props: ExploreFilterProps) {
  const { close, sourceTag, targetTag, saveConfig, initialValue } = props;
  const [form] = Form.useForm();

  useEffect(() => {
    form && form.setFieldsValue(initialValue.data);
  }, [initialValue]);

  const save = function () {
    form.validateFields().then(values => {
      saveConfig({
        ...initialValue,
        label: values['r.type.label'],
        data: values
      });
      close();
    }).catch(err => { });
  }

  // 数据连接
  const renderGroupSetting = function () {
    return (
      <Form
        form={form}
        layout="vertical"
      >
        <div className="pdb-explore-group">
          <div className="pdb-explore-group-item" style={{ marginBottom: 24 }}>
            <div className="pdb-explore-group-item-select">
              <Form.Item
                name={["r.type.constraints", "r.binds", "source"]}
                label="源对象："
              >
                <Select
                  options={[{
                    label: sourceTag.label,
                    value: sourceTag.key
                  }]}
                  disabled
                />
              </Form.Item>
            </div>
            <div className="pdb-explore-group-item-select">
              <Form.Item
                name={["r.type.constraints", "r.binds", "target"]}
                label="目标对象："
              >
                <Select
                  options={[{
                    label: targetTag.label,
                    value: targetTag.key
                  }]}
                  disabled
                />
              </Form.Item>
            </div>
            <div className="pdb-explore-group-item-input" style={{ marginTop: 16 }}>
              <Form.Item name="r.type.label" label="关系名称：" rules={[{ required: true, message: "关系名称不能为空" }]}>
                <Input />
              </Form.Item>
            </div>
          </div>
          <div className="pdb-explore-group-item" style={{ marginBottom: 24 }}>
            <div className="pdb-explore-group-item-header">
              <span></span>
              <span>关系属性</span>
            </div>
            <div className="pdb-explore-group-item-content">
              <div className="pdb-explore-group-item-select">
                <Form.Item
                  name={["r.type.constraints", "r.binds", "source.attr"]}
                  label={`${sourceTag.label}：`}
                  rules={[{ required: true, message: "源对象属性不能为空" }]}>
                  <Select
                    options={(_.get(sourceTag, 'data', {})['x.type.attrs'] || []).map(
                      ({ display, name }: AttrConfig) => ({ label: display, value: name })
                    )}
                  />
                </Form.Item>
              </div>
              <div className="pdb-explore-group-item-select">
                <Form.Item
                  name={["r.type.constraints", "r.binds", "target.attr"]}
                  label={`${targetTag.label}：`}
                  rules={[{ required: true, message: "源对象属性不能为空" }]}>
                  <Select
                    options={(_.get(targetTag, 'data', {})['x.type.attrs'] || []).map(
                      ({ display, name }: AttrConfig) => ({ label: display, value: name })
                    )}
                  />
                </Form.Item>
              </div>
            </div>
          </div>
          <div className="pdb-explore-group-item">
            <div className="pdb-explore-group-item-header">
              <span></span>
              <span>计算方式</span>
            </div>
            <div className="pdb-explore-group-item-content">
              {/* <Radio.Group value={groupMethod} onChange={e => { setGroupMethod(e.target.value); }}>
                <Radio.Button value="inner">内联接</Radio.Button>
                <Radio.Button value="left">左联接</Radio.Button>
                <Radio.Button value="right ">右联接</Radio.Button>
                <Radio.Button value="all">全联接</Radio.Button>
              </Radio.Group> */}
              <Form.Item name="group" label="">
                <Radio.Group>
                  <Radio.Button value="inner">内联接</Radio.Button>
                  <Radio.Button value="left">左联接</Radio.Button>
                  <Radio.Button value="right ">右联接</Radio.Button>
                  <Radio.Button value="all">全联接</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </div>
          </div>
        </div>
      </Form>
    )
  }
  return (
    <div className="pdb-explore-setting">
      <div className="pdb-explore-setting-header">
        <span>关系类型 - 临时关系</span>
        <i className="spicon icon-guanbi" onClick={() => close()}></i>
      </div>
      <div className="pdb-explore-setting-container">
        {renderGroupSetting()}
      </div>
      <div className="pdb-explore-setting-footer">
        <Button onClick={() => close()}>取消</Button>
        <Button type="primary" onClick={save}>确定</Button>
      </div>
    </div>
  )
}