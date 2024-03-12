import { StoreState } from "@/store";
import { Button, Form, Select, Table } from "antd";
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import './index.less';
import { ObjectRelationConig } from "@/reducers/editor";

export default function RelationBind(props: any) {
  const allTypes = useSelector((state: StoreState) => state.type.data);
  const options = allTypes.map(type => ({
    value: type['x.type.name'],
    label: type['x.type.label']
  }));
  const [form] = Form.useForm();
  const [binds, setBinds] = useState(props.data || []);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    const newBinds = (props.data || []).filter((item: ObjectRelationConig) => !item.override)
    form.setFieldValue('bind', newBinds);
    setBinds(newBinds);
  }, [props.data]);

  useEffect(() => {
    let columns: any = [{
      title: '源对象类型',
      dataIndex: 'source',
      render: (text: any, record: any, index: number) => renderColumn(index, 'source')
    }, {
      title: '目标对象类型',
      dataIndex: 'target',
      render: (text: any, record: any, index: number) => renderColumn(index, 'target')
    }];

    if (!props.readOnly) {
      columns.push({
        title: '',
        dataIndex: 'operation',
        width: 23,
        render: (text: any, record: any, index: number) => <i className="operation-icon spicon icon-shanchu2" onClick={() => removeBind(index)} />
      });
    }
    setColumns(columns);
  }, [props.readOnly]);

  const addBind = function () {
    form.validateFields().then((values) => {
      const newBinds = JSON.parse(JSON.stringify(binds));
      newBinds.push({ source: '', target: '' });
      setBinds(newBinds);
    }).catch(err => {
    });
  }

  const removeBind = function (index: number) {
    const newBinds = JSON.parse(JSON.stringify(form.getFieldValue('bind')));
    newBinds.splice(index, 1);
    setBinds(newBinds);
    form.setFieldValue('bind', newBinds);
    props.update(newBinds);
  }

  const handleSaveBind = function (changedValues: any, values: any) {
    const binds = values['bind'];
    setTimeout(() => {
      form.validateFields().then(() => {
        props.update(binds);
      }).catch(err => {
      });
    }, 0);
  }

  const renderColumn = (index: number, key: string) => (
    <Form.Item
      name={['bind', index, key]}
      className='bind-item'
      rules={[
        { required: true, message: '' },
        {
          validator: async (_, value) => {
            const allBinds = form.getFieldValue('bind');
            const currentBind = allBinds[index];
            if (currentBind && currentBind.source && currentBind.target) {
              if (allBinds.findIndex((val: any, i: number) => val.source === currentBind.source && val.target === currentBind.target && index !== i) > -1) {
                throw new Error('');
              }
            }
          }
        }
      ]}
    >
      <Select
        options={options}
        showSearch
        filterOption={(input, option: any) =>
        ((option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase()) ||
          (option?.value ?? '').toString() === input)
        }
        disabled={props.readOnly}
      ></Select>
    </Form.Item>
  )

  return (
    <div className='pdb-relation-bind-editor'>
      <Form form={form} onValuesChange={handleSaveBind}>
        <Table
          columns={columns}
          dataSource={binds}
          pagination={false}
        />
        {!props.readOnly &&
          <Button className="add-bind-btn btn-default" onClick={() => addBind()} block icon={<i className='spicon icon-tianjia2'></i>}>
            添加连接对象
          </Button>
        }
      </Form >
    </div >
  )
}