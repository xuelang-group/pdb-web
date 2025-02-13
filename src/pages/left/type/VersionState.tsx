/**
 * 对象版本状态的修改
 * 发布、检出
 */

import { getObjectCount } from "@/actions/object";
import { setType, updateTypeVerison } from "@/actions/type";
import { setStateType, setTypes, TypeConfig, VersionState as VersionType } from "@/reducers/type";
import { StoreState } from "@/store";
import { Form, Input, message, Modal, notification } from "antd";
import { stat } from "fs";
import { findIndex } from "lodash";
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

interface VersionStateProps {
  item: TypeConfig;
}

const layout = {
  labelCol: { span: 5 },
  wrapperCol: { span: 18 },
};

export default function VersionState() {
  const dispatch = useDispatch();
  const graphData = useSelector((state: StoreState) => state.object.graphData);
  const types = useSelector((state: StoreState) => state.type.data);
  const stateType = useSelector((state: StoreState) => state.type.stateType);
  
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // 有无继承对象
  const [inherited, setInherited] = useState(false);
  // 有无实例
  const [objectCount, setObjectCount] = useState<number>();

  const handleCancel = () => setOpen(false)

  const handleOk = () => {

  }

  // 检出
  const handleCheckout = () => {

  }

  const updateCallback = (success: boolean, state: VersionType) => {
    if (success && stateType) {
      const newTypes: TypeConfig[] = JSON.parse(JSON.stringify(types));
      const targetTypeIndex = findIndex(newTypes, tp => tp['x.type.id'] == stateType['x.type.id']);
      newTypes[targetTypeIndex] = {...stateType, "x.type.version.state": state}
      dispatch(setTypes(newTypes));
      message.success(state ? '发布对象类型成功' : '对象类型已检出');
    } else {
      message.error(state ? '发布对象类型失败' : '对象类型检出失败');
    }
    dispatch(setStateType(undefined))
  }

  const handleInherited = () => {

  }

  const handleStateChange = (count: number) => {
    if (!stateType) return
    const state = stateType?.['x.type.version.state'] ? 0 : 1
    console.log('handleStateChange count: ', objectCount)
    if (!stateType['x.type.version']) {
      // 未启用版本控制时，仅修改类型的state
      setType(
        graphData.id,
        [{"x.type.id": stateType["x.type.id"], "x.type.version.state": state}],
        (success: boolean) => updateCallback(success, state)
      )
    } else if(!state) {
      // 已启用版本控制时，检出-新增对象类型版本
      updateTypeVerison(
        graphData.id,
        {"x.type.version.id": stateType["x.type.version.id"], "x.type.version.state": state},
        (success: boolean) => updateCallback(success, state)
      )
    } else {
      // 已启用版本控制时，发布-需要输入版本号后修改类型版本
      setOpen(true)
    }
  }

  useEffect(() => {
    if (!stateType) {
      setOpen(false)
      return
    }  
    handleInherited()
    getObjectCount(graphData.id, stateType?.['x.type.id'], (success: boolean, response: any) => {
      if (success) {
        setObjectCount(response)
        handleStateChange(response)
      } else {
        notification.error({
          message: '获取对象计数失败',
          description: response.message || response.msg
        });
      }
    });

  }, [stateType])

  return (
    <Modal
      title="发布对象类型"
      open={open}
      okText="发布"
      cancelText="取消"
      confirmLoading={loading}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <Form {...layout} form={form}>
        <Form.Item
          style={{marginBottom: 0}}
          name='x.type.version.name'
          label={`${!stateType || !stateType['x.type.version.name'] ? '新' : ''}版本号`}
          rules={[{required: true, message: '版本号不能为空'}]}
        >
          <Input addonBefore="V" placeholder={'仅允许数字，以 . 作为分隔符，例：1.0.0'} />
        </Form.Item>
      </Form>
    </Modal>
  )
}