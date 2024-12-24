import { Modal, Form, Input, Radio, Spin, Alert, message } from "antd";
import { StoreState } from '@/store';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from "react";
import { rollbackMetric, addMetric } from "@/actions/indicator";

export default function UseHistoryModal(props: any) {
  const [infoForm] = Form.useForm()
  const [modalLoading, setModalLoading] = useState(false)
  const editId = useSelector((state: StoreState) => state.indicator.editId);
  const checkVersionList = useSelector((state: StoreState) => state.indicator.checkVersionList);
  const nowCheckVersion = useSelector((state: StoreState) => state.indicator.nowCheckVersion);
  const list = useSelector((state: StoreState) => state.indicator.list);

  const onOk = () => {
    infoForm.validateFields().then(values => {
      if (values.type === 1) {
        setModalLoading(true)
        const version = (checkVersionList || []).find((item: any) => item.version === nowCheckVersion)
        const metric = list.find((item: any) => item.ori_id === version.ori_id)
        if(metric) {
          addMetric({
            ori_id: version.ori_id, 
            version: values.version,
            name: metric.name,
            name_cn: metric.name_cn,
            metric_params: metric.metric_params,
            pql_params: metric.pql_params,
          }, (success: boolean, res: any) => {
            if (success) {
              message.success('新增成功')
              setModalLoading(false)
              onCancel()
              props.onSuccess && props.onSuccess()
            }
          })
        }
      } else if (values.type === 2) {
        setModalLoading(true)
        const version = (checkVersionList || []).find((item: any) => item.version === nowCheckVersion)
        if(version) {
          rollbackMetric({id: version.id}, (success: boolean, res: any) => {
            if (success) {
              message.success('回滚成功')
              setModalLoading(false)
              onCancel()
              props.onSuccess && props.onSuccess()
            }
          })
        }
      }
    }).catch(err => { })
  }

  const onCancel = () => {
    infoForm.resetFields()
    props.onCancel()
  }

  return (
    <Modal
      open={props.visible}
      title='启用历史版本'
      onOk={onOk}
      onCancel={onCancel}
      okText="启用"
      cancelText="取消"
      okButtonProps={{
        loading: modalLoading
      }}
    >
      <Spin spinning={modalLoading}>
        <Form
          form={infoForm}
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
        >
        <Form.Item
          noStyle
          shouldUpdate
        >
          {
            ({ getFieldValue }) => {
              const type = getFieldValue('type')
              if (type === 2) {
                return (
                  <Alert message={`该操作将删除高于该历史版本 V${nowCheckVersion} 的所有版本记录，请谨慎操作。`} type="warning" showIcon />
                )
              }
            }
          }
        </Form.Item>
          <Form.Item
            label="新版本号"
            name='type'
            initialValue={1}
          >
            <Radio.Group>
              <Radio value={1}>保存为新版本</Radio>
              <Radio value={2}>直接回退</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate
          >
            {
              ({ getFieldValue }) => {
                const type = getFieldValue('type')
                if (type === 1) {
                  return (
                    <Form.Item
                      label="新版本号"
                      name={'version'}
                      rules={[{ required: true, message: '请输入版本号' }]}
                      tooltip="1.格式X.X.X，仅允许使用数字和.作为分隔符，不支持字母、特殊字符等。
                        2.不允许前导l零，如00.01.02是无效的，应改为0.1.2。
                        3.版本号必须递增。"
                    >
                      <Input addonBefore="V" placeholder={`请输入更高的版本号（当前版本号: ${nowCheckVersion}）`} />
                    </Form.Item>
                  )
                }
              }
            }
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  )
}