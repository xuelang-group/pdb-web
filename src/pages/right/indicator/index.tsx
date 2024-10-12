import PdbPanel from "@/components/Panel";
import { Input, Button, Form, InputRef, Tabs, Spin, notification, InputNumber, Select, DatePicker, Modal, Empty, Divider, Switch, Tooltip } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import React, { useState, useRef, useEffect } from "react";
import { StoreState } from '@/store';
import { useDispatch, useSelector } from 'react-redux';
import SaveModal from "./SaveModal";
import { setGroupBy, setDimention, setFunc, exit } from "@/reducers/indicator";
import { addMetric } from "@/actions/indicator";
import { useParams } from "react-router-dom";

export default function Right(props: any) {
  const [modalVisible, setModalVisible] = useState(false);
  const [infoForm] = Form.useForm();
  const columnsOptions = useSelector((state: StoreState) => state.indicator.columns); 
  const funcOptions = useSelector((state: StoreState) => state.indicator.funcOptions);
  const dimention = useSelector((state: StoreState) => state.indicator.dimention);
  const checkId = useSelector((state: StoreState) => state.indicator.checkId);
  const editId = useSelector((state: StoreState) => state.indicator.editId);
  const func = useSelector((state: StoreState) => state.indicator.func || undefined);
  const groupBy = useSelector((state: StoreState) => (state.indicator.groupBy?.length ? state.indicator.groupBy : [undefined]));
  const query = useSelector((state: StoreState) => state.query.params);
  const inputRef = useRef<InputRef>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    infoForm.setFieldValue('names', groupBy)
  }, [groupBy])

  const onGroupByChange = () => {
    dispatch(setGroupBy(infoForm.getFieldValue('names') || []));
  }

  const onSave = (values: any) => {
    const postObj = {
      name: values.name,
      unit: values.unit,
      desc: values.desc,
      metric_params: {
        dimention: dimention,
        func: func,
        group_by: groupBy,
      },
      pql_params: query,
    }
    addMetric(postObj, () => {
      setModalVisible(false)
      notification.success({
        message: '保存成功',
        description: '指标配置已保存',
        duration: 2,
      });
    })
  }

  return (
    <div className='pdb-right-panel'>
      <PdbPanel title='指标配置' direction='right' canCollapsed={true} >
        <Form
          form={infoForm}
          style={{ maxWidth: 600 }}
          autoComplete='off'
          layout='vertical'
        >
          <div className='pdb-app-info'>
            <Form.Item
              label='指标度量'
            >
                <Form.Item label={''} >
                  <Select
                    placeholder='请选择指标度量'
                    options={(columnsOptions || []).map((item) => ({ label: item.field, value: item.field }))}
                    onChange={(value) => { dispatch(setDimention(value)) }}
                    value={dimention}
                  />
                </Form.Item>
            </Form.Item>
            <Form.Item
              label='统计算法'
            >
                <Form.Item label={''} >
                  <Select
                    value={func}
                    placeholder='请选择指标度量'
                    // options={[
                    //   { label: 'sum', value:'sum' },
                    //   { label: 'avg', value: 'avg' },
                    //   { label: 'median', value:'median' },
                    //   { label:'min', value:'min' },
                    //   { label:'max', value:'max' },
                    // ]}
                    options={funcOptions.map((item) => ({ label: item, value: item }))}
                    onChange={(value) => { dispatch(setFunc(value)) }}
                  />
                </Form.Item>
            </Form.Item>
            <Form.Item
              label='Group by'
              colon={false}
              shouldUpdate
            >
              <Form.List
                name="names"
                initialValue={groupBy}
              >
                {(fields, { add, remove }, { errors }) => (
                  <>
                    {fields.map((field, index) => (
                      <Form.Item
                        label={''}
                        required={false}
                        key={field.key}
                      >
                        <div style={{display: 'flex', justifyContent:'space-between'}}>
                          <Form.Item
                            {...field}
                            noStyle
                          >
                            <Select
                              placeholder='请选择'
                              options={(columnsOptions || []).map((item) => ({ label: item.field, value: item.field, disabled: infoForm.getFieldValue('names')?.includes(item.field) }))}
                              onChange={(value) => {
                                infoForm.setFieldsValue({
                                  names: infoForm.getFieldValue('names').map((item: any, i: number) => {
                                    if (i === index) {
                                      return value
                                    }
                                    return item
                                  })
                                })
                                onGroupByChange()
                              }}
                            />
                          </Form.Item>
                          {(fields.length > 1 || infoForm.getFieldValue('names')?.[0]) ? (
                            <DeleteOutlined 
                              className="dynamic-delete-button"
                              onClick={() => {
                                if(index === 0) {
                                  infoForm.setFieldsValue({
                                    names: [undefined]
                                  })
                                } else {
                                  remove(field.name)
                                }
                                onGroupByChange()
                              }}
                              style={{marginLeft: 8}}
                            />
                          ) : null}
                        </div>
                      </Form.Item>
                    ))}
                    <Form.Item>
                      {
                        infoForm.getFieldValue('names')?.[fields.length - 1] && (
                          <Button
                            type="dashed"
                            onClick={() => add()}
                            style={{ width: '100%' }}
                            icon={<PlusOutlined />}
                          />
                        )
                      }
                      <Form.ErrorList errors={errors} />
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </Form.Item>
          </div>
        </Form>
        {
          checkId && (
            <div style={{marginTop: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column' }}>
              <Button 
                type="primary"
                onClick={() => {
                  setModalVisible(true)
                }}
                style={{ marginRight: '17px', marginLeft: '17px', marginBottom: '16px' }}
              >
                保存指标
              </Button>
              <Button 
                onClick={() => {
                  dispatch(exit())
                }}
                style={{ marginRight: '17px', marginLeft: '17px'}}
              >
                退出
              </Button>
            </div>
          )
        }
        {
          editId && (
            <div style={{marginTop: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column' }}>
              <Button 
                type="primary"
                onClick={() => {
                  setModalVisible(true)
                }}
                style={{ marginRight: '17px', marginLeft: '17px', marginBottom: '16px' }}
              >
                更新指标
              </Button>
              <Button 
                onClick={() => {
                  dispatch(exit())
                }}
                style={{ marginRight: '17px', marginLeft: '17px'}}
              >
                退出
              </Button>
            </div>
          )
        }
        {
          !checkId && !editId && (
            <Button 
              type="primary"
              onClick={() => {
                setModalVisible(true)
              }}
              style={{ marginTop: 'auto', marginRight: '17px', marginLeft: '17px', marginBottom: '16px' }}
            >
              保存指标
            </Button>
          )
        }
      </PdbPanel>
      <SaveModal visible={modalVisible} onCancel={() => {setModalVisible(false)}} onOk={onSave}/>
    </div>
  )
}