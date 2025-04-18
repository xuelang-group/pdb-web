import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Input, Form, notification, Modal, Table, Tag, Space, Radio, Switch, message } from 'antd';
import moment from 'moment';

interface sourceItem {
  id?: string;
  name?: string;
  created?: number;
}
interface VersionListProps {
  currentVersionId: string;
  data: sourceItem[];
  disabled: boolean;
  loading: boolean;
  style?: any;
  size?: 'small'
  y: number;
}

export default function VersionList({loading, disabled, style, currentVersionId, data, size, y}: VersionListProps) {

  const columns = [{
      dataIndex: `name`,
      title: '版本号',
      render: (text:string, record: sourceItem) => {
        const vn = text ? `V${text}` : '--'
        return currentVersionId === record['id'] ? (
        <Space><span>{vn}</span><Tag>当前版本</Tag></Space>
        ) : vn
      }
    }, {
      dataIndex: `createdTime`,
      title: '创建时间',
      render: (text:number) => moment(text).format("YYYY-MM-DD HH:mm:ss")
    }]

  return (
    <Table className={disabled ? 'pdb-table-scroll pdb-type-table-disabled' : 'pdb-table-scroll'}
      style={style}
      columns={columns}
      dataSource={data}
      pagination={false}
      size={ size || 'middle'}
      scroll={{y: y}}
      rowKey={`id`}
      loading={loading}
    />
  )
}