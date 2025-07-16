import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Col,
  Divider,
  Flex,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import { ExclamationCircleOutlined, LeftOutlined, PlusOutlined } from "@ant-design/icons";
import ExploreFilterContent from "@/pages/AppExplore/ExploreFilterContent";
import { StoreState } from "@/store";

const { confirm } = Modal;

const layout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 16 },
};

const originType = {
  label: "test.cost_allocation",
  value: "Type.b-0",
  key: "Type.b",
  type: "type",
  data: {
    "x.type.name": "Type.b",
    "x.type.label": "test.cost_allocation",
    "x.type.metadata": '{"color":"#e8afa6"}',
    "x.type.attrs": [
      {
        name: "id",
        display: "序号",
        type: "int",
        default: "",
        required: true,
      },
      {
        name: "allocation_group",
        display: "来源分配组",
        type: "string",
        default: "",
        required: false,
      },
      {
        name: "source_department",
        display: "来源部门",
        type: "string",
        default: "",
        required: false,
      },
      {
        name: "target_department",
        display: "目标部门",
        type: "string",
        default: "",
        required: false,
      },
      {
        name: "amount_to_allocate",
        display: "待分配金额",
        type: "int",
        default: "",
        required: false,
      },
      {
        name: "allocation_base",
        display: "分配基数",
        type: "int",
        default: "",
        required: false,
      },
      {
        name: "labor_cost",
        display: "人工费",
        type: "int",
        default: "",
        required: false,
      },
      {
        name: "allocation_rate",
        display: "分配率",
        type: "int",
        default: "",
        required: false,
      },
      {
        name: "target_order",
        display: "目标订单",
        type: "string",
        default: "",
        required: false,
      },
      {
        name: "business_date",
        display: "业务日期",
        type: "datetime",
        default: "",
        required: false,
      },
    ],
    "x.type.prototype": [],
    "x.type.created": 1752563398603,
    "x.type.last_change": 1752563398603,
  },
  prevSearchTagType: "",
  csv: [
    {
      typeId: "Type.b",
      attrId: "id",
      attrName: "序号",
      attrType: "int",
      index: 0,
    },
    {
      typeId: "Type.b",
      attrId: "allocation_group",
      attrName: "来源分配组",
      attrType: "string",
      index: 0,
    },
    {
      typeId: "Type.b",
      attrId: "source_department",
      attrName: "来源部门",
      attrType: "string",
      index: 0,
    },
    {
      typeId: "Type.b",
      attrId: "target_department",
      attrName: "目标部门",
      attrType: "string",
      index: 0,
    },
    {
      typeId: "Type.b",
      attrId: "amount_to_allocate",
      attrName: "待分配金额",
      attrType: "int",
      index: 0,
    },
    {
      typeId: "Type.b",
      attrId: "allocation_base",
      attrName: "分配基数",
      attrType: "int",
      index: 0,
    },
    {
      typeId: "Type.b",
      attrId: "labor_cost",
      attrName: "人工费",
      attrType: "int",
      index: 0,
    },
    {
      typeId: "Type.b",
      attrId: "allocation_rate",
      attrName: "分配率",
      attrType: "int",
      index: 0,
    },
    {
      typeId: "Type.b",
      attrId: "target_order",
      attrName: "目标订单",
      attrType: "string",
      index: 0,
    },
    {
      typeId: "Type.b",
      attrId: "business_date",
      attrName: "业务日期",
      attrType: "datetime",
      index: 0,
    },
  ],
};

export default function SimpleIndicator(props: any) {
  const childRef = React.createRef();
  const navigate = useNavigate();
  const routerParams = useParams();
  const [form] = Form.useForm();
  const query = useSelector((state: StoreState) => state.query.params);
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(100)
  
  const handleBack = () => {
    navigate(`/${routerParams.id}/indicator/index`)
  }

  const onFinish = (values: any) => {
    console.log("finish: ", values);
  }

  // 数据过量
  const handleExcess = () => {
    confirm({
      icon: <ExclamationCircleOutlined />,
      title: '提示',
      content: (
        <>
        <Typography.Text type="warning">系统检测到数据量过大，可能会影响体验</Typography.Text>
        <Form.Item style={{marginTop: 8}} layout='vertical' label='请选择数据量：'>
          <Radio.Group defaultValue={limit} onChange={(e) => setLimit(e.target.value)}>
            <Radio value={-1}>全量</Radio>
            <Radio value={500}>500条</Radio>
            <Radio value={100}>100条</Radio>
          </Radio.Group>
        </Form.Item>
        </>
      ),
      onOk() {
        console.log('--- 最大数据量：', limit);
      },
    })
  }

  const handleTryCompute = () => {
    handleExcess()
  }

  useEffect(() => {}, []);

  return (
    <>
    <div className="pdb-indicator-title">
      <Button className="pdb-indicator-back" type="text" size="small" icon={<LeftOutlined />} onClick={handleBack} />
      <Typography.Text>{routerParams.type == '1' ? '初级指标创建' : '高级指标创建'}</Typography.Text>
    </div>
    <div className="pdb-indicator-simple">
      <div className="pdb-indicator-simple-body">
        <Form name="simple" {...layout} onFinish={onFinish}>
          <Divider orientation="left" orientationMargin={16}>
            基础信息
          </Divider>
          <Form.Item name={"type"} label="类型" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value={1}>中文名称</Radio>
              <Radio value={2}>英文名称</Radio>
            </Radio.Group>
          </Form.Item>
          <Flex wrap>
            <Form.Item
              name={"name"}
              label="所属业务过程"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name={"gc"}
              label="相关业务过程"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name={"desc"} label="指标描述">
              <Input.TextArea />
            </Form.Item>
          </Flex>
          <Divider orientation="left" orientationMargin={16}>
            指标定义
          </Divider>
          <Flex wrap>
            <Form.Item
              name={"source"}
              label="数据资产单"
              rules={[{ required: true }]}
            >
              <Select />
            </Form.Item>
            <Form.Item
              name={"ziduan"}
              label="指标度量"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name={"unit"} label="单位">
              <Input />
            </Form.Item>
            <Form.Item
              name={"compute"}
              label="统计算法"
              rules={[{ required: true }]}
            >
              <Select />
            </Form.Item>
            <Form.Item name={"dimensions"} label="业务维度">
              <Select />
            </Form.Item>
          </Flex>
        </Form>
          <Divider orientation="left" orientationMargin={16}>
            数据筛选
          </Divider>
          <Row>
            <Col span={18} offset={3}>
              <ExploreFilterContent
                readOnly={false}
                visible={true}
                onRef={childRef}
                originType={originType}
              />
            </Col>
          </Row>
          <Divider orientation="left" orientationMargin={16}>
            分组设置
          </Divider>
        <Form name="group">
          <Form.Item
            labelCol={{ span: 3 }}
            wrapperCol={{ span: 20 }}
            style={{ width: "100%" }}
            name={"groupBy"}
            label="Group by"
          >
            <Select />
          </Form.Item>
        </Form>
      </div>
      <div className="pdb-indicator-simple-footer">
        <Button type="primary" onClick={handleTryCompute}>试计算</Button>
        <Space size={16}>
          <Button onClick={handleBack}>关闭</Button>
          <Button type="primary">保存</Button>
        </Space>
      </div>
    </div>
    </>
  );
}
