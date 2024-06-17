import { getVersionList } from '@/actions/object';
import { ObjectConfig } from '@/reducers/object';
import { formatTimestamp } from '@/utils/common';
import { notification, Table } from 'antd';
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
  const [count, setCount] = useState(0),
    [versionList, setVersionList] = useState([]),
    [versionLoading, setVersionLoading] = useState(false);

  const pageSize = 5
  const columns = [{
    dataIndex: "v.version",
    title: "版本号"
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
    </div>
  )
}