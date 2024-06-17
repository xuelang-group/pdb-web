import { getVersionList } from '@/actions/object';
import { NodeItemData } from '@/reducers/editor';
import { notification, Table } from 'antd';
import { useEffect, useState } from 'react';
import './index.less';

interface RelationListProps {
  source: NodeItemData
  loading?: boolean
}

export default function RelationList(props: RelationListProps) {
  const { source, loading } = props;
  const [currentPage, setCurrentPage] = useState(1),
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
        setVersionList(response);
      } else {
        notification.error({
          message: '获取版本列表失败',
          description: response.message || response.msg
        });
      }
    });
  }

  useEffect(() => {
    if (source.uid) {
      getVersions(0);
    }
  }, [source]);

  return (
    <div className='pdb-object-version-list'>
      <Table
        columns={columns}
        pagination={{
          pageSize,
          onChange(page, pageSize) {
            getVersions((page - 1) * pageSize);
          },
        }}
      />
    </div>
  )
}