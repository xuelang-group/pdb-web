import { Drawer, Form, Input, Button } from "antd";

export default function SaveModal(props: any) {

  return (
    <Drawer title={`基本信息${props.data?.name ? `- ${props.data.name}` : ''}`} onClose={props.onClose} open={props.isOpen}>
      <Form>
        <Form.Item label="编号">{props.data?.id || "--"}</Form.Item>
        <Form.Item label="中文名称">{props.data?.name || "--"}</Form.Item>
        <Form.Item label="英文名称">{props.data?.en_name || "--"}</Form.Item>
        <Form.Item label="单位">{props.data?.unit || "--"}</Form.Item>
        <Form.Item label="描述">{props.data?.desc || "--"}</Form.Item>
        <Form.Item label="创建人">--</Form.Item>
        <Form.Item label="所属业务过程">--</Form.Item>
        <Form.Item label="相关业务过程">--</Form.Item>
        <Form.Item label="创建时间">--</Form.Item>
        <Form.Item label="更新时间">--</Form.Item>
        <Form.Item label="引用数据资产">--</Form.Item>
        <Form.Item label="数据安全保护等级">--</Form.Item>
        <Form.Item label="指标类型">--</Form.Item>
      </Form>
    </Drawer>
  )
}