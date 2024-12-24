import { Modal, Form, Input, Select, Spin } from "antd";
import { StoreState } from '@/store';
import { useDispatch, useSelector } from 'react-redux';
import { getBuzProcess } from "@/actions/adapter";
import { useEffect, useState } from "react";

const versionRegex = /^\d+\.\d+\.\d+(-[0-9]+(\.[0-9]+)*)?(\+[0-9]+)?$/;
export default function SaveModal(props: any) {
  const [infoForm] = Form.useForm()
  const [processOptions, setProcessOptions] = useState([{ label: 'test', value: 'test' }])
  const editId = useSelector((state: StoreState) => state.indicator.editId);
  const allIndicators = useSelector((state: StoreState) => state.indicator.list);
  const requestId = useSelector((state: StoreState) => state.indicator.requestId);
  const currentBuzProcess = useSelector((state: StoreState) => state.indicator.currentBuzProcess);

  useEffect(() => {
    if(requestId) {
      getBuzProcess({ requestId: requestId }, (success:boolean, res: any) => {
        if (success) {
          setProcessOptions((res.data || []).map((item: string) => ({ label: item, value: item })))
        }
      })
    }
  }, [requestId])

  useEffect(() => {
    if (editId) {
      const { name, name_cn, unit, desc } = allIndicators.find((item: any) => item.id === editId) || {}
      infoForm.setFieldsValue({ name, name_cn, unit, desc })
      if(currentBuzProcess) {
        infoForm.setFieldValue('buzProcess', currentBuzProcess)
      }
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
          <Form.Item label="中文名称" rules={[{ required: true, message: '请输入中文名称' }]} name={'name_cn'}>
            <Input placeholder="请输入中文名称" />
          </Form.Item>
          <Form.Item label="英文名称" rules={[{ required: true, message: '请输入英文名称' }]} name={'name'}>
            <Input placeholder="请输入英文名称" />
          </Form.Item>
          <Form.Item label="单位" name={'unit'}>
            <Input placeholder="请输入单位" />
          </Form.Item>
          <Form.Item label="指标描述" name={'desc'}>
            <Input.TextArea placeholder="请输入指标描述" rows={3} />
          </Form.Item>
          <Form.Item
            label="版本号"
            name={'version'}
            rules={[
              { required: true, message: '请输入版本号' },
              { 
                pattern: /^(0|[1-9]\d*)(\.(0|[1-9]\d*)){2}$/, 
                message: '版本号格式不正确，应该是 X.X.X 的格式，且不允许有前导零',
              },
            ]}
            tooltip="1.格式X.X.X，仅允许使用数字和.作为分隔符，不支持字母、特殊字符等。
              2.不允许前导l零，如00.01.02是无效的，应改为0.1.2。"
          >
            <Input addonBefore="V" placeholder="仅允许数字以.为分隔符，例:1.0.0" />
          </Form.Item>
          <Form.Item label="所属业务过程" name={'buzProcess'} rules={[{ required: true, message: '请选择所属业务过程' }]}>
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