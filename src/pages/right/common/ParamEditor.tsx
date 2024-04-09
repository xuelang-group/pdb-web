import { Input, Button, Form, Select, InputNumber, Checkbox, notification, DatePicker } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import moment from 'moment';

import { typeMap } from '@/utils/common';
import { StoreState } from '@/store';
import { getType } from '@/actions/type';
import PdbPanel from '@/components/Panel';

const { Option } = Select;
export default function ParamEditor(props: any) {
  const [paramForm] = Form.useForm();
  const { params, attrs } = props;

  const types = useSelector((state: StoreState) => state.type.data);
  const relations = useSelector((state: StoreState) => state.relation.data);

  const [allData, setAllData] = useState([] as any), // 关联属性 - 关联对象下拉框列表
    [objectAttrs, setObjectAttrs] = useState([] as any); // 关联属性 - 关联属性下拉框列表

  useEffect(() => {
    if (params && params.type === 'datetime') {
      const _default = params.default ? moment(params.default, params.datetimeFormat) : ''
      paramForm.setFieldsValue({
        ...params,
        default: _default
      });
    } else {
      if (params.isNew) paramForm.resetFields();
      paramForm.setFieldsValue({
        ...params
      });
    }
  }, [params]);

  const close = function (savedTypes?: any) {
    props.cancel(savedTypes);
    paramForm.resetFields();
  }

  // 保存
  const save = () => {
    paramForm.validateFields().then(value => {
      const _default = value.default;
      const { type, name, display, referObject, referProperty, required, listType, listEnums, datetimeFormat, stringMaxLength } = value;
      let newData = { type, name, display };

      switch (type) {
        case 'refer':
          Object.assign(newData, { referObject, referProperty });
          break;
        case 'list':
          const list_default = currentEnumDefault > -1 && listEnums[currentEnumDefault] ? listEnums[currentEnumDefault]['value'] : '';
          Object.assign(newData, { required, listType, listEnums, default: list_default });
          break;
        case 'datetime':
          if (_default) {
            Object.assign(newData, { default: _default.format(datetimeFormat) });
          }
          Object.assign(newData, { required, datetimeFormat });
          break;
        case 'string':
          Object.assign(newData, { default: _default, required, stringMaxLength });
          break;
        case 'text':
        case 'boolean':
          Object.assign(newData, { default: _default, required });
          break;
        default:
          Object.assign(newData, { default: _default ? Number(_default) : '', required });
          break;
      }

      const savedTypes = JSON.parse(JSON.stringify(attrs));
      if (savedTypes[params.index]) {
        Object.assign(savedTypes[params.index], newData);
      } else {
        savedTypes.push(newData)
      }

      close(savedTypes);
    }).catch(err => {
      console.log(err)
    });
  }

  const itemType = Form.useWatch('type', paramForm), // 监听属性类型变化
    referObject = Form.useWatch('referObject', paramForm), // 监听关联属性 - 关联对象
    listType = Form.useWatch('listType', paramForm), // 监听值列表 - 字段类型
    listEnums = Form.useWatch('listEnums', paramForm), // 监听值列表 - 枚举列表
    datetimeFormat = Form.useWatch('datetimeFormat', paramForm), // 监听日期时间 - 格式
    stringMaxLength = Form.useWatch('stringMaxLength', paramForm); // 监听单行文本 - 最大长度

  useEffect(() => {
    if (itemType === 'refer') {
      setAllData(props.currentEditType === 'type' ? types : relations);
    }
    paramForm.setFieldValue('defalut', '');
  }, [itemType]);

  useEffect(() => {
    if (referObject && props.currentEditType === 'type') {
      getType(referObject, (success: boolean, response: any) => {
        if (success) {
          const info = response[0];
          if (info) {
            setObjectAttrs(info['x.type.attrs'] || []);
          }
        } else {
          notification.error({
            message: '获取类型属性失败',
            description: response.message || response.msg
          });
        }
      });
    }
  }, [referObject]);

  const [currentEnumDefault, setEnumDefault] = useState(-1);
  const handleChangeEnumDefault = (event: any, index: number) => {
    const checked = event.target.checked;
    if (listEnums && currentEnumDefault > -1) {
      listEnums[currentEnumDefault].default = false;
      listEnums[index].default = true;
      paramForm.setFieldValue('listEnums', listEnums);
    }
    setEnumDefault(checked ? index : -1);
  }

  const renderDefaultInput = () => {
    switch (itemType) {
      case 'boolean':
        return (
          <Select>
            <Option value={true}>True</Option>
            <Option value={false}>False</Option>
          </Select>
        );
      case 'datetime':
        return (<DatePicker showTime={datetimeFormat !== 'YYYY-MM-DD'} format={datetimeFormat} />);
      case 'string':
        return (<Input maxLength={stringMaxLength} />);
      case 'text':
        return (<TextArea />);
      case 'int':
        return (<InputNumber precision={0} />);
      default:
        return (<InputNumber />);
    }
  }

  const handleChangeListType = (type: string) => {
    const newListEnums = listEnums.map((item: any) => {
      let newValue = item.value;

      if (typeof newValue === 'number' && type === 'string') {
        newValue = newValue.toString();
      } else if (typeof newValue === 'string' && type !== 'string') {
        // 不是整数也不是浮点数
        if (/^-?\d+$/.test(newValue) || /^-?\d+\.\d+$/.test(newValue)) {
          newValue = Number(newValue);
        }
      }

      return {
        ...item,
        value: newValue
      };
    });
    paramForm.setFieldValue('listEnums', newListEnums);
    paramForm.validateFields();
  }

  const prevLabel = props.currentEditType === 'type' ? 'x.type' : 'r.type';
  return (
    <PdbPanel className='pdb-param-editor pdb-edit-tools' title={params?.isNew ? '新增属性' : '属性编辑'} direction='right' canCollapsed={false}>
      <Form form={paramForm} layout="vertical">
        <Form.Item name='type' label='类型' rules={[{ required: true, message: '类型不能为空' }]}>
          <Select>
            {Object.keys(typeMap[props.currentEditType]).map(value => (
              <Option key={value} value={value}>{typeMap[props.currentEditType][value]}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name='name'
          label='名称（唯一标识）'
          rules={[
            { required: true, message: '名称不能为空' },
            {
              validator: async (_, value) => {
                const _attrs = JSON.parse(JSON.stringify(attrs));
                if (!value) return;
                if (_attrs && _attrs.findIndex((attr: any, index: number) => attr.name === value && params.index !== index) > -1) {
                  throw new Error('该名称已被使用');
                } else if (!/^[a-zA-Z0-9_]*$/.test(value)) {
                  throw new Error('名称只包含字母、数字、“_” ');
                } else if (!/[a-zA-Z].*/.test(value)) {
                  throw new Error('名称必须以字母开头');
                }
              }
            }
          ]}
        >
          <Input placeholder={itemType === 'refer' ? 'refer' : ''} />
        </Form.Item>
        <Form.Item name='display' label='展示名称' rules={[{ required: true, message: '展示名称不能为空' }]}>
          <Input />
        </Form.Item>
        {itemType === 'refer' ?
          <>
            <Form.Item name='referObject' label='关联对象' rules={[{ required: true, message: '关联对象不能为空' }]}>
              <Select
                showSearch
                filterOption={(input, option) =>
                ((option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase()) ||
                  (option?.value ?? '').toString() === input)
                }
              >
                {allData.map((item: any) => (
                  <Option key={item.uid} value={item.uid}>{item[`${prevLabel}.name`]}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name='referProperty' label='关联属性' rules={[{ required: true, message: '关联对象不能为空' }]}>
              <Select
                showSearch
                filterOption={(input, option) =>
                ((option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase()) ||
                  (option?.value ?? '').toString() === input)
                }
              >
                {objectAttrs.map((item: any) => (
                  item.type !== 'refer' && <Option value={item.name}>{item.display}</Option>
                ))}
              </Select>
            </Form.Item>
          </> :
          <>
            {itemType == 'datetime' &&
              <Form.Item name='datetimeFormat' label='格式' rules={[{ required: true, message: '格式不能为空' }]} initialValue={'YYYY-MM-DD'}>
                <Select>
                  <Option key="YYYY-MM-DD" value="YYYY-MM-DD">YYYY-MM-DD</Option>
                  <Option key="YYYY-MM-DD hh" value="YYYY-MM-DD hh">YYYY-MM-DD hh</Option>
                  <Option key="YYYY-MM-DD hh:mm" value="YYYY-MM-DD hh:mm">YYYY-MM-DD hh:mm</Option>
                  <Option key="YYYY-MM-DD hh:mm:ss" value="YYYY-MM-DD hh:mm:ss">YYYY-MM-DD hh:mm:ss</Option>
                </Select>
              </Form.Item>
            }
            {itemType !== 'list' &&
              <Form.Item name='default' label='默认值'>
                {renderDefaultInput()}
              </Form.Item>
            }
            {itemType == 'list' &&
              <>
                <Form.Item name='listType' label='字段类型' rules={[{ required: true, message: '字段类型不能为空' }]} initialValue="int">
                  <Select onChange={handleChangeListType}>
                    <Option key="int" value="int">整数</Option>
                    <Option key="float" value="float">浮点数</Option>
                    <Option key="string" value="string">单行文本</Option>
                  </Select>
                </Form.Item>
                <Form.Item className='enums-label' label='枚举列表'>
                </Form.Item>
                <div className='enums-list'>
                  <div className='enums-row'>
                    <span className='enums-item'>选项值</span>
                    <span className='enums-item'>选项名称</span>
                    <span className='enums-item'>是否默认</span>
                    <span className='enums-item'></span>
                  </div>
                  <Form.List name="listEnums">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restField }) => (
                          <div key={key} className='enums-row'>
                            <Form.Item
                              {...restField}
                              name={[name, 'value']}
                              dependencies={[["listEnums", key, "value"]]}
                              className='enums-item'
                              rules={[
                                {
                                  validator: async (_, value) => {
                                    if (!value) {
                                      throw new Error("");
                                    } else if (listEnums.findIndex((val: any, index: number) => val.value === value && index !== key) > -1) {
                                      throw new Error('选项值已存在');
                                    } else if ((typeof value === 'number' && listType === 'string') ||
                                      (typeof value === 'string' && listType !== 'string')) {
                                      throw new Error('类型不一致');
                                    }
                                  }
                                }
                              ]}
                            >
                              {listType === 'string' ?
                                <Input /> :
                                (listType === 'int' ? <InputNumber precision={0} /> : <InputNumber />)
                              }
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              name={[name, 'label']}
                              className='enums-item'
                              rules={[{ required: true, message: '' }]}
                            >
                              <Input />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              name={[name, 'default']}
                              className='enums-item'
                              valuePropName='checked'
                              initialValue={false}
                            >
                              <Checkbox onChange={(event: any) => handleChangeEnumDefault(event, key)} />
                            </Form.Item>
                            <i className="operation-icon spicon icon-shanchu2 enums-item remove-btn" onClick={() => remove(name)} />
                          </div>
                        ))}
                        <Form.Item className='enums-add'>
                          <Button className='enums-add-btn' size='small' type="dashed" onClick={() => add()} block icon={<i className='spicon icon-tianjia2'></i>}>
                          </Button>
                        </Form.Item>
                      </>
                    )}
                  </Form.List>
                </div>
              </>
            }
            {itemType == 'string' &&
              <Form.Item name='stringMaxLength' label='最大长度' rules={[{ required: true, message: '最大长度不能为空' }]} initialValue={9999}>
                <InputNumber min={0} />
              </Form.Item>
            }
            <Form.Item name='required' label='是否必填' rules={[{ required: true, message: '是否必填不能为空' }]} initialValue={false}>
              <Select>
                <Option key="noRequired" value={false}>否</Option>
                <Option key="required" value={true}>是</Option>
              </Select>
            </Form.Item>
          </>
        }
        <Form.Item className='operations'>
          <Button onClick={() => close()}>取消</Button>
          <Button type='primary' onClick={save}>保存</Button>
        </Form.Item>
      </Form>
    </PdbPanel>
  );
}