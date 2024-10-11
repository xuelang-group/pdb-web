import { AttrConfig } from "@/reducers/type";
import { Button, Divider, Form, Input, Radio, Select } from "antd";
import 'dayjs/locale/zh-cn';
import _ from "lodash";
import { useEffect, useRef, useState } from "react";
import { joinTypes } from "./ExploreFilter";

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
  const [joinType, setJoinType] = useState("all"),
    [leftSelected, setLeftSelected] = useState(true),
    [rightSelected, setRightSelected] = useState(true),
    [ovalSelected, setOvalSelected] = useState(true);
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

  const changeJoinType = function (_left: boolean, _right: boolean, _oval: boolean) {
    let joinType = '';
    if (_left && !_right) {
      joinType = 'left';
    } else if (!_left && _right) {
      joinType = 'right';
    } else if (_oval && !_left && !_right) {
      joinType = 'inner';
    } else if (_left && _right) {
      joinType = 'all';
    }
    setJoinType(joinType);
  }


  const changeLeftSelect = function (event: any) {
    setLeftSelected(!leftSelected);
    setOvalSelected(false);
    changeJoinType(!leftSelected, rightSelected, false);
  }

  const changeRightSelect = function (event: any) {
    setRightSelected(!rightSelected);
    setOvalSelected(false);
    changeJoinType(leftSelected, !rightSelected, false);
  }

  const changeOvalSelect = function (event: any) {
    setLeftSelected(false);
    setRightSelected(false);
    setOvalSelected(!ovalSelected);
    changeJoinType(false, false, !ovalSelected);
  }

  // 数据连接
  const renderGroupSetting = function () {
    return (
      <Form
        form={form}
        layout="vertical"
      >
        <div className="pdb-explore-group">
          <div className="pdb-explore-group-item" style={{ marginBottom: 24, marginRight: 8 }}>
            <div className="pdb-explore-group-item-select" style={{ marginBottom: 16, marginRight: 8 }}>
              <Form.Item
                name={["r.type.constraints", "r.binds", "source"]}
                label="源对象："
                rules={[{ required: true, message: "源对象不能为空" }]}
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
                name={["r.type.constraints", "r.binds", "source.attr"]}
                label="源对象-关联字段："
                rules={[{ required: true, message: "源对象属性不能为空" }]}
              >
                <Select
                  options={(_.get(sourceTag, 'data', {})['x.type.attrs'] || []).map(
                    ({ display, name }: AttrConfig) => ({ label: display, value: name })
                  )}
                />
              </Form.Item>
            </div>
            <div className="pdb-explore-group-item-select" style={{ marginBottom: 16, marginRight: 8 }}>
              <Form.Item
                name={["r.type.constraints", "r.binds", "target"]}
                label="目标对象："
                rules={[{ required: true, message: "目标对象不能为空" }]}
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
            <div className="pdb-explore-group-item-select">
              <Form.Item
                name={["r.type.constraints", "r.binds", "target.attr"]}
                label="目标对象-关联字段"
                rules={[{ required: true, message: "目标对象属性不能为空" }]}
              >
                <Select
                  options={(_.get(targetTag, 'data', {})['x.type.attrs'] || []).map(
                    ({ display, name }: AttrConfig) => ({ label: display, value: name })
                  )}
                />
              </Form.Item>
            </div>
            <div className="pdb-explore-group-item-input">
              <Form.Item name="r.type.label" label="关系名称：" rules={[{ required: true, message: "关系名称不能为空" }]}>
                <Input />
              </Form.Item>
            </div>
          </div>
          <Divider />
          <div className="pdb-explore-group-item">
            <div className="pdb-explore-group-item-header">
              <span style={{ display: "none" }}></span>
              <span>计算方式 - {joinType ? joinTypes[joinType] : "?"}</span>
              <span>(请单击图形更改联接类型)</span>
            </div>
            <div className="pdb-explore-group-item-content">
              {/* <Form.Item name="group" label="">
                <Radio.Group>
                  <Radio.Button value="inner">内联接</Radio.Button>
                  <Radio.Button value="left">左联接</Radio.Button>
                  <Radio.Button value="right ">右联接</Radio.Button>
                  <Radio.Button value="all">全联接</Radio.Button>
                </Radio.Group>
              </Form.Item> */}
              <div className="join-cirle">
                <div className="join-cirle-left" onClick={changeLeftSelect} style={leftSelected ? { background: '#80808061' } : { background: 'none' }}>
                </div>
                <div className="join-cirle-right" onClick={changeRightSelect} style={rightSelected ? { background: '#80808061' } : { background: 'none' }}>
                </div>
                <div className="join-cirle-oval" onClick={changeOvalSelect} style={ovalSelected ? { background: '#80808061' } : { background: 'none' }}>
                </div>
              </div>
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
        <Button type="primary" onClick={save} disabled={!joinType}>确定</Button>
      </div>
    </div>
  )
}