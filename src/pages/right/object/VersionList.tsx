import { getVersionList } from '@/actions/object';
import { ObjectConfig } from '@/reducers/object';
import { formatTimestamp } from '@/utils/common';
import { Modal, notification, Table, Tabs } from 'antd';
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
          'v.status': source['x_checkout'] && _.get(checkoutVesion, "uid") === version.uid ? "编辑中" : "已发布",
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
    const attrData: any[] = [], relationData: any[] = [], childrenList: any[] = record["v.children"];
    Object.keys(attrs).forEach(key => {
      if (key.startsWith("Relation.")) {
        attrs[key].forEach(function ({ uid }: { uid: string }) {
          relationData.push({
            relation: key,
            uid
          });
        });
      } else if (key !== "uid" && !key.startsWith("x.")) {
        attrData.push({
          key,
          value: attrs[key]
        });
      }
    });
    const tabs = [];
    if (attrData.length > 0) {
      const attrColumns = [{
        dataIndex: "key",
        title: "属性"
      }, {
        dataIndex: "value",
        title: "值"
      }];
      tabs.push({
        key: "attr",
        label: "属性列表",
        children: (<Table columns={attrColumns} dataSource={attrData} />)
      });
    }
    if (relationData.length > 0) {
      const relationColumns = [{
        dataIndex: "relation",
        title: "关系"
      }, {
        dataIndex: "uid",
        title: "目标对象"
      }];
      tabs.push({
        key: "relation",
        label: "关系列表",
        children: (<Table columns={relationColumns} dataSource={relationData} />)
      });
    }
    if (childrenList && childrenList.length > 0) {
      const childrenColumns = [{
        dataIndex: "uid",
        title: "对象实例"
      }];
      tabs.push({
        key: "relation",
        label: "关系列表",
        children: (<Table columns={childrenColumns} dataSource={childrenList} />)
      });
    }
    modal.info({
      title: `版本${record["v.version"]} 修改详情`,
      icon: null,
      content: (<Tabs items={tabs} />),
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