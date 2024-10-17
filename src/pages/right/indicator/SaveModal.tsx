import { Modal, Form, Input, Select, Spin } from "antd";
import { StoreState } from '@/store';
import { useDispatch, useSelector } from 'react-redux';
import { getBuzProcess } from "@/actions/adapter";
import { useEffect, useState } from "react";

export default function SaveModal(props: any) {
  const [infoForm] = Form.useForm()
  const [processOptions, setProcessOptions] = useState([{ label: 'test', value: 'test' }])
  const editId = useSelector((state: StoreState) => state.indicator.editId);
  const allIndicators = useSelector((state: StoreState) => state.indicator.list);
  const requestId = useSelector((state: StoreState) => state.indicator.requestId);

  useEffect(() => {
    // getBuzProcess({ requestId: requestId }, (success:boolean, res: any) => {
    //   if (success) {
    //     setProcessOptions((res.data || []).map((item: string) => ({ label: item, value: item })))
    //   }
    // })
  }, [requestId])

  useEffect(() => {
    if (editId) {
      const { name, name_en, unit, desc } = allIndicators.find((item: any) => item.id === editId) || {}
      infoForm.setFieldsValue({ name, name_en, unit, desc })
    }
  }, [editId])

  const onOk = () => {
    infoForm.validateFields().then(values => {
      props.onOk(values)
    }).catch(err => { })
  }

  const onCancel = () => {
    infoForm.resetFields()
    props.onCancel()
  }

  return (
    <Modal
      open={props.visible}
      title={editId ? '编辑指标' : '保存指标'}
      onOk={onOk}
      onCancel={onCancel}
      okText="保存"
      cancelText="取消"
      okButtonProps={{
        loading: props.modalLoading
      }}
    >
      <Spin spinning={props.modalLoading}>
        <Form
          form={infoForm}
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
        >
          <Form.Item label="中文名称" rules={[{ required: true, message: '请输入中文名称' }]} name={'name'}>
            <Input placeholder="请输入中文名称" />
          </Form.Item>
          <Form.Item label="英文名称" rules={[{ required: true, message: '请输入英文名称' }]} name={'name_en'}>
            <Input placeholder="请输入英文名称" />
          </Form.Item>
          <Form.Item label="单位" name={'unit'}>
            <Input placeholder="请输入单位" />
          </Form.Item>
          <Form.Item label="指标描述" name={'desc'}>
            <Input.TextArea placeholder="请输入指标描述" rows={3} />
          </Form.Item>
          <Form.Item label="所属业务过程" name={'buzProcess'}>
            <Select placeholder="请选择所属业务过程" options={processOptions} disabled={!!editId}/>
          </Form.Item>
          <Form.Item label="相关业务过程">
            ---
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  )
}