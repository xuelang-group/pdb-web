import { Input, Button, Form, Select, InputNumber, DatePicker } from 'antd';
import { useEffect, useState } from 'react';
import moment from 'moment';
import { Controlled as CodeMirror } from 'react-codemirror2';
import 'codemirror/lib/codemirror.css';

import { typeMap } from '@/utils/common';
import PdbPanel from '@/components/Panel';
import _ from 'lodash';

const { Option } = Select;

export default function ParamEditor(props: any) {
  const [paramForm] = Form.useForm();
  const { params, attrs } = props;
  const [code, setCode] = useState('');

  useEffect(() => {
    setCode("");
    if (params && params.type === 'datetime') {
      const _default = params.default ? moment(params.default, params.datetimeFormat) : ''
      paramForm.setFieldsValue({
        ...params,
        default: _default
      });
    } else {
      if (params.isNew) paramForm.resetFields();
      const frontType = _.get(params, 'frontType');
      if (frontType) {
        if (frontType === 'code' && params.default) {
          setCode(params.default);
        }
        paramForm.setFieldsValue({
          ...params,
          type: frontType
        });
      } else {
        paramForm.setFieldsValue({
          ...params
        });
      }
    }
  }, [params]);

  const close = function (savedTypes?: any) {
    props.cancel(savedTypes);
    paramForm.resetFields();
  }

  // 保存
  const save = () => {
    paramForm.validateFields().then(value => {
      let _default = value.default || null;
      const { type, name, display, required, datetimeFormat, stringMaxLength } = value;
      let newData = { type, name, display };

      switch (type) {
        case 'datetime':
          if (_default) {
            Object.assign(newData, { default: _default.format(datetimeFormat) });
          }
          Object.assign(newData, { required, datetimeFormat });
          break;
        case 'string':
          Object.assign(newData, { default: _default, required, stringMaxLength });
          break;
        case 'boolean':
          Object.assign(newData, { default: Boolean(_default), required });
          break;
        case 'code':
          _default = paramForm.getFieldValue("default");
          Object.assign(newData, { type: 'string', default: _default, required, frontType: 'code' });
          break;
        default:
          Object.assign(newData, { default: _default, required });
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
    datetimeFormat = Form.useWatch('datetimeFormat', paramForm), // 监听日期时间 - 格式
    stringMaxLength = Form.useWatch('stringMaxLength', paramForm); // 监听单行文本 - 最大长度

  useEffect(() => {
    paramForm.setFieldValue('defalut', '');
  }, [itemType]);

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
      case 'int':
        return (<InputNumber precision={0} />);
      case 'float':
        return(<InputNumber step={0.1} />)
      case 'code':
        return (<></>)
      default:
        return (<InputNumber />);
    }
  }

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
          <Input />
        </Form.Item>
        <Form.Item name='display' label='展示名称' rules={[{ required: true, message: '展示名称不能为空' }]}>
          <Input />
        </Form.Item>
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
          {itemType !== 'code' &&
            <Form.Item name='default' label='默认值'>
              {renderDefaultInput()}
            </Form.Item>
          }
          {itemType === 'code' &&
            <Form.Item label='默认值'>
              <CodeMirror
                value={code}
                options={{
                  lineNumbers: true,
                  theme: 'material',
                  // lineWrapping: true,
                }}
                onBeforeChange={(editor, data, value) => {
                  setCode(value);
                  paramForm.setFieldsValue({ 'default': value }); // 更新表单值
                }}
              />
            </Form.Item>
          }
          <Form.Item name='required' label='是否必填' rules={[{ required: true, message: '是否必填不能为空' }]} initialValue={false}>
            <Select>
              <Option key="noRequired" value={false}>否</Option>
              <Option key="required" value={true}>是</Option>
            </Select>
          </Form.Item>
        </>
        <Form.Item className='operations'>
          <Button onClick={() => close()}>取消</Button>
          <Button type='primary' onClick={save}>保存</Button>
        </Form.Item>
      </Form>
    </PdbPanel>
  );
}