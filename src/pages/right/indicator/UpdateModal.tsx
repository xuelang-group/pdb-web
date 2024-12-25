import { Modal, Form, Input, Select, Spin } from "antd";
import { StoreState } from '@/store';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from "react";

export default function UpdateModal(props: any) {
  const [infoForm] = Form.useForm()
  const [initVersion, setInitVersion] = useState('')
  const editId = useSelector((state: StoreState) => state.indicator.editId);
  const allIndicators = useSelector((state: StoreState) => state.indicator.list);

  useEffect(() => {
    const metric = allIndicators.find((item: any) => item.id === editId)
    if(metric) {
      setInitVersion(metric.version)
    }
  }, [editId, allIndicators])

  const onOk = () => {
    infoForm.validateFields().then(values => {
      const metric = allIndicators.find((item: any) => item.id === editId)
      const newValues = {
       ...metric,
        version: values.version
      }
      props.onOk(newValues)
    }).catch(err => { })
  }

  const onCancel = () => {
    infoForm.resetFields()
    props.onCancel()
  }

  return (
    <Modal
      open={props.visible}
      title='更新指标'
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
          <Form.Item
            label="新版本号"
            name={'version'}
            rules={[
              { required: true, message: '请输入版本号' },
              { 
                pattern: /^(0|[1-9]\d*)(\.(0|[1-9]\d*)){2}$/, 
                message: '版本号格式不正确，应该是 X.X.X 的格式，且不允许有前导零',
              },
            ]}
            tooltip="1.格式X.X.X，仅允许使用数字和.作为分隔符，不支持字母、特殊字符等。
              2.不允许前导l零，如00.01.02是无效的，应改为0.1.2。
              3.版本号必须递增。"
          >
            <Input addonBefore="V" placeholder={`请输入更高的版本号（当前版本号: ${initVersion}）`} />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  )
}