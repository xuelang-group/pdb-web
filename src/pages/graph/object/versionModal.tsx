import { Input, Form, notification, Modal, Table, Tag, Space, Radio, Switch, message, Select } from 'antd';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setObjectVersionList, setVersionDiffModal, setVersionModalOpen } from '@/reducers/object';
import { StoreState } from '@/store';
import { getDefaultCopyName } from '@/utils/common';
import moment from 'moment';
import { setCurrentEditModel } from '@/reducers/editor';
import { cloneDeep, findIndex, isEmpty, map } from 'lodash';
import { ObjectConfig, ObjectVersionConfig } from '@/reducers/object';
import { diffVersion, getVersionList } from '@/actions/object';

const layout = {
  labelCol: { span: 5 },
  wrapperCol: { span: 18 },
};

export default function VersionModal() {
  const dispatch = useDispatch();
  const graphData = useSelector((state: StoreState) => state.object.graphData);
  const versionModalOpen = useSelector((state: StoreState) => state.object.versionModalOpen);
  const versionDiffModal = useSelector((state: StoreState) => state.object.versionDiffModal);
  const versions = useSelector((state: StoreState) => state.object.versionList);
  const currentEditModel = useSelector((state: StoreState) => state.editor.currentEditModel);

  const [form] = Form.useForm();
  const copyMethod = Form.useWatch('copyMethod', form);

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [currVersion, setCurrVersion] = useState<ObjectVersionConfig>();
  const [currentEditDefaultData, setCurrentEditDefaultData] = useState<ObjectConfig>();

  const columns = [{
    dataIndex: 'x.object.version.name',
    title: '版本号',
    render: (text:string, record: ObjectVersionConfig) => {
      const vn = text ? `V${text}` : '--'
      const currentVersionId = currentEditDefaultData?.['x.object.version.id']
      return currentVersionId && currentVersionId === record['x.object.version.id'] ? (
      <Space><span>{vn}</span><Tag>当前版本</Tag></Space>
      ) : vn
    }
  }, {
    dataIndex: 'x.object.version.created',
    title: '创建时间',
    render: (text:number) => moment(text).format("YYYY-MM-DD HH:mm:ss")
  }, {
    dataIndex: '',
    title: '操作',
    width: 300,
    render(text: any, record: ObjectVersionConfig) {
      const total = versions.length
      return (<Space size={12}>
        { total > 1 && <a key='detail' onClick={() => handleClick('detail', record)}>查看</a> }
        { total > 1 && <a key='diff' onClick={() => handleClick('diff', record)}>版本对比</a> }
      </Space>)
    }
  }]

  const updateTypeVersions = () => {
    if ((!isEmpty(currentEditDefaultData))) {
      const objectId = currentEditDefaultData['x.object.id']
      setLoading(true)
      getVersionList({
        'x.object.id': objectId
      }, (success: boolean, response: any) => {
        setLoading(false)
        if (success) {
          dispatch(setObjectVersionList(response))
        } else {
          dispatch(setObjectVersionList([]))
          notification.error({
            message: '请求版本列表失败',
            description: response.message || response.msg
          });
        } 
      })
    }
  }

  useEffect(() => {
    if (versionModalOpen) {
      updateTypeVersions()
      if (currentEditModel?.data && currentEditModel?.data.hasOwnProperty('x.object.id')) {
        const currentEditDefaultData = JSON.parse(JSON.stringify(currentEditModel.data || {}));
        setCurrentEditDefaultData(currentEditDefaultData)
      }
    }
  }, [versionModalOpen, currentEditModel])

  const handleCancel = () => {
    dispatch(setVersionModalOpen(false))
  }

  const handleClick = (type: 'diff' | 'detail', version: ObjectVersionConfig) => {
    if (type === 'detail') {
      setCurrVersion(version)
        // dispatch(setDiffModalOpen(true))
    } else {
      // 版本比对
      dispatch(setVersionDiffModal({open: true, oldVersionId: version['x.object.version.id']}))
      handleCancel()
    }
  }

  useEffect(() => {
    versionDiffModal.open && form.setFieldsValue({
      'oldVersionId': versionDiffModal.oldVersionId,
    })
  }, [versionDiffModal.open])

  const handleDiffCancel = () => {
    dispatch(setVersionDiffModal({open: false, oldVersionId: '', newVersionId: ''}))
  }

  const handleDiffConfirm = () => {
    form.validateFields().then((values: { [key: string]: any; }) => {
      dispatch(setVersionDiffModal({open: false, ...values}))
    }).catch((err: any) => { })
  }

  const onValidate = async (_: any, value: string) => {
    const oldVersionId = form.getFieldValue('oldVersionId')
    const newVersionId = form.getFieldValue('newVersionId')
    if (oldVersionId === newVersionId) {
      throw new Error('不能选择同一版本进行比对');
    }
  }
    
  const items = map(versions, (v: ObjectVersionConfig) => ({ value: v["x.object.version.id"], label: v["x.object.version.name"] ? `V${v["x.object.version.name"]}`: '--'}));

  return (
    <>
      <Modal
        open={versionModalOpen}
        title='版本记录'
        footer={null}
        width={760}
        onCancel={handleCancel}
      >
        <Table className='pdb-table-scroll'
          style={{minHeight: 300}}
          columns={columns}
          dataSource={versions}
          pagination={false}
          scroll={{y: 480}}
          rowKey={'x.object.version.id'}
          loading={loading}
        />
      </Modal> 
      <Modal
        open={versionDiffModal.open}
        title='选择对比版本'
        width={520}
        okText="开始对比"
        onOk={handleDiffConfirm}
        onCancel={handleDiffCancel}
      >
      <Form {...layout} form={form}>
        <Form.Item label="对比版本一" name="oldVersionId" rules={[{ required: true, message: '请选择对比版本一' }, { validator: onValidate }]}> 
          <Select style={{width: '100%'}} options={items} />
        </Form.Item>
        <Form.Item label="对比版本二" name="newVersionId" rules={[{ required: true, message: '请选择对比版本二' }, { validator: onValidate }]}>
          <Select style={{width: '100%'}} options={items} />
        </Form.Item>
      </Form>
      </Modal>
    </>
  )
}