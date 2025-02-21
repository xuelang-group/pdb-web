import { Input, Form, notification, Modal, message, Select } from 'antd';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setSelectedVersion, setDiffModalOpen, setDiffVersion, TypeConfig, TypeVersionConfig } from '@/reducers/type';
import { StoreState } from '@/store';
import { find, map } from 'lodash';

const layout = {
  labelCol: { span: 5 },
  wrapperCol: { span: 18 },
};

export default function VersionModal() {
  const dispatch = useDispatch();
  const diffModalOpen = useSelector((state: StoreState) => state.type.diffModalOpen);
  const selectedVersion = useSelector((state: StoreState) => state.type.selectedVersion);
  const versionList = useSelector((state: StoreState) => state.type.versionList);

  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      'oldVersionId': selectedVersion ? selectedVersion['x.type.version.id'] : '',
    })
  }, [selectedVersion])

  const handleCancel = () => {
    dispatch(setDiffModalOpen(false))
    dispatch(setDiffVersion(undefined))
  }

  const handleConfirm = () => {
    form.validateFields().then((values: { [key: string]: any; }) => {
      const { oldVersionId, newVersionId } = values
      dispatch(setDiffVersion([oldVersionId, newVersionId]))
      dispatch(setDiffModalOpen(false))
    }).catch((err: any) => { })
  }
    
  const items = map(versionList, (v: TypeVersionConfig) => ({ value: v["x.type.version.id"], label: v["x.type.version.name"] ? `V${v["x.type.version.name"]}`: '--'}));

  const oldVersionId = form.getFieldValue('oldVersionId')
  const newVersionId = form.getFieldValue('newVersionId')

  const oldOptions = newVersionId ? items.map(item => item.value === newVersionId ? ({...item, disabled: true}) : item) : items;
  const newOptions = oldVersionId ? items.map(item => item.value === oldVersionId ? ({...item, disabled: true}) : item) : items;

  return (
    <Modal
      open={diffModalOpen}
      title="选择对比版本"
      width={520}
      destroyOnClose
      okText="开始对比"
      onOk={handleConfirm}
      onCancel={handleCancel}
    >
      <Form {...layout} form={form}>
        <Form.Item label="对比版本一" name="oldVersionId" rules={[{ required: true, message: '请选择对比版本一' }]}> 
          <Select style={{width: '100%'}} options={oldOptions} />
        </Form.Item>
        <Form.Item label="对比版本二" name="newVersionId" rules={[{ required: true, message: '请选择对比版本二' }]}>
          <Select style={{width: '100%'}} options={newOptions} />
        </Form.Item>
      </Form>
    </Modal>
  )
}