import { AttrConfig } from "@/reducers/type";
import { StoreState } from "@/store";
import { Button, Divider, Form, Input, Radio, Select } from "antd";
import 'dayjs/locale/zh-cn';
import _ from "lodash";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { joinTypes } from "./ExploreFilter";

interface ExploreFilterProps {
  sourceTag: any
  targetTag: any
  initialValue: any
  saveConfig: Function
  close: Function
  tagsLen: number
}

export const operators: any = {
  "AND": "与",
  "OR": "或"
};

export default function NewRelation(props: ExploreFilterProps) {
  const { close, sourceTag, targetTag, saveConfig, initialValue, tagsLen } = props;
  const [form] = Form.useForm();

  const types = useSelector((state: StoreState) => state.type.data),
    relations = useSelector((state: StoreState) => state.relation.data);

  const [joinType, setJoinType] = useState("innerjoin"),
    [leftSelected, setLeftSelected] = useState(false),
    [rightSelected, setRightSelected] = useState(false),
    [ovalSelected, setOvalSelected] = useState(true),
    [currTargetTag, setCurrTargetTag] = useState(targetTag);

  useEffect(() => {
    if (form && !_.isEqual(form.getFieldsValue(), initialValue.data)) {
      form.setFieldsValue({ ...initialValue.data });
      const bindType = _.get(initialValue, "bindType", "innerjoin");
      switch (bindType) {
        case 'innerjoin':
          setLeftSelected(false);
          setRightSelected(false);
          setOvalSelected(true);
          break;
        case 'leftjoin':
          setLeftSelected(true);
          setRightSelected(false);
          setOvalSelected(false);
          break;
        case 'rightjoin':
          setLeftSelected(false);
          setRightSelected(true);
          setOvalSelected(false);
          break;
        default:
          setLeftSelected(true);
          setRightSelected(true);
          setOvalSelected(false);
          break;
      }
      setJoinType(bindType);
    }
  }, [initialValue]);

  const save = function () {
    form.validateFields().then(values => {
      const binds = [_.get(values["r.type.constraints"], "r.binds", {})];
      saveConfig({
        ...initialValue,
        label: values['r.type.label'],
        data: values,
        bindType: joinType,
        binds
      }, currTargetTag);
      close();
    }).catch(err => { });
  }

  const changeJoinType = function (_left: boolean, _right: boolean, _oval: boolean) {
    let joinType = '';
    if (_left && !_right) {
      joinType = 'leftjoin';
    } else if (!_left && _right) {
      joinType = 'rightjoin';
    } else if (_oval && !_left && !_right) {
      joinType = 'innerjoin';
    } else if (_left && _right) {
      joinType = 'fulljoin';
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
                  options={types}
                  fieldNames={{
                    label: "x.type.label",
                    value: "x.type.name"
                  }}
                  disabled={!_.isEmpty(targetTag)}
                  onChange={(value, option: any) => {
                    setCurrTargetTag({
                      label: option['x.type.label'],
                      value: option['x.type.name'] + `-${tagsLen + 1}`,
                      key: option['x.type.name'],
                      type: 'type',
                      data: option,
                      prevSearchTagType: "relation"
                    });
                    // form.setFieldValue(["r.type.constraints", "r.binds", "target.attr"], "");
                  }}
                />
              </Form.Item>
            </div>
            <div className="pdb-explore-group-item-select">
              <Form.Item
                noStyle
                shouldUpdate={(prevValues, curValues) => _.get(_.get(prevValues, "r.type.constraints"), "r.binds", {})["target"] !== _.get(_.get(curValues, "r.type.constraints"), "r.binds", {})}
              >
                {({ getFieldValue, setFieldValue }) => {
                  return (
                    <Form.Item
                      name={["r.type.constraints", "r.binds", "target.attr"]}
                      label="目标对象-关联字段"
                      rules={[{ required: true, message: "目标对象属性不能为空" }]}
                    >
                      <Select
                        options={(_.get(currTargetTag, 'data', {})['x.type.attrs'] || []).map(
                          ({ display, name }: AttrConfig) => ({ label: display, value: name })
                        )}
                        disabled={!getFieldValue(["r.type.constraints", "r.binds", "target"])}
                      />
                    </Form.Item>
                  )
                }}
              </Form.Item>
            </div>
            <div className="pdb-explore-group-item-input">
              <Form.Item
                name="r.type.label"
                label="关系名称："
                rules={[
                  { required: true, message: "关系名称不能为空" },
                  {
                    validator: async (_, value) => {
                      if (value.length > 50) {
                        throw new Error('类型名称最多支持50个字符');
                      }
                    }
                  }
                ]}
              >
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
                  <Radio.Button value="innerjoin">内联接</Radio.Button>
                  <Radio.Button value="leftjoin">左联接</Radio.Button>
                  <Radio.Button value="rightjoin ">右联接</Radio.Button>
                  <Radio.Button value="fulljoin">全联接</Radio.Button>
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
        <span>关联关系</span>
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