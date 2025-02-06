import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Col, Row, Select, Typography } from "antd";
import type { StoreState } from '@/store';
import { setCurrentVersion, setDiffVersion, TypeVersionConfig } from '@/reducers/type';
import { map } from 'lodash';
import moment from 'moment';
import DiffAttrTable from './DiffAttrTable';

export default function DiffVersionPane() {
  const currentVersion = useSelector((state: StoreState) => state.type.currentVersion);
  const diffVersion = useSelector((state: StoreState) => state.type.diffVersion);
  const versionList = useSelector((state: StoreState) => state.type.versionList);

  const id = currentVersion ? currentVersion["x.type.version.id"] : '';
  const diffId = diffVersion ? diffVersion["x.type.version.id"] : '';
  const [currVersionId, setCurrVersionId] = useState(id)
  const [diffVersionId, setDiffVersionId] = useState(diffId)
  console.log(id, diffId)
  const items = map(versionList, (v: TypeVersionConfig) => ({ value: v["x.type.version.id"], label: 'V' + v["x.type.version.name"]}));
  console.log(items)

  if (!currentVersion || !diffVersion) return null;

  return (
    <div className="pdb-diff-version">
      <Row gutter={24}>
        <Col span={12}>
          <Select value={currVersionId} style={{width: '100%'}} options={items} />
          <Typography.Text className="pdb-diff-version-time" type="secondary">创建时间：{moment(currentVersion["x.type.version.created"]).format("YYYY-MM-DD HH:mm:ss")}</Typography.Text>
          <div className='pdb-diff-version-title'><Typography.Text strong>基本信息</Typography.Text></div>
          <div className='pdb-diff-version-title'><Typography.Text strong>属性信息</Typography.Text></div>
          <DiffAttrTable attrs={currentVersion['x.type.version.attrs'] || []} />
        </Col>
        <Col span={12}>
          <Select value={diffVersionId} style={{width: '100%'}} options={items} />
          <Typography.Text className="pdb-diff-version-time" type="secondary">创建时间：{moment(diffVersion["x.type.version.created"]).format("YYYY-MM-DD HH:mm:ss")}</Typography.Text>
          <div className='pdb-diff-version-title'><Typography.Text strong>基本信息</Typography.Text></div>
          <div className='pdb-diff-version-title'><Typography.Text strong>属性信息</Typography.Text></div>
        </Col>
      </Row>
      <Row gutter={24}></Row>
    </div>
  )
}