import { getVersionList } from '@/actions/object';
import { ObjectConfig } from '@/reducers/object';
import { formatTimestamp } from '@/utils/common';
import { Modal, notification, Table } from 'antd';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import './index.less';

interface RelationListProps {
  source: ObjectConfig
  checkoutVesion: any
  loading?: boolean
}

export default function RelationList(props: RelationListProps) {
  const { source, loading, checkoutVesion } = props;
  const [modal, contextHolder] = Modal.useModal()
  const [count, setCount] = useState(0),
    [versionList, setVersionList] = useState([]),
    [versionLoading, setVersionLoading] = useState(false);

  const pageSize = 5
  const columns = [{
    dataIndex: "v.version",
    title: "版本号",
    render: (text: any, record: any, index: number) => (
      record['v.status'] === "编辑中" ?
        <span>{text}</span> :
        <span style={{ cursor: "pointer", color: "#0084FF" }} onClick={() => handleShowDetail(record)}>{text}</span>
    )
  }, {
    dataIndex: "v.status",
    title: "状态"
  }, {
    dataIndex: "v.created",
    title: "创建时间"
  }];

  function getVersions(offset: number) {
    setVersionLoading(true);
    getVersionList({
      uid: source.uid,
      offset,
      first: pageSize
    }, (success: boolean, response: any) => {
      setVersionLoading(false);
      if (success) {
        setCount(response.count || 0);
        response.versions && setVersionList(response.versions.map((version: any) => ({
          ...version,
          'v.status': source['x.checkout'] && _.get(checkoutVesion, "uid") === version.uid ? "编辑中" : "已发布",
          'v.created': formatTimestamp(Number(version['v.created']))
        })));
      } else {
        notification.error({
          message: '获取版本列表失败',
          description: response.message || response.msg
        });
      }
    });
  }

  function handleShowDetail(record: any) {
    const attrs = JSON.parse(JSON.stringify(record["v.attrs"]));
    const { uid, ...other } = attrs;
    const attrColumns = [{
      dataIndex: "key",
      title: "属性"
    }, {
      dataIndex: "value",
      title: "值"
    }];
    const attrData:any[] = [];
    Object.keys(attrs).forEach(key => {
      if (key !== "uid" && !key.startsWith("x.")) {
        attrData.push({
          key,
          value: attrs[key]
        });
      }
    });
    modal.info({
      title: `版本${record["v.version"]} 修改详情`,
      icon: null,
      content: (
        <div>
          <Table columns={attrColumns} dataSource={attrData} />
        </div>
      ),
      okText: "关闭"
    });
  }

  useEffect(() => {
    if (source && source.uid) {
      getVersions(0);
    }
    return () => {
      setVersionList([]);
      setVersionLoading(false);
      setCount(0);
    }
  }, [source]);

  return (
    <div className='pdb-object-version-list'>
      <Table
        loading={versionLoading || loading}
        dataSource={versionList}
        columns={columns}
        pagination={{
          pageSize,
          total: count,
          onChange(page, pageSize) {
            getVersions((page - 1) * pageSize);
          },
        }}
      />
      {contextHolder}
    </div>
  )
}