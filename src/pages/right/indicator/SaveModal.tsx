import { Modal, Form, Input, Select} from "antd";

export default function SaveModal(props: any) {
  const [infoForm] = Form.useForm()

  const onOk = () => {
    infoForm.validateFields().then(values => {
      props.onOk(values)
    })
  }

  return (
    <Modal
      visible={props.visible}
      title="保存指标"
      onOk={onOk}
      onCancel={props.onCancel}
      okText="保存"
      cancelText="取消"
    >
      <Form 
        form={infoForm}
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
      >
        <Form.Item label="中文名称" rules={[{ required: true, message: '请输入中文名称' }]} name={'name'}>
          <Input placeholder="请输入中文名称" />
        </Form.Item>
        <Form.Item label="英文名称" rules={[{ required: true, message: '请输入英文名称' }]} name={'en_name'}>
          <Input placeholder="请输入英文名称" />
        </Form.Item>
        <Form.Item label="单位" rules={[{ required: true, message: '请输入单位' }]} name={'unit'}>
          <Input placeholder="请输入单位" />
        </Form.Item>
        <Form.Item label="指标描述"  name={'desc'}>
          <Input.TextArea placeholder="请输入指标描述" rows={3}/>
        </Form.Item>
        {/* <Form.Item label="所属业务过程" rules={[{ required: true, message: '请选择所属业务过程' }]} name={'process'}>
          <Select placeholder="请选择所属业务过程" />
        </Form.Item> */}
        <Form.Item label="相关业务过程">
          ---
        </Form.Item>
      </Form>
    </Modal>
  )
}