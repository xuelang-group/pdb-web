import PdbPanel from "@/components/Panel";
import { Button, Form, InputRef, Select, message } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import React, { useState, useRef, useEffect } from "react";
import { StoreState } from '@/store';
import { useDispatch, useSelector } from 'react-redux';
import SaveModal from "./SaveModal";
import { setIndicatorLoading } from '@/reducers/editor';
import { getMetrics } from "@/actions/indicator";
import { setGroupBy, setDimention, setFunc, exit, setEditId, setMetrics } from "@/reducers/indicator";
import { addMetric, updateMetric } from "@/actions/indicator";
import { useParams } from "react-router-dom"; 

export default function Right(props: any) {
  const [modalLoading, setModalLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [infoForm] = Form.useForm();
  const columnsOptions = useSelector((state: StoreState) => state.indicator.columns); 
  const funcOptions = useSelector((state: StoreState) => state.indicator.funcOptions);
  const dimention = useSelector((state: StoreState) => state.indicator.dimention);
  const checkId = useSelector((state: StoreState) => state.indicator.checkId);
  const editId = useSelector((state: StoreState) => state.indicator.editId);
  const func = useSelector((state: StoreState) => state.indicator.func || undefined);
  const groupBy = useSelector((state: StoreState) => (state.indicator.groupBy?.length ? state.indicator.groupBy : [undefined]));
  const api = useSelector((state: StoreState) => state.query.api);
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
    const postObj: any = {
      name: values.name,
      name_en: values.name_en,
      unit: values.unit,
      desc: values.desc,
      metric_params: {
        dimention: dimention,
        func: func,
        group_by: groupBy,
      },
      pql_params: {
        api: api,
        params: query,
      },
    }
    setModalLoading(true)
    if (editId) {
      postObj.id = editId
      updateMetric(postObj, (success: boolean, res: any) => {
        if (success) {
          dispatch(setIndicatorLoading(true));
          updateList(() => {
            setModalVisible(false)
            message.success('编辑指标成功');
          })
        } else {
          message.error('编辑指标失败：' + res.message || res.msg);
        }
        setModalLoading(false)
      })
    } else {
      addMetric(postObj, (success: boolean, res: any) => {
        if (success) {
          dispatch(setIndicatorLoading(true));
          updateList(() => {
            setModalVisible(false)
            message.success('保存指标成功');
          })
        } else {
          message.error('保存指标失败：' + res.message || res.msg);
        }
        setModalLoading(false)
      })
    }
  }

  
  const updateList = (callback: Function ) => {
    getMetrics(function (response: any) {
      if (response) {
        dispatch(setMetrics(response || []));
      } else {
        message.error('获取列表数据失败：' + response.message || response.msg);
      }
      callback && callback()
      dispatch(setIndicatorLoading(false));
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
                    disabled={!!checkId}
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
                    disabled={!!checkId}
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
                              disabled={!!checkId}
                            />
                          </Form.Item>
                          {((fields.length > 1 || infoForm.getFieldValue('names')?.[0]) && !checkId) ? (
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
                        (infoForm.getFieldValue('names')?.[fields.length - 1]  && !checkId) && (
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
                  dispatch(setEditId(checkId));
                }}
                style={{ marginRight: '17px', marginLeft: '17px', marginBottom: '16px' }}
              >
                编辑指标
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
      <SaveModal visible={modalVisible} onCancel={() => {setModalVisible(false)}} onOk={onSave} modalLoading={modalLoading} />
    </div>
  )
}