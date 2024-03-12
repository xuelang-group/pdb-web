import React, { Key, useEffect, useRef, useState } from 'react';
import { DatePicker, InputNumber, InputRef, Radio, Select } from 'antd';
import { Button, Form, Input, Modal, Table } from 'antd';
import locale from 'antd/es/date-picker/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import _ from 'lodash';
import { getType } from '@/actions/type';
import { RelationConfig } from '@/reducers/relation';
import { getTypeSupportRelation } from '@/actions/object';
import dayjs from 'dayjs'
import moment from 'moment';
interface Item {
  key: string;
  name: string;
  age: string;
  address: string;
}

interface EditableCellProps {
  title: React.ReactNode;
  editable: boolean;
  children: React.ReactNode;
  dataIndex: keyof Item;
  record: Item;
  handleSave: (record: Item) => void;
}

// 条件名称
const optionLabelMap: any = {
  'eq': '等于',
  'le': '小于等于',
  'lt': '小于',
  'ge': '大于等于',
  'gt': '大于',
  'between': '在...之间',
  'has': '存在属性',
  'not has': '不存在属性',
  'anyofterms': '任意包含',
  'allofterms': '所有包含'
};

const commonOptionKeys = ['eq', 'le', 'lt', 'ge', 'gt', 'between', 'has', 'not has'];
const conditionOptionMap: any = {
  'text': ['anyofterms', 'allofterms', ...commonOptionKeys],
  'string': ['anyofterms', 'allofterms', ...commonOptionKeys],
  'int': commonOptionKeys,
  'float': commonOptionKeys,
  'bool': ['eq', 'has', 'not has'],
  'datetime': commonOptionKeys
}

const EditableCell: React.FC<EditableCellProps> = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}: any) => {
  const inputRef = useRef<InputRef>(null);
  if (!record || !dataIndex) {
    return (<td {...restProps}>{children}</td>);
  }

  const index = _.get(record, 'key', '0');
  const { attrs } = restProps;
  const { name } = record;
  const _function = record['function'];
  const type = _.get(attrs, `${name}.type`, 'string'),
    datetimeFormat = _.get(attrs, `${name}.datetimeFormat`, 'YYYY-MM-DD');

  const save = () => {
    if (type === 'datetime') {
      handleSave(index, datetimeFormat);
    } else {
      handleSave(index);
    }
  };

  let childNode = children;

  if (editable) {
    if (dataIndex === 'function' && record) {
      let options = _.get(restProps, 'options', []);

      if (attrs && attrs[name]) {
        options = conditionOptionMap[type].map((value: string) => ({ value, label: optionLabelMap[value] }));
      }

      childNode = (
        <Form.Item
          style={{ margin: 0 }}
          name={['condition', 'table', index, dataIndex]}
          rules={[{ required: true, message: '' }]}
        >
          <Select
            options={options}
            placeholder='请选择'
            onChange={save}
            showSearch
            filterOption={(input, option: any) =>
            ((option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase()) ||
              (option?.value ?? '').toString() === input)
            }
          ></Select>
        </Form.Item>
      );
    } else {
      const renderValueInput = function () {
        if (_.get(restProps, 'type') === 'select') {
          return (
            <Select
              options={_.get(restProps, 'options', [])}
              placeholder='请选择'
              onChange={save}
              showSearch
              filterOption={(input, option: any) =>
              ((option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase()) ||
                (option?.value ?? '').toString() === input)
              }
            ></Select>
          );
        }
        if (type === 'int') {
          return (<InputNumber precision={0} onPressEnter={save} onBlur={save} />);
        } else if (type === 'float') {
          return (<InputNumber onPressEnter={save} onBlur={save} />);
        } else if (type === 'bool') {
          return (<Select options={[{ value: true, label: 'TRUE' }, { value: false, label: 'FALSE' }]} onChange={save} />);
        } else if (type === 'datetime') {
          return (<DatePicker locale={locale} format={datetimeFormat} onChange={save} />);
        }
        return (
          <Input ref={inputRef} onPressEnter={save} onBlur={save} placeholder='请输入' />
        );
      }
      if (dataIndex === 'value' && _function === 'between') {
        if (type === 'datetime') {
          childNode = (
            <>
              <Form.Item name={['condition', 'table', index, 'datetimeFormat']} style={{ display: 'none' }}>
                <Input />
              </Form.Item>
              <Form.Item
                style={{ margin: 0 }}
                name={['condition', 'table', index, dataIndex]}
                rules={[{ required: true, message: '' }]}
              >
                <DatePicker.RangePicker locale={locale} format={datetimeFormat} onCalendarChange={save} />
              </Form.Item>
            </>
          );
        } else {
          childNode = (
            <div className='pdb-query-builder-form-between'>
              <Form.Item
                name={['condition', 'table', index, dataIndex, 0]}
                rules={[{ required: true, message: '' }]}
                style={{ margin: 0 }}
              >
                {renderValueInput()}
              </Form.Item>
              <span style={{ margin: '0 3px' }}>-</span>
              <Form.Item
                name={['condition', 'table', index, dataIndex, 1]}
                rules={[{ required: true, message: '' }]}
                style={{ margin: 0 }}
              >
                {renderValueInput()}
              </Form.Item>
            </div>
          );
        }
      } else if (dataIndex === 'value' && _function && _function.indexOf('has') > -1) {
        childNode = (<span>-</span>)
      } else {
        if (type === 'datetime') {
          childNode = (
            <>
              <Form.Item name={['condition', 'table', index, 'datetimeFormat']} style={{ display: 'none' }}>
                <Input />
              </Form.Item>
              <Form.Item
                style={{ margin: 0 }}
                name={['condition', 'table', index, dataIndex]}
                rules={[{ required: true, message: '' }]}
              >
                {renderValueInput()}
              </Form.Item>
            </>
          )
        }
        childNode = (
          <Form.Item
            style={{ margin: 0 }}
            name={['condition', 'table', index, dataIndex]}
            rules={[{ required: true, message: '' }]}
          >
            {renderValueInput()}
          </Form.Item>
        );
      }

    }
  }

  return (<td {...restProps}>{childNode}</td>);
};

