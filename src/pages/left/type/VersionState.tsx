/**
 * 对象版本状态的修改
 * 发布、检出
 */
import { getObjectCount } from "@/actions/object";
import { addTypeVerison, setType, updateTypeVerison } from "@/actions/type";
import { setStateType, setTypes, TypeConfig, VersionState as VersionType } from "@/reducers/type";
import { StoreState } from "@/store";
import { Alert, Button, Flex, Form, Input, message, Modal, notification, Space, Typography } from "antd";
import { ExclamationCircleFilled } from "@ant-design/icons"
import { filter, findIndex, forEach, isEmpty, map } from "lodash";
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [state, setState] = useState<VersionType>(0);
  const [versionName, setVersionName] = useState('');
  const [loading, setLoading] = useState(false);
  // 有无继承对象
  const [children, setChildren] = useState<TypeConfig[]>([]);
  // 有无实例
  const [objectCount, setObjectCount] = useState<{[key: string]: number}>();

  const handleCancel = () => setOpen(false)

  const handleOk = () => {
    form.validateFields().then((values: { [key: string]: any; }) => {
      setVersionName(values['x.type.version.name'])
      // 询问是否同步更新实例：有实例或继承对象有实例
      if (!isEmpty(objectCount)) {
        setOpen(false)
        setConfirmOpen(true)
      } else {
        handleConfirm();
      }
    }).catch((err: any) => {

    })
  }

  const updateCallback = (success: boolean, response: any) => {
    if (success && stateType) {
      const newTypes: TypeConfig[] = JSON.parse(JSON.stringify(types));
      const targetTypeIndex = findIndex(newTypes, tp => tp['x.type.id'] == stateType['x.type.id']);
      newTypes[targetTypeIndex] = {...stateType, "x.type.version.state": state}
      dispatch(setTypes(newTypes));
      message.success(state ? '发布对象类型成功' : '对象类型已检出');
    } else {
      notification.error({
        message: state ? '发布对象类型失败' : '对象类型检出失败',
        description: response.message || response.msg
      });
    }
    dispatch(setStateType(undefined))
  }

  const handleConfirm = (objectSyncMethod=0) => {
    stateType && updateTypeVerison(graphData.id, {
      "x.type.version": stateType['x.type.version'],
      "x.type.version.id": stateType['x.type.version.id'],
      "x.type.version.name": versionName || stateType['x.type.version.name'],
      "x.type.version.state": state,
      objectSyncMethod
    }, updateCallback)
    confirmOpen && setConfirmOpen(false)
  }

  const handleCreateVersion = () => {
    if (!stateType) return
    // 开启版本控制时检出，创建一个新的版本
    addTypeVerison(graphData.id, {
      "x.type.id": stateType["x.type.id"],
      objectSyncMethod: 0,
    }, (success: boolean, response: any) => {
      if (success) {
        console.log('检出 response: ', response)
        message.success('对象类型已检出');
      } else {
        notification.error({
          message: '对象类型检出失败',
          description: response.message || response.msg
        });
      }
      dispatch(setStateType(undefined))
    })
  }

  useEffect(() => {
    if (!stateType) return
    
    const version = stateType['x.type.version'];
    console.log('objectCount: ', objectCount)
    console.log('children: ', children)
    if (!version) {
      // 未开启版本控制
      if (!state || isEmpty(objectCount)) {
        // 直接发布，弱提示成功： 无继承对象无实例；有继承对象，但对象和继承对象均无实例
        setType(
          graphData.id,
          [{"x.type.id": stateType["x.type.id"], "x.type.version.state": state}],
          updateCallback
        )
      } else {
        // 询问是否同步更新实例：
        !state ? handleCreateVersion() : setConfirmOpen(true)
      }
    } else {
      // 已开启版本控制
      setOpen(true)
    }
  }, [objectCount])

  useEffect(() => {
    if (!stateType) {
      setOpen(false)
      setConfirmOpen(false)
      return
    } 
    const state = stateType?.['x.type.version.state'] ? 0 : 1;
    setState(state)
    // 继承对象
    const childrenTypes = filter(types, (tp) => {
      const proto = tp["x.type.version.prototype"];
      return !!proto && proto["x.type.id"] === stateType['x.type.id']
    });
    setChildren(childrenTypes)
    const count: {[key: string]: number} = {};
    const len = childrenTypes.length;
    forEach([stateType, ...childrenTypes], async (tp, index) => {
      const { data } = await getObjectCount(graphData.id, tp["x.type.id"])
      if (data.success && data.data) {
        count[tp["x.type.id"]] = data.data
      }
      if (index == len) {
        setObjectCount(count)
      }
    })

  }, [stateType])

  return (
    <>
    <Modal
      title="发布对象类型"
      open={open}
      okText="发布"
      cancelText="取消"
      confirmLoading={loading}
      onOk={handleOk}
      onCancel={handleCancel}
      wrapClassName="pdb-state-modal"
    >
      <Alert className="pdb-state-alert" showIcon type="warning" message={`当前最新版本 V2.3.0 已被引用，若发布新版本，系统将自动复制 V2.3.0 为对象类型副本，并迁移所有引用的子对象至该副本。`} />
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
    <Modal
      open={confirmOpen} width={416}
      footer={null}
    >
      <div className="pdb-state-confirm">
        <ExclamationCircleFilled className="pdb-state-confirm-icon" />
        <Typography.Title style={{marginTop: 0}} level={5}>是否同步更新属性到实例？</Typography.Title>
        <Typography.Text>检测到该对象或其继承对象已创建类型实例，同步属性可能造成数据冲突或丢失，请谨慎操作。</Typography.Text>
        <Flex justify="end" gap="small" style={{marginTop: 12}}>
          <Button onClick={() => setConfirmOpen(false)}>取消</Button>
          <Button onClick={() => handleConfirm(1)}>迁移实例到类型副本</Button>
          <Button onClick={() => handleConfirm(2)}>直接同步</Button>
        </Flex>
      </div>
    </Modal>
    </>
  )
}