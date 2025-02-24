/**
 * 对象版本状态的修改
 * 发布、检出
 */
import { addTypeVerison, checkChildrenObject, checkObject, checkReferLock, setType, updateTypeVerison } from "@/actions/type";
import { setStateType, setTypes, TypeConfig, VersionState as StateType } from "@/reducers/type";
import { StoreState } from "@/store";
import { Alert, Button, Flex, Form, Input, message, Modal, notification, Typography } from "antd";
import { ExclamationCircleFilled } from "@ant-design/icons"
import { findIndex } from "lodash";
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentEditModel } from "@/reducers/editor";

const layout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 17 },
};

export default function VersionState() {
  const dispatch = useDispatch();
  const graphData = useSelector((state: StoreState) => state.object.graphData);
  const types = useSelector((state: StoreState) => state.type.data);
  const currentEditModel = useSelector((state: StoreState) => state.editor.currentEditModel);
  const stateType = useSelector((state: StoreState) => state.type.stateType);
  
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [state, setState] = useState<StateType>();
  const [versionName, setVersionName] = useState('');
  const [loading, setLoading] = useState(false);
  // 有无继承对象类型以“锁定当前版本”的方式引用父类型
  const [hasReferLock, setHasReferLock] = useState<boolean>(false);
  // 对象类型存在实例
  const [hasObject, setHasObject] = useState<boolean>(false);
  // 任一“非锁定当前版本”的继承对象类型是否已有实例
  const [hasReferObject, setHasReferObject] = useState<boolean>(false);

  const handleCancel = () => {
    dispatch(setStateType(undefined))
  }

  const handleOk = () => {
    form.validateFields().then((values: { [key: string]: any; }) => {
      setVersionName(values['x.type.version.name'])
      // 询问是否同步更新实例：有实例或继承对象有实例
      if (hasObject || hasReferObject) {
        setOpen(false)
        setConfirmOpen(true)
      } else {
        handleConfirm(0, values);
      }
    }).catch((err: any) => {

    })
  }

  const updateCallback = (success: boolean, response: any) => {
    if (success && stateType && state !== undefined) {
      const newTypes: TypeConfig[] = JSON.parse(JSON.stringify(types));
      const targetTypeIndex = findIndex(newTypes, tp => tp['x.type.id'] == stateType['x.type.id']);
      let currentType
      if (!response) {
        currentType = {...stateType, "x.type.version.state": state}
      } else if (response['x.type.id']) {
        currentType = response
      } else if (response[0]['x.type.id']) {
        currentType = response[0]
      }
      newTypes[targetTypeIndex] = currentType
      dispatch(setTypes(newTypes));
      
      const graph = (window as any).PDB_GRAPH;
      if (currentEditModel) {
        const newModel = Object.assign({}, currentEditModel, {data: currentType})
        graph.updateItem(currentEditModel.id, newModel)
        dispatch(setCurrentEditModel(newModel))
      }
      message.success(state ? '发布对象类型成功' : '对象类型已检出');
    } else {
      notification.error({
        message: state ? '发布对象类型失败' : '对象类型检出失败',
        description: response.message || response.msg
      });
    }
    dispatch(setStateType(undefined))
  }

  const handleConfirm = (objectSyncMethod=0, values={}) => {
    stateType && updateTypeVerison(graphData.id, {
      "x.type.version": stateType['x.type.version'],
      "x.type.version.id": stateType['x.type.version.id'],
      "x.type.version.name": versionName || stateType['x.type.version.name'],
      "x.type.version.state": state,
      ...values,
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
    }, updateCallback)
  }

  const handleUpdateType = (id: string, state: StateType) => {
    setType(
      graphData.id,
      [{"x.type.id": id, "x.type.version.state": state}],
      updateCallback
    )
  }

  useEffect(() => {
    if (!stateType || state == undefined) return
    const version = stateType['x.type.version'];
    if (!state) {
      // 检出
      !version ? handleUpdateType(stateType['x.type.id'], state) : handleCreateVersion()
    } else {
      // 发布
      if (version) {
        setOpen(true)
      } else if (!hasObject && !hasReferObject) {
        handleUpdateType(stateType['x.type.id'], state)
      } else {
        setConfirmOpen(true)
      }
    }
  }, [state, hasObject, hasReferObject, hasReferLock])

  useEffect(() => {
    if (!stateType) {
      setOpen(false)
      setConfirmOpen(false)
      setState(undefined)
      setHasReferLock(false)
      setHasObject(false)
      setHasReferObject(false)
      setVersionName('')
      form.setFieldValue('x.type.version.name', '')
      return
    } 
    const tpState = stateType?.['x.type.version.state'] ? 0 : 1;
    checkObject(graphData.id, stateType["x.type.id"], (success1: boolean, obj: any) => {      
      checkChildrenObject(graphData.id, stateType["x.type.id"], (success2: boolean, referObj: any) => {
        checkReferLock(graphData.id, stateType["x.type.id"], (success3: boolean, referLock: any) => {
          setState(tpState) 
          success1 && setHasObject(obj)
          success2 && setHasReferObject(referObj)
          success3 && setHasReferLock(referLock)
          console.log('----> ', tpState, obj, referObj, referLock)
        });
      })
    })
  }, [stateType])

  const verName = stateType && stateType["x.type.version.name"] ? ` V${stateType["x.type.version.name"]} ` : ''

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
      { stateType && hasReferLock && <Alert className="pdb-state-alert" showIcon type="warning" message={`当前最新版本${verName}已被引用，若发布新版本，系统将自动复制${verName}为对象类型副本，并迁移所有引用的子对象至该副本。`} /> }
      <Form {...layout} form={form}>
        <Form.Item
          style={{marginBottom: 0}}
          label={`新版本号`}
          name='x.type.version.name'
          rules={[{required: true, message: '版本号不能为空'}]}
          tooltip={
            <>
            格式 X.X.X，仅允许使用数字和 . 作为分隔符，不支持字母、特殊字符等。<br />不允许前导零，如 00.01.02 是无效的，应改为 0.1.2 。
            </>
          }
        >
          <Input addonBefore="V" placeholder={`请输入更高的版本号（当前版本号：${verName}）`} />
        </Form.Item>
      </Form>
    </Modal>
    <Modal
      open={confirmOpen} width={416}
      footer={null}
      onCancel={() => setConfirmOpen(false)}
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