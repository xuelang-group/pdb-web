import { Input, Form, notification, Modal, message, Select } from 'antd';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setCurrentVersion, setDiffModalOpen, setDiffVersion, TypeConfig, TypeVersionConfig } from '@/reducers/type';
import { StoreState } from '@/store';
import { find, map } from 'lodash';

const layout = {
  labelCol: { span: 5 },
  wrapperCol: { span: 18 },
};

export default function VersionModal() {
  const dispatch = useDispatch();
  const diffModalOpen = useSelector((state: StoreState) => state.type.diffModalOpen);
  const currentVersion = useSelector((state: StoreState) => state.type.currentVersion);
  const diffVersion = useSelector((state: StoreState) => state.type.diffVersion);
  const versionList = useSelector((state: StoreState) => state.type.versionList);

  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      'currVersionId': currentVersion ? currentVersion['x.type.version.id'] : '',
    })
  }, [currentVersion])

  useEffect(() => {
    form.setFieldsValue({
      'diffVersionId': diffVersion ? diffVersion['x.type.version.id'] : '',
    })
  }, [diffVersion])

  const handleConfirm = () => {
    form.validateFields().then((values: { [key: string]: any; }) => {
      const { currVersionId, diffVersionId } = values
      if (!currentVersion || currentVersion["x.type.version.id"] !== currVersionId) {
        const curr = find(versionList, (item: TypeVersionConfig) => item["x.type.version.id"] === currVersionId)
        dispatch(setCurrentVersion(curr))
      }
      const diff = find(versionList, (item: TypeVersionConfig) => item["x.type.version.id"] === diffVersionId)
      dispatch(setDiffVersion(diff))
      dispatch(setDiffModalOpen(false))
    }).catch((err: any) => {

    })
  }
    
  const items = map(versionList, (v: TypeVersionConfig) => ({ value: v["x.type.version.id"], label: v["x.type.version.name"] ? `V${v["x.type.version.name"]}`: '--'}));

  const diffVersionId = form.getFieldValue('diffVersionId')
  const currVersionId = form.getFieldValue('currVersionId')

  const currOptions = diffVersionId ? items.map(item => item.value === diffVersionId ? ({...item, disabled: true}) : item) : items;
  const diffOptions = currVersionId ? items.map(item => item.value === currVersionId ? ({...item, disabled: true}) : item) : items;

  return (
    <Modal
      open={diffModalOpen}
      title="选择对比版本"
      width={520}
      destroyOnClose
      okText="开始对比"
      onOk={handleConfirm}
      onCancel={() => dispatch(setDiffModalOpen(false))}
    >
      <Form {...layout} form={form}>
        <Form.Item label="对比版本一" name="currVersionId" rules={[{ required: true, message: '请选择对比版本一' }]}> 
          <Select style={{width: '100%'}} options={currOptions} />
        </Form.Item>
        <Form.Item label="对比版本二" name="diffVersionId" rules={[{ required: true, message: '请选择对比版本二' }]}>
          <Select style={{width: '100%'}} options={diffOptions} />
        </Form.Item>
      </Form>
    </Modal>
  )
}