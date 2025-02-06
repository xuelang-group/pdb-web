import { Table, Typography } from "antd";
import { AttrConfig } from "@/reducers/type";

interface DiffProps {
  attrs: Array<AttrConfig>;
}

export default function DiffAttrTable(props: DiffProps) {

  const columns = [{
    dataIndex: 'name',
    key: 'name',
    title: <>名称<Typography.Text type="secondary" className="pdb-diff-title-small">(唯一标识)</Typography.Text></>
  }, {
    dataIndex: 'display',
    key: 'display',
    title: '展示名称'
  }, {
    dataIndex: 'type',
    key: 'type',
    title: '类型'
  }]

  const expandedRowRender = (record: AttrConfig) => <p style={{ margin: 0 }}>{record.default}</p>

  return (
    <Table rowKey="name"
      size="small" bordered
      columns={columns}
      dataSource={props.attrs}
      expandable={{
        expandedRowRender: expandedRowRender,
        // rowExpandable: true,
      }}
      pagination={false}
    />
  )
}