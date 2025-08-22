import { Drawer, Form, Input, Button, message } from "antd";
import { useEffect, useState } from "react";
import { StoreState } from '@/store';
import { useDispatch, useSelector } from 'react-redux';
import { getMetrics, updateMetric } from "@/actions/indicator";
import './index.less';
import { setMetrics } from "@/reducers/indicator";
import { setIndicatorLoading } from "@/reducers/editor";
import moment from "moment";

export default function SaveModal(props: any) {
  const dispatch = useDispatch();
  const [infoForm] = Form.useForm();
  const [isEdit, setIsEdit] = useState(false);
  const currentBuzProcess = useSelector((state: StoreState) => state.indicator.currentBuzProcess);

  useEffect(() => {
    if (props.data) {
      infoForm.setFieldsValue({
        name: props.data?.name,
        name_cn: props.data?.name_cn,
        unit: props.data?.unit,
        desc: props.data?.desc,
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
        name_cn: values.name_cn,
        unit: values.unit,
        desc: values.desc,
        metric_params: props.data?.metric_params,
        pql_params:  props.data?.pql_params,
      }
      console.log(postObj)
      updateMetric(postObj, (success: boolean, res: any) => {
        if (success) {
          message.success("编辑成功");
          if (props.data.name !== values.name || props.data.name_cn !== values.name_cn) {    
            dispatch(setIndicatorLoading(true));        
            getMetrics(function (response: any) {
              if (response) {
                dispatch(setMetrics(response || []));
              } else {
                message.error('获取列表数据失败：' + response.message || response.msg);
              }
              dispatch(setIndicatorLoading(false));
            })
          }
          onCancel()
        } else {
          message.error('编辑指标失败：' + res.message || res.msg);
        }
      })
    })
  }

  return (
    <Drawer 
      title={`基本信息${props.data?.name ? `- ${props.data?.name}` : ''}${isEdit? " - 编辑" : ""}`}
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
              <Form.Item label="中文名称" name='name_cn'><Input placeholder="请输入中文名称" /></Form.Item>
              <Form.Item label="英文名称" name='name'><Input placeholder="请输入英文名称" /></Form.Item>
              <Form.Item label="单位" name='unit'><Input placeholder="请输入单位" /></Form.Item>
              <Form.Item label="描述" name='desc'><Input.TextArea placeholder="请输入指标描述" rows={3} /></Form.Item>
            </>
          ) : (
            <>
              <Form.Item label="中文名称" name='name_cn' initialValue={props.data?.name_cn}>{props.data?.name_cn || "--"}</Form.Item>
              <Form.Item label="英文名称" name='name' initialValue={props.data?.name}>{props.data?.name || "--"}</Form.Item>
              <Form.Item label="单位" name='unit' initialValue={props.data?.unit}>{props.data?.unit || "--"}</Form.Item>
              <Form.Item label="描述" name='desc' initialValue={props.data?.desc}>{props.data?.desc || "--"}</Form.Item>
            </>
          )
        }
        <Form.Item label="版本号">{props.data?.version || "--"}</Form.Item>
        <Form.Item label="创建人">{ props.data?.creatorId || "--"}</Form.Item>
        <Form.Item label="所属业务过程">{props.data?.buzProcess?.name || "--"}</Form.Item>
        <Form.Item label="相关业务过程">--</Form.Item>
        <Form.Item label="创建时间">{props.data?.created_at ? moment(props.data?.created_at).format("YYYY-MM-DD HH:mm:ss") : "--"}</Form.Item>
        <Form.Item label="更新时间">{props.data?.updated_at ? moment(props.data?.updated_at).format("YYYY-MM-DD HH:mm:ss") : "--"}</Form.Item>
        <Form.Item label="引用数据资产">--</Form.Item>
        <Form.Item label="数据安全保护等级">--</Form.Item>
        <Form.Item label="指标类型">{props.data?.type === 2 ? "高级指标" : "初级指标"}</Form.Item>
      </Form>
    </Drawer>
  )
}