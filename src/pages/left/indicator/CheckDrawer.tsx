import { Drawer, Form, Input, Button, message } from "antd";
import { useEffect, useState } from "react";
import { updateMetric } from "@/actions/indicator";
import './index.less';

export default function SaveModal(props: any) {
  const [infoForm] = Form.useForm();
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    if (props.data) {
      infoForm.setFieldsValue({
        name: props.data.name,
        name_en: props.data.name_en,
        unit: props.data.unit,
        desc: props.data.desc,
      })
    }
  }, [props.data])

  const onCancel = () => {
    setIsEdit(false);
    infoForm.resetFields();
    props.onClose();
  }

  const onSave = () => {
    infoForm.validateFields().then(values => {
      const postObj = {
        id: props.data?.id,
        name: values.name,
        name_en: values.name_en,
        unit: values.unit,
        desc: values.desc,
        metric_params: props.data?.metric_params,
        pql_params:  props.data?.pql_params,
      }
      console.log(postObj)
      updateMetric(postObj, (success: boolean, res: any) => {
        if (success) {
          message.success("编辑成功");
          onCancel()
        } else {
          message.error('编辑指标失败：' + res.message || res.msg);
        }
      })
    })
  }

  return (
    <Drawer 
      title={`基本信息${props.data?.name ? `- ${props.data.name}` : ''}${isEdit? " - 编辑" : ""}`}
      onClose={onCancel} 
      open={props.isOpen}
      footer={(
        <div className="check-info-drawer-footer">
          <Button onClick={onCancel}>关闭</Button>
          {
            isEdit 
            ? <Button type="primary" onClick={onSave} className="check-info-drawer-footer-btn">保存</Button> 
            : <Button type="primary" onClick={() => setIsEdit(true)} className="check-info-drawer-footer-btn">编辑</Button>
          }
        </div>
      )}
    >
      <Form form={infoForm}>
        <Form.Item label="编号">{props.data?.id || "--"}</Form.Item>
        {
          isEdit ? (
            <>
              <Form.Item label="中文名称" name='name'><Input placeholder="请输入中文名称" /></Form.Item>
              <Form.Item label="英文名称" name='name_en'><Input placeholder="请输入英文名称" /></Form.Item>
              <Form.Item label="单位" name='unit'><Input placeholder="请输入单位" /></Form.Item>
              <Form.Item label="描述" name='desc'><Input.TextArea placeholder="请输入指标描述" rows={3} /></Form.Item>
            </>
          ) : (
            <>
              <Form.Item label="中文名称" name='name' initialValue={props.data?.name}>{props.data?.name || "--"}</Form.Item>
              <Form.Item label="英文名称" name='name_en' initialValue={props.data?.name_en}>{props.data?.name_en || "--"}</Form.Item>
              <Form.Item label="单位" name='unit' initialValue={props.data?.unit}>{props.data?.unit || "--"}</Form.Item>
              <Form.Item label="描述" name='desc' initialValue={props.data?.desc}>{props.data?.desc || "--"}</Form.Item>
            </>
          )
        }
        <Form.Item label="创建人">--</Form.Item>
        <Form.Item label="所属业务过程">{props.data?.buzProcess || "--"}</Form.Item>
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