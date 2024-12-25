import { Modal, Form, Input, Select, Spin } from "antd";
import { StoreState } from '@/store';
import { useDispatch, useSelector } from 'react-redux';
import { getBuzProcess } from "@/actions/adapter";
import { useEffect, useState } from "react";
import { isArray } from "lodash";

const versionRegex = /^\d+\.\d+\.\d+(-[0-9]+(\.[0-9]+)*)?(\+[0-9]+)?$/;
export default function SaveModal(props: any) {
  const [infoForm] = Form.useForm()
  const [processOptions, setProcessOptions] = useState([{ label: 'test', value: 'test' }])
  const [buzProcessArr, setBuzProcessArr] = useState([])
  const editId = useSelector((state: StoreState) => state.indicator.editId);
  const allIndicators = useSelector((state: StoreState) => state.indicator.list);
  const requestId = useSelector((state: StoreState) => state.indicator.requestId);
  const currentBuzProcess = useSelector((state: StoreState) => state.indicator.currentBuzProcess);
  const query = useSelector((state: StoreState) => state.query.params);

  useEffect(() => {
    if(requestId && query.pql?.length) {
      console.log('requestId', requestId, 'query', query)
      const strArr: string[] = []
      query.pql.forEach((item: any) => {
        if(isArray(item)) {
          item.forEach((subItem: any) => {
            if(subItem.id) {
              strArr.push(subItem.id)
            }
          })
        }
      })
      console.log({ requestId: requestId, xTypeNames: strArr })
      getBuzProcess({ requestId: requestId, xTypeNames: strArr }, (success:boolean, res: any) => {
        if (success) {
          setBuzProcessArr(res.data || [])
          setProcessOptions((res.data || []).map((item: any) => ({ label: item?.name || item, value: item?.id || item })))
        }
      })
    }
  }, [requestId, query])

  useEffect(() => {
    if (editId) {
      const { name, name_cn, unit, desc } = allIndicators.find((item: any) => item.id === editId) || {}
      infoForm.setFieldsValue({ name, name_cn, unit, desc })
      if(currentBuzProcess) {
        infoForm.setFieldValue('buzProcess', currentBuzProcess.id)
      }
    }
  }, [editId])

  const onOk = () => {
    infoForm.validateFields().then(values => {
      if(values.buzProcess) {
        const buzProcess = buzProcessArr.find((item: any) => item.id === values.buzProcess)
        if(buzProcess) {
          values.buzProcess = buzProcess
        }
      }
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