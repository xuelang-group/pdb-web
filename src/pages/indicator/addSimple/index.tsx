import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Divider, Flex, Form, Input, Modal, Radio, Select, Space, Typography } from "antd";
import { LeftOutlined, PlusOutlined } from "@ant-design/icons";
import { isEmpty } from "lodash";
import { StoreState } from "@/store";
import "./index.less";

const layout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 16 },
};

export default function SimpleIndicator(props: any) {
  const navigate = useNavigate();
  const routerParams = useParams();
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const query = useSelector((state: StoreState) => state.query.params);
  
  const onFinish = (values: any) => {
    console.log('finish: ', values)
  }

  useEffect(() => {
  }, []);

  return (
    <div className="pdb-indicator-simple">
      <div className="pdb-indicator-simple-body">
        <Form
          name="simple"
          {...layout}
          onFinish={onFinish}
        >
          <Divider orientation="left" orientationMargin={16}>基础信息</Divider>
          <Form.Item name={'type'} label="类型" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value={1}>指标模型</Radio>
              <Radio value={2}>计算指标</Radio>
            </Radio.Group>
          </Form.Item>
          <Flex wrap>
            <Form.Item name={'name'} label="指标名称" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name={'gc'} label="关联过程" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name={'desc'} label="指标描述">
              <Input.TextArea />
            </Form.Item>
          </Flex>
          <Divider orientation="left" orientationMargin={16}>指标定义</Divider>
          <Flex wrap>
            <Form.Item name={'source'} label="数据源" rules={[{ required: true }]}>
              <Select />
            </Form.Item>
            <Form.Item name={'ziduan'} label="字段" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name={'compute'} label="计算方式" rules={[{ required: true }]}>
              <Select />
            </Form.Item>
            <Form.Item name={'dimensions'} label="业务维度">
              <Select />
            </Form.Item>
            <Form.Item labelCol={{span: 3}} wrapperCol={{span: 20}} style={{width: '100%'}} name={'filter'} label="数据筛选">
              <Select />
            </Form.Item>
          </Flex>
        </Form>
      </div>
      <div className="pdb-indicator-simple-footer">
        <Button type="primary">试计算</Button>
        <Space size={16}>
          <Button>关闭</Button>
          <Button type="primary">保存</Button>
        </Space>
      </div>
    </div>
  );
}
