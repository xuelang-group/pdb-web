import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Button, Empty, Form, Input, message, Modal, Popconfirm, Select } from 'antd';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import _ from 'lodash';

import { StoreState } from '@/store';
import { QueryItemState, QueryResultState, setList, setQueryState, setResult } from '@/reducers/query';
import { deleteToolbarConfig } from '@/reducers/editor';
import { saveQueryData } from '@/actions/query';
import ConditionForm from './ConditionForm';
import './index.less';

interface QueryBuilderProps {
  onRunQuery: Function
}

const QueryBuilder = (props: QueryBuilderProps, ref: any) => {
  const { onRunQuery } = props;
  const routerParams = useParams(),
    dispatch = useDispatch(),
    [queryForm] = Form.useForm();
  const queryList = useSelector((state: StoreState) => state.query.list),
    queryStatus = useSelector((state: StoreState) => state.query.status),
    queryResult = useSelector((state: StoreState) => state.query.result),
    types = useSelector((state: StoreState) => state.type.data);

  const [editQueryIndex, setEditQueryIndex] = useState(-1),
    [editQuery, setEditQuery] = useState<QueryItemState | null>(null),
    [isCreate, setIsCreate] = useState(false),
    [formDisabled, setFormDisabled] = useState(false);

  useImperativeHandle(ref, () => ({
    save: (callback: Function) => {
      if (editQuery && !formDisabled) {
        saveConfirm(callback);
      } else {
        queryForm.resetFields();
        callback();
      }
    }
  }));

  useEffect(() => {
    return () => {
      queryForm.resetFields();
      setIsCreate(false);
      setEditQuery(null);
      setEditQueryIndex(-1);
    }
  }, [routerParams?.id]);

  const saveConfirm = function (callback?: Function) {
    const confirm = Modal.confirm({
      className: 'pdb-confirm-modal',
      title: `是否保存对“${editQuery?.name}”的更改？`,
      icon: <i className="pdb-confirm-icon spicon icon-jinggao1 text-warning"></i>,
      footer: () => (
        <div className='pdb-confirm-modal-footer'>
          <Button onClick={() => {
            confirm.destroy();
            callback && callback();
          }}>取消</Button>
          <Button onClick={() => {
            if (isCreate) {
              setIsCreate(false);
            }
            setEditQuery(null);
            setFormDisabled(true);
            queryForm.resetFields();
            confirm.destroy();
            callback && callback();
          }}>不保存</Button>
          <Button type='primary' onClick={() => {
            handleSave();
            confirm.destroy();
            callback && callback();
          }}>保存</Button>
        </div>
      )
    });
  }

  // 更改查询类型时，先重置
  const handleChangeType = function (value: string) {
    const name = queryForm.getFieldValue('name') || '';
    queryForm.resetFields();
    queryForm.setFieldsValue({
      name,
      type: value
    });
  }

  const save = function (values: any) {
    const table = queryForm.getFieldValue(['condition', 'table']);
    const newQueryList = JSON.parse(JSON.stringify(queryList)),
      newQueryStatus = JSON.parse(JSON.stringify(queryStatus));
    const newQuery = { ...values };
    if (newQuery.condition.table) {
      Object.assign(newQuery.condition, { table });
    }
    if (isCreate) {
      newQueryList.push(newQuery);
      newQueryStatus.push({ loading: false });
    } else {
      Object.assign(newQueryList[editQueryIndex], newQuery);
      Object.assign(newQueryStatus[editQueryIndex], { loading: false });
    }
    const graphId = routerParams.id;
    saveQueryData(graphId, JSON.stringify(newQueryList), (success: boolean) => {
      if (success) {
        dispatch(setList(newQueryList));
        dispatch(setQueryState(newQueryStatus));
        message.success('保存成功');
        if (isCreate) {
          setEditQuery(newQuery);
          setEditQueryIndex(newQueryList.length - 1);
          setIsCreate(false);
        }
        setFormDisabled(true);
      } else {
        message.error('保存失败');
      }
    });
  }

  // 保存
  const handleSave = function () {
    queryForm.validateFields().then(async values => {
      save(values);
    }).catch(err => {
      console.log(err)
    });
  }

  // 新建查询
  const handleCreate = function () {
    if (editQuery && !formDisabled) {
      saveConfirm();
      return;
    }
    setIsCreate(true);
    setEditQuery(null);
    setEditQueryIndex(-1);
    setFormDisabled(false);
    queryForm.resetFields();
  }

  // 删除
  const handleDelete = function () {
    const newQueryList = JSON.parse(JSON.stringify(queryList)),
      newQueryStatus = JSON.parse(JSON.stringify(queryStatus));
    let newQueryResult = JSON.parse(JSON.stringify(queryResult));
    newQueryResult = newQueryResult.filter((result: QueryResultState) => result.index !== editQueryIndex);

    const deleteItem = newQueryList.splice(editQueryIndex, 1);
    newQueryStatus.splice(editQueryIndex, 1);

    const graphId = routerParams.id;
    saveQueryData(graphId, JSON.stringify(newQueryList), (success: boolean) => {
      const { name } = deleteItem[0];
      if (success) {
        dispatch(setList(newQueryList));
        dispatch(setQueryState(newQueryStatus));
        dispatch(setResult(newQueryResult));
        dispatch(deleteToolbarConfig(editQueryIndex.toString()));
        message.success(`删除${name}成功`);
      } else {
        message.error(`删除${name}失败`);
      }
      setEditQuery(null);
      setEditQueryIndex(-1);
      setIsCreate(false);
      queryForm.resetFields();
    });
  }

  // 选中一条查询
  const hanldeSelectQuery = function (query: QueryItemState, index: number) {
    if (query.name === editQuery?.name) return;
    if (editQuery && !formDisabled) {
      saveConfirm();
      return;
    }
    setEditQuery(query);
    setEditQueryIndex(index);
    setIsCreate(false);
    setFormDisabled(true);
    queryForm.setFieldsValue(query);
  }

  // 对象ID相关Form
  const renderIdForm = function () {
    return (
      <>
        <Form.Item
          label='匹配方式'
          name='match'
          rules={[{ required: true, message: '请选择匹配方式' }]}
        >
          <Select placeholder="请选择">
            <Select.Option value='batch'>批量匹配</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          className='pdb-query-form-max'
          label='ID列表'
          name={['condition', 'uid']}
          rules={[
            { required: true, message: '' },
            {
              validator: (rules, value, callback) => {
                if (/\s/.test(value)) {
                  callback('不支持输入空格和回车');
                  return;
                }
                callback();
              }
            }
          ]}
        >
          <Input.TextArea placeholder='请输入ID，以逗号分隔，如：aaaaaa,bbbbbb,cccccc' rows={3} />
        </Form.Item>
      </>
    )
  }

  // 对象名称相关Form
  const renderNameForm = function () {
    return (
      <>
        <Form.Item
          label='匹配方式'
          name='match'
          rules={[{ required: true, message: '请选择匹配方式' }]}
        >
          <Select placeholder="请选择">
            <Select.Option value='batch'>批量匹配</Select.Option>
            <Select.Option value='condition'>条件匹配</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item shouldUpdate={(prevValues: any, curValues: any) => prevValues.match !== curValues.match}>
          {({ getFieldValue, setFieldValue }) => {
            const match = getFieldValue('match');
            if (!match) {
              return;
            }
            if (match === 'batch') {
              // setFieldValue(['condition', 'match'], 'eq');
              return (
                <Form.Item
                  className='pdb-query-form-max'
                  label='名称列表'
                  name={['condition', 'names']}
                  rules={[
                    { required: true, message: '请输入名称列表' },
                    {
                      validator: (rules, value, callback) => {
                        if (/\s/.test(value)) {
                          callback('不支持输入空格和回车');
                          return;
                        }
                        callback();
                      }
                    }
                  ]}
                >
                  <Input.TextArea placeholder='请输入名称，以逗号分隔，如：aaaaaa,bbbbbb,cccccc' rows={3} />
                </Form.Item>
              );
            }
            if (!getFieldValue(['condition', 'match'])) setFieldValue(['condition', 'match'], 'anyofterms');
            return (<ConditionForm form={queryForm} match='anyofterms' defaultData={_.get(editQuery, 'condition.table', [])} setFieldValue={setFieldValue} />);
          }}
        </Form.Item>
      </>
    )
  }

  // 对象相关Form
  const renderTypeForm = function () {
    return (
      <>
        <Form.Item
          label='匹配方式'
          name='match'
          rules={[{ required: true, message: '请选择匹配方式' }]}
        >
          <Select placeholder="请选择">
            <Select.Option value='type'>仅匹配类型</Select.Option>
            <Select.Option value='type_attr'>匹配类型及属性</Select.Option>
            <Select.Option value='type_relation'>匹配类型及关系</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item shouldUpdate={(prevValues: any, curValues: any) => prevValues.match !== curValues.match}>
          {({ getFieldValue, setFieldValue }) => {
            const match = getFieldValue('match');
            if (match === 'type') {
              return (
                <Form.Item
                  className='pdb-query-form-max'
                  label='类型列表'
                  name={['condition', 'type']}
                  rules={[{ required: true, message: '请选择类型' }]}
                >
                  <Select
                    mode='multiple'
                    placeholder="请选择"
                    showSearch
                    filterOption={(input, option: any) =>
                    ((option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase()) ||
                      (option?.value ?? '').toString() === input)
                    }
                  >
                    {types.map(type => (
                      <Select.Option value={type['x_type_name']}>{type['x.type.label']}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              );
            } else if (match === 'type_attr') {
              if (!getFieldValue(['condition', 'match'])) setFieldValue(['condition', 'match'], 'anyofterms');
              return (
                <>
                  <Form.Item
                    label='类型列表'
                    name={['condition', 'type', 0]}
                    rules={[{ required: true, message: '请选择类型' }]}
                  >
                    <Select
                      placeholder="请选择"
                      showSearch
                      filterOption={(input, option: any) =>
                      ((option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase()) ||
                        (option?.value ?? '').toString() === input)
                      }
                      onChange={() => {
                        queryForm.setFieldValue('condition.table', []);
                      }}
                    >
                      {types.map(type => (
                        <Select.Option value={type['x_type_name']}>{type['x.type.label']}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item shouldUpdate={(prevValues: any, curValues: any) => _.get(prevValues, 'condition.type.0') !== _.get(curValues, 'condition.type.0')}>
                    {({ getFieldValue, setFieldValue }) => {
                      const type = getFieldValue(['condition', 'type', 0]);
                      if (type) return (<ConditionForm form={queryForm} match={'type_attr'} defaultData={_.get(editQuery, 'condition.table', [])} setFieldValue={setFieldValue} />)
                    }}
                  </Form.Item>
                </>
              )
            } else if (match === 'type_relation') {
              if (!getFieldValue(['condition', 'match'])) setFieldValue(['condition', 'match'], 'anyofterms');
              return (
                <>
                  <Form.Item
                    label='类型列表'
                    name={['condition', 'type', 0]}
                    rules={[{ required: true, message: '请选择类型' }]}
                  >
                    <Select
                      placeholder="请选择"
                      showSearch
                      filterOption={(input, option: any) =>
                      ((option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase()) ||
                        (option?.value ?? '').toString() === input)
                      }
                    >
                      {types.map(type => (
                        <Select.Option value={type['x_type_name']}>{type['x.type.label']}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item shouldUpdate={(prevValues: any, curValues: any) => _.get(prevValues, 'condition.type.0') !== _.get(curValues, 'condition.type.0')}>
                    {({ getFieldValue, setFieldValue }) => {
                      const type = getFieldValue(['condition', 'type', 0]);
                      if (type) return (<ConditionForm form={queryForm} match={'type_relation'} defaultData={_.get(editQuery, 'condition.table', [])} setFieldValue={setFieldValue} />)
                    }}
                  </Form.Item>
                </>
              )
            }
          }}
        </Form.Item>
      </>
    )
  }

  if (queryList.length === 0 && !isCreate) {
    return (
      <div className='pdb-query-builder pdb-query-empty'>
        <Empty image={require('@/assets/images/search_empty.png')} />
        <Button type='primary' onClick={handleCreate}>
          <i className='spicon icon-plus'></i>
          <span>新建查询</span>
        </Button>
      </div>
    )
  }

  return (
    <div className='pdb-query-builder'>
      <div className='pdb-query-builder-left'>
        <div className='pdb-query-list'>
          {queryList.map((query, index) => (
            <div
              className={'pdb-query-item' + (_.get(editQuery, 'name') === query.name ? ' pdb-query-selected' : '')}
              onClick={() => hanldeSelectQuery(query, index)}
            >
              <i className='spicon icon-PDB_19'></i>
              <span className='pdb-query-item-name'>{query.name}</span>
            </div>
          ))}
          {isCreate &&
            <div className='pdb-query-item pdb-query-selected'>
              <i className='spicon icon-PDB_19'></i>
              <span className='pdb-query-item-name'>新建查询（未保存）</span>
            </div>
          }
        </div>
        <div className='pdb-query-builder-add'>
          <div className='pdb-query-builder-btn' onClick={handleCreate}>
            <i className='spicon icon-plus'></i>
            <span>新建查询</span>
          </div>
        </div>
      </div>
      {(_.get(editQuery, 'name') || isCreate) &&
        <div className='pdb-query-builder-right'>
          <div className='pdb-query-builder-form'>
            <Form
              name='query'
              form={queryForm}
              disabled={formDisabled}
            >
              <Form.Item label='查询名称' name='name' rules={[
                { required: true, message: '请输入查询名称' },
                {
                  validator: (rules, value, callback) => {
                    const index = queryList.findIndex(query => query.name === value);
                    if (index > -1 && index !== editQueryIndex) {
                      callback('查询名称已存在');
                      return;
                    }
                    callback();
                  }
                }]}>
                <Input placeholder="请输入" />
              </Form.Item>
              <Form.Item label='查询类型' name='type' rules={[{ required: true, message: '请选择类型' }]}>
                <Select
                  options={[
                    { value: 'uid', label: '对象ID' },
                    { value: 'x_name', label: '对象名称' },
                    { value: 'x_type_name', label: '对象类型' }
                  ]}
                  placeholder="请选择"
                  onChange={handleChangeType}
                />
              </Form.Item>
              <Form.Item shouldUpdate={(prevValues: any, curValues: any) => prevValues.type !== curValues.type} >
                {({ getFieldValue, setFieldValue }) => {
                  const type = getFieldValue('type');
                  if (type === 'uid') {
                    // setFieldValue('match', 'batch');
                    return renderIdForm();
                  } else if (type === 'x_name') {
                    // setFieldValue('match', 'batch');
                    // setFieldValue(['condition', 'match'], 'batch');

                    return renderNameForm();
                  } else if (type === 'x_type_name') {
                    // setFieldValue('match', 'type');
                    return renderTypeForm();
                  }
                }}
              </Form.Item>
            </Form>
          </div>
          <div className='pdb-query-builder-footer'>
            {(isCreate || !formDisabled) ? <>
              {!formDisabled && !isCreate && <Button onClick={() => saveConfirm()}>返回</Button>}
              {/* {isCreate && formDisabled && <Button onClick={() => queryForm.resetFields()}>清空</Button>} */}
              <Button type='primary' icon={<i className='spicon icon-baocun1'></i>} onClick={handleSave}>保存</Button>
            </> : <div className='pdb-query-builder-btns'>
              <Popconfirm
                title="确定删除该查询吗？"
                onConfirm={handleDelete}
                okText="确定"
                cancelText="取消"
              >
                <Button danger>删除</Button>
              </Popconfirm>
              <div>
                {formDisabled &&
                  <Button
                    type='primary'
                    icon={<i className='spicon icon-bianji'></i>}
                    onClick={() => setFormDisabled(false)}
                    ghost
                  >编辑</Button>
                }
                <Button type='primary' icon={<i className='spicon icon-yunhang'></i>} onClick={() => onRunQuery(editQuery, editQueryIndex)}>执行</Button>
              </div>
            </div>
            }
          </div>
        </div>
      }
    </div>
  );
}

export default forwardRef(QueryBuilder);