type EditableTableProps = Parameters<typeof Table>[0];

type ColumnTypes = Exclude<EditableTableProps['columns'], undefined>;

interface ConditionFormProps {
  defaultData: Array<string>
  match: string
  form: any
  setFieldValue: Function
}

export default function ConditionForm(props: ConditionFormProps) {

  const { setFieldValue, defaultData, match, form } = props;
  const [dataSource, setDataSource] = useState([] as any),
    [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]),
    [count, setCount] = useState(0),
    [defaultColumns, setDefaultColumns] = useState<(ColumnTypes[number] & { editable?: boolean; dataIndex: string })[]>([]),
    [noDataError, setNoDataError] = useState(false),
    [typeRelationOptions, setTypeRelationOptions] = useState<RelationConfig[]>([]),
    [attrMap, setAttrMap] = useState<any>({});

  useEffect(() => {
    const dataSource = defaultData.map((val: any, key: number) => {
      if (match === 'anyofterms') {
        return {
          key,
          function: '包含',
          name: val.name
        };
      } else if (match === 'type_attr') {
        if (attrMap) {
          const attrType = _.get(attrMap, `${val.name}.type`);
          if (attrType === 'datetime' && val.value) {
            const datetimeFormat = _.get(attrMap, `${val.name}.datetimeFormat`, val.datetimeFormat || 'YYYY-MM-DD');
            if (val.function === 'between') {
              return {
                ...val,
                key,
                value: [dayjs(moment(val.value[0]).format(datetimeFormat), datetimeFormat), dayjs(moment(val.value[1]).format(datetimeFormat), datetimeFormat)]
              };
            }

            return {
              ...val,
              key,
              value: dayjs(moment(val.value).format(datetimeFormat), datetimeFormat)
            };
          }
        }
        return { ...val, key };
      }
      return { ...val, key };
    });
    setDataSource(dataSource);
    form.setFieldValue(['condition', 'table'], dataSource);
    setCount(defaultData.length);
  }, [defaultData]);

  useEffect(() => {
    let defaultColumns: any;
    if (match === 'anyofterms') {
      defaultColumns = [
        {
          title: '条件',
          dataIndex: 'function',
          width: 113
        },
        {
          title: '关键词',
          dataIndex: 'name',
          editable: true,
        }
      ];
    } else if (match === 'type_attr') {
      defaultColumns = [{
        title: '属性',
        dataIndex: 'name',
        editable: true,
        type: 'select',
        options: Object.values(attrMap),
        width: 150
      }, {
        title: '条件',
        dataIndex: 'function',
        editable: true,
        type: 'select',
        attrs: attrMap,
        options: [],
        width: 150
      }, {
        title: '值',
        dataIndex: 'value',
        attrs: attrMap,
        editable: true,
      }];
    } else if (match === 'type_relation') {
      defaultColumns = [{
        title: '关系',
        dataIndex: 'name',
        editable: true,
        type: 'select',
        options: typeRelationOptions.map(relation => ({
          value: relation['r.type.name'],
          label: relation['r.type.label']
        }))
      }, {
        title: '当前对象为',
        dataIndex: 'isTarget',
        editable: true,
        type: 'select',
        options: [{
          value: false,
          label: '源对象'
        }, {
          value: true,
          label: '目标对象'
        }]
      }, {
        title: '条件',
        dataIndex: 'function',
        editable: true,
        type: 'select',
        options: [
          { value: 'has', label: '存在关系' },
          { value: 'not has', label: '不存在关系' }
        ],
      }];
    }
    setDefaultColumns(defaultColumns);
  }, [match, typeRelationOptions, attrMap]);

  const conditionType = Form.useWatch(['condition', 'type'], form);
  useEffect(() => {
    if (match === 'type_attr') {
      getType(conditionType, (success: boolean, data: any) => {
        if (success) {
          const info = data[0];
          if (info) {
            const attrMap: any = {};
            (info['x.type.attrs'] || []).forEach(({ type, name, display, ...other }: any) => {
              let _type = type;
              if (type === 'list') {
                _type = _.get(other, 'listType', 'string');
              } else if (type === 'boolean') {
                _type = 'bool';
              }
              Object.assign(attrMap, { [name]: { value: name, label: display, type: _type } });
              if (type === 'datetime') {
                Object.assign(attrMap[name], { datetimeFormat: other['datetimeFormat'] });
              }
            });
            setAttrMap(attrMap);

            const dataSource = defaultData.map((val: any, key: number) => {
              const attrType = _.get(attrMap, `${val.name}.type`);
              if (attrType === 'datetime' && val.value) {
                const datetimeFormat = _.get(attrMap, `${val.name}.datetimeFormat`, val.datetimeFormat || 'YYYY-MM-DD');
                if (val.function === 'between') {
                  return {
                    ...val,
                    key,
                    value: [dayjs(moment(val.value[0]).format(datetimeFormat), datetimeFormat), dayjs(moment(val.value[1]).format(datetimeFormat), datetimeFormat)]
                  };
                }
                return {
                  ...val,
                  key,
                  value: dayjs(moment(val.value).format(datetimeFormat), datetimeFormat)
                };
              }
              return {
                ...val,
                key
              };
            });
            setDataSource(dataSource);
            form.setFieldValue(['condition', 'table'], dataSource);

            return;
          }
        }
        setAttrMap({});
      });
    } else if (match === 'type_relation' && conditionType) {
      // 对象类型 - 匹配类型及关系 - 获取对应类型相关的关系列表
      getTypeSupportRelation(conditionType[0], function (success: boolean, response: any) {
        setTypeRelationOptions(success ? response : []);
      });
    }
  }, [conditionType]);

  // 新增条件
  const handleAdd = () => {
    noDataError && setNoDataError(false);
    let newData = {
      key: count
    };
    if (match === 'anyofterms') {
      Object.assign(newData, {
        function: '包含'
      });
    } else if (match === 'type_relation') {
      Object.assign(newData, {
        isTarget: false
      });
      setFieldValue(['condition', 'table', dataSource.length, 'isTarget'], false);
    }
    setDataSource([...(JSON.parse(JSON.stringify(dataSource))), newData]);
    setCount(count + 1);
  }

  // 删除条件
  const handleDelete = () => {
    if (selectedRowKeys.length === 0) return;
    if (selectedRowKeys.length === dataSource.length) {
      setDataSource([]);
      setCount(0);
      setFieldValue(['condition', 'names'], []);
    } else {
      const newDataSource = [];
      for (let i = 0; i < dataSource.length; i++) {
        const data = JSON.parse(JSON.stringify(dataSource[i]));
        let isSelected = false;
        for (const selectedKey of selectedRowKeys) {
          if (data.key === selectedKey) {
            isSelected = true;
            break;
          }
        }
        if (!isSelected) newDataSource.push({ ...data, key: i });
      }
      setDataSource(newDataSource);
      setCount(newDataSource.length);
      setFieldValue(['condition', 'names'], newDataSource.map(data => data.name));
    }
    setSelectedRowKeys([]);
  }

  const handleSave = (index: number, datetimeFormat?: string) => {
    const tableData = form.getFieldValue(['condition', 'table']);
    const row = tableData[index];
    const newData = JSON.parse(JSON.stringify(dataSource));
    Object.assign(newData[index], { ...row });
    if (datetimeFormat) {
      Object.assign(newData[index], { datetimeFormat });
      setFieldValue(['condition', 'table', index, 'datetimeFormat'], datetimeFormat);
    } else if (row.function === 'between' && typeof row.value === 'object' && !Array.isArray(row.value)) {
      Object.assign(newData[index], { value: Object.values(row.value) });
      setFieldValue(['condition', 'table', index, 'value'], Object.values(row.value));
    }
    setDataSource(JSON.parse(JSON.stringify(newData)));
  }

  return (
    <Form.Item
      className='pdb-query-form-max'
      label='条件列表'
    >
      <Form.Item label='' name={['condition', 'match']} style={{ marginBottom: 8 }} rules={[{ required: true, message: '请选择' }]}>
        <Radio.Group>
          <Radio value='anyofterms'>满足任意一个条件</Radio>
          <Radio value='allofterms'>满足所有条件</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item className='pdb-query-builder-editable-table' label=''>
        <Table
          components={{
            body: {
              cell: EditableCell,
            }
          }}
          rowClassName={() => 'editable-row'}
          rowSelection={{
            selectedRowKeys,
            onChange(selectedRowKeys, selectedRows, info) {
              setSelectedRowKeys(selectedRowKeys);
            },
          }}
          bordered
          dataSource={dataSource}
          columns={defaultColumns.map((col: any) => {
            if (!col.editable) {
              return col;
            }
            return {
              ...col,
              onCell: (record: any) => ({
                ...col,
                type: col.type,
                record,
                handleSave,
              }),
            };
          })}
          pagination={false}
        />
        {noDataError && <span className='pdb-query-builder-error' style={{ color: '#ff4d4f' }}>请添加一个条件</span>}
        <div className='pdb-query-builder-btns'>
          <Button className='pdb-query-builder-btn' onClick={handleAdd}>
            <i className='spicon icon-plus' style={{ marginRight: 6 }}></i>
            <span>新增</span>
          </Button>
          {selectedRowKeys.length > 0 &&
            <Button className='pdb-query-builder-btn' style={{ marginLeft: 6 }} onClick={handleDelete}>
              <span>删除</span>
            </Button>
          }
        </div>
      </Form.Item>
    </Form.Item>
  );
};