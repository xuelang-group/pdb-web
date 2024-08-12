import { Form, Input, TreeSelect } from "antd";
import { myDirId, routeLabelMap } from "@/utils/common";
import "./index.less";
import { useSelector } from "react-redux";
import { StoreState } from "@/store";
import _ from "lodash";
import { useEffect, useState } from "react";
import TextArea from "antd/es/input/TextArea";

interface ModalFormProps {
  operate: any
  route: string
  initialValue: any
  formRef: any
}

export default function ModalForm(props: ModalFormProps) {
  const { formRef, operate, route, initialValue } = props;
  const catalog = useSelector((state: StoreState) => state.app.catalog);

  const [catalogTree, setCatalogTree] = useState<any>([]);

  const routeLabel = routeLabelMap[route];

  useEffect(() => {
    setCatalogTree(getTreedata(_.filter(catalog, { id: myDirId })));
  }, [catalog]);

  useEffect(() => {
    formRef && formRef.current && formRef.current.setFieldsValue({dir: myDirId, ...initialValue});
  }, [initialValue]);

  const getTreedata = (_catalog: any) => {
    if (!_catalog) return [];
    const loop = function (data: any) {
      return _.map(data, (item) => {
        let { children } = item;
        if (!_.isEmpty(item.children)) {
          children = loop(item.children);
        }
        return {
          key: item.id,
          title: item.label,
          value: item.id,
          children,
        };
      });
    };
    return loop(_catalog);
  }

  const nameLabel = operate.key === "createFolder" || (operate.targetType === 'folder' && operate.key !== 'create') ? "文件夹" : routeLabel;

  return (
    <Form
      ref={formRef}
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 16 }}
    >
      {operate.key !== 'move' &&
        <Form.Item name="name" label={`${nameLabel}名称`} rules={[{ required: true, message: `${nameLabel}名称不能为空` }]}>
          <Input />
        </Form.Item>
      }
      {operate.key === 'create' &&
        <Form.Item name="description" label={`${nameLabel}描述`}>
          <TextArea />
        </Form.Item>
      }
      {((operate.key.startsWith('create') && !initialValue.dir) || operate.key === 'move') &&
        <Form.Item name="dir" label={operate.key === 'move' ? "移动到" : "创建到"}>
          <TreeSelect
            treeData={catalogTree}
            showSearch
            treeDefaultExpandAll
            treeNodeFilterProp="title"
            dropdownStyle={{ maxHeight: 300, overflow: 'auto' }}
          />
        </Form.Item>
      }
    </Form>
  );
}