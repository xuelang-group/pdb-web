import { Input, Button, Form, notification, Modal, Table, Tag, Space, Radio, Switch, message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setCurrentVersion, setVersionList, setVersionModal, TypeConfig, TypeVersionConfig } from '@/reducers/type';
import { StoreState } from '@/store';
import { getTypeVerisonList, copyTypeVerison } from '@/actions/type';
import { getDefaultCopyName } from '@/utils/common';
import moment from 'moment';
import { setCurrentEditModel } from '@/reducers/editor';
import { cloneDeep } from 'lodash';

const ActionTitle: {
  'copy': string;
  'diff': string;
} = {
  'copy': '复制版本为新对象类型',
  'diff': '选择对比版本',
}
const layout = {
  labelCol: { span: 5 },
  wrapperCol: { span: 18 },
};

interface VersionModalProps {
  types: TypeConfig[];
}

export default function VersionModal({types}: VersionModalProps) {
  const dispatch = useDispatch();
  const graphData = useSelector((state: StoreState) => state.object.graphData);
  const versionModal = useSelector((state: StoreState) => state.type.versionModal);
  const versions = useSelector((state: StoreState) => state.type.versionList);
  const currentEditModel = useSelector((state: StoreState) => state.editor.currentEditModel);

  const [form] = Form.useForm();
  const copyMethod = Form.useWatch('copyMethod', form);

  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [currVersion, setCurrVersion] = useState<TypeVersionConfig>();
  const [currType, setCurrType] = useState<'copy' | 'diff'>('copy'); // 当前的操作

  const columns = [{
    dataIndex: 'x.type.version.name',
    title: '版本号',
    render: (text:string, record: TypeVersionConfig) => versionModal.type
      && versionModal.type['x.type.version.id'] === record['x.type.version.id'] ? (
      <Space><span>V{text}</span><Tag>当前版本</Tag></Space>
      ) : `V${text}`
  }, {
    dataIndex: 'x.type.version.created',
    title: '创建时间',
    render: (text:number) => moment(text).format("YYYY-MM-DD HH:mm:ss")
  }, {
    dataIndex: '',
    title: '操作',
    width: 300,
    render(text: any, record: TypeVersionConfig) { 
      return (<Space size={12}>
        { total > 1 && <a key='detail' onClick={() => handleClick('detail', record)}>查看</a> }
        <a key='copy' onClick={() => handleClick('copy', record)}>复制</a>
        { total > 1 && <a key='diff' onClick={() => handleClick('diff', record)}>版本对比</a> }
      </Space>)
    }
  }]

  useEffect(() => {
    if (versionModal.type) {
      setLoading(true)
      getTypeVerisonList(graphData.id, {
        'x.type.id': versionModal.type['x.type.id']
      }, (success: boolean, response: any) => {
        setLoading(false)
        if (success) {
          dispatch(setVersionList(response.list))
          setTotal(response.total)
        } else {
          dispatch(setVersionList([]))
          notification.error({
            message: '对象类型版本列表失败',
            description: response.message || response.msg
          });
        } 
      })
    }
  }, [versionModal.type])

  const handleCancel = () => {
    dispatch(setVersionModal({open: false}))
  }

  const handleClick = (type: 'copy' | 'diff' | 'detail', version: TypeVersionConfig) => {
    if (type !== 'detail') {
      setOpen(true)
      setCurrType(type);
      setCurrVersion(version)
      if (type === 'copy') {
        const copyName = versionModal.type ? getDefaultCopyName(versionModal.type['x.type.name']) : '';
        form.setFieldsValue({
          'x.type.version.id': version['x.type.version.id'],
          'x.type.name': copyName,
          'x.type.version.name': '',
          'copyMethod': 0
        })
      } else{
        form.setFieldsValue({
          'newVersionId': version['x.type.version.id'],
          'oldVersionId': ''
        })
      }
    } else {
      // 查看历史版本
      dispatch(setCurrentVersion(version))
      const data = cloneDeep(currentEditModel?.data) as TypeConfig;
      if (data && data["x.type.version.attrs"]) {
        Object.assign(data, version)
      }
      const newCurrentModel = Object.assign({}, currentEditModel, { data })
      dispatch(setCurrentEditModel(newCurrentModel))
      handleCancel()
    }
  }

  const handleCopy = (values: {[key:string]: any}) => {
    currVersion && copyTypeVerison({
      graphId: graphData.id,
      "x.type.version.id": currVersion["x.type.version.id"],
      ...values,
    }, (success: boolean, response: any) => {
      if (success) {
        message.success('复制成功')
        setOpen(false)
      } else {
        notification.error({
          message: `复制失败`,
          description: response.message || response.msg
        });
      }
    })
  }

  const handleDiff = (values: {[key:string]: any}) => {

  }

  const handleConfirm = () => {
    form.validateFields().then((values: { [key: string]: any; }) => {
      currType === 'copy' ? handleCopy(values) : handleDiff(values)
    }).catch((err: any) => {

    })
  }

  const onValidateTypeName = async (_: any, value: string | any[]) => {
    if (value.length > 50) {
      throw new Error('类型名称最多支持50个字符');
    } else if (types && types.findIndex((_type: any, index: number) => _type["x.type.name"] === value) > -1) {
      throw new Error('该名称已被使用');
    }
  }

  const renderCopy = () => currVersion && (
    <Form {...layout} form={form}>
      <Form.Item label="类型名称" name="x.type.name" rules={[{required: true}, { validator: onValidateTypeName }]}>
        <Input />
      </Form.Item>
      <Form.Item label="复制范围" name="copyMethod">
        <Radio.Group>
          <Radio value={0}>版本V{currVersion['x.type.version.name']}</Radio>
          <Radio value={1}>该版本及其全部历史版本</Radio>
        </Radio.Group>
      </Form.Item>
      {!copyMethod && <Form.Item label="版本号" name="x.type.version.name">
        <Input addonBefore="V" placeholder={'仅允许数字，以 . 作为分隔符，例：1.0.0'} />
      </Form.Item>}
      <Form.Item label="版本控制">
        <Switch disabled checkedChildren="ON" unCheckedChildren="OFF" defaultChecked  />
      </Form.Item>
    </Form>
  )

  const renderDiff = () => currVersion && (
    <Form {...layout} form={form}>
      <Form.Item label="对比版本一" name="newVersionId">
        <Input />
      </Form.Item>
      <Form.Item label="对比版本二" name="oldVersionId">
        <Input />
      </Form.Item>
    </Form>
  )

  return (
    <>
      <Modal
        open={versionModal.open}
        title='版本记录'
        footer={null}
        width={960}
        onCancel={handleCancel}
      >
        <Table
          style={{minHeight: 300}}
          columns={columns}
          dataSource={versions}
          pagination={false}
          size="small"
          // scroll={{y: 480}}
          rowKey={'x.type.version.id'}
          loading={loading}
        />
      </Modal> 
      <Modal
        open={open}
        title={ActionTitle[currType]}
        width={520}
        destroyOnClose
        okText={currType === 'diff' ? "开始对比" : "确定"}
        onOk={handleConfirm}
        onCancel={() => setOpen(false)}
      >
        { currType === 'copy' && renderCopy() }
        { currType === 'diff' && renderDiff() }
      </Modal>
    </>
  )
}