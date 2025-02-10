import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Col, Flex, Row, Select, Typography } from "antd";
import type { StoreState } from '@/store';
import { setCurrentVersion, setDiffVersion, TypeVersionConfig } from '@/reducers/type';
import { difference, find, forEach, map } from 'lodash';
import moment from 'moment';
import DiffAttrTable from './DiffAttrTable';
import DiffMetadata from './DiffMetadata';

export default function DiffVersionPane() {
  const dispatch = useDispatch();
  const currentEditModel = useSelector((state: StoreState) => state.editor.currentEditModel);
  const currentVersion = useSelector((state: StoreState) => state.type.currentVersion);
  const diffVersion = useSelector((state: StoreState) => state.type.diffVersion);
  const versionList = useSelector((state: StoreState) => state.type.versionList);

  const id = currentVersion ? currentVersion["x.type.version.id"] : '';
  const diffId = diffVersion ? diffVersion["x.type.version.id"] : '';
  const [currVersionId, setCurrVersionId] = useState(id)
  const [diffVersionId, setDiffVersionId] = useState(diffId)
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([])
  const [createdNames, setCreatedNames] = useState<string[]>([])
  const [deletedNames, setDeletedNames] = useState<string[]>([])
  const [modifyNames, setModifyNames] = useState<{[key:string]: string[]}>({})
  const [currentIsLatest, setCurrentIsLatest] = useState(false)

  const onCurrChange = (val:string) => {
    setCurrVersionId(val)
    const curr = find(versionList, item => item["x.type.version.id"] === val)
    dispatch(setCurrentVersion(curr))
  }
  const onDiffChange = (val:string) => {
    setDiffVersionId(val)
    const diff = find(versionList, item => item["x.type.version.id"] === val)
    dispatch(setDiffVersion(diff))
  }

  useEffect(() => {
    if (currentVersion && diffVersion) {
      const currAttrs = currentVersion["x.type.version.attrs"]
      const diffAttrs = diffVersion["x.type.version.attrs"]
      const latest = currentVersion["x.type.version.created"] - diffVersion["x.type.version.created"] > 0;
      setCurrentIsLatest(latest);
      const currNames = map(currAttrs, "name");
      const diffNames = map(diffAttrs, "name");
      const currDiff: string[] = difference(currNames, diffNames);
      const diffCurr: string[] = difference(diffNames, currNames);
      const newNames = latest ? currDiff : diffCurr;
      const delNames = latest ? diffCurr : currDiff;
      const modNames: {[key:string]: string[]} = {};
      forEach(currAttrs, attr => {
        if (diffNames.includes(attr.name)) {
          const diffAttr = find(diffAttrs, {name: attr.name});
          const defaultModified = attr.default !== diffAttr?.default;
          const displayModified = attr.display !== diffAttr?.display;
          const requiredModified = attr.required !== diffAttr?.required;
          const typeModified = attr.type !== diffAttr?.type;
          const overrideModified = attr.override !== diffAttr?.override;
          if (defaultModified || displayModified || requiredModified || typeModified || overrideModified) {
            modNames[attr.name] = []
            if (defaultModified) modNames[attr.name].push('default')
            if (displayModified) modNames[attr.name].push('display')
            if (requiredModified) modNames[attr.name].push('required')
            if (typeModified) modNames[attr.name].push('type')
            if (overrideModified) modNames[attr.name].push('override')
          }
        }
      })

      setCreatedNames(newNames)
      setDeletedNames(delNames)
      setModifyNames(modNames)
    }
  }, [currentVersion, diffVersion])
  
  const items = map(versionList, (v: TypeVersionConfig) => ({ value: v["x.type.version.id"], label: 'V' + v["x.type.version.name"]}));

  if (!currentVersion || !diffVersion) return null;
  const currOptions = diffVersionId ? items.map(item => item.value === diffVersionId ? ({...item, disabled: true}) : item) : items;
  const diffOptions = currVersionId ? items.map(item => item.value === currVersionId ? ({...item, disabled: true}) : item) : items;

  return (
    <div className="pdb-diff-version">
      <Row gutter={24}>
        <Col span={12}>
          <Select value={currVersionId} style={{width: '100%'}} options={currOptions} onChange={onCurrChange} />
          <Typography.Text className="pdb-diff-version-time" type="secondary">创建时间：{moment(currentVersion["x.type.version.created"]).format("YYYY-MM-DD HH:mm:ss")}</Typography.Text>
          <div className='pdb-diff-version-title'><Typography.Text strong>基本信息</Typography.Text></div>
          <DiffMetadata typeName={currentEditModel?.label} metadata={currentVersion["x.type.metadata"]} modified={currentVersion["x.type.metadata"] !== diffVersion["x.type.metadata"]} />
          <div className='pdb-diff-version-title'><Typography.Text strong>属性信息</Typography.Text></div>
        </Col>
        <Col span={12}>
          <Select value={diffVersionId} style={{width: '100%'}} options={diffOptions} onChange={onDiffChange} />
          <Typography.Text className="pdb-diff-version-time" type="secondary">创建时间：{moment(diffVersion["x.type.version.created"]).format("YYYY-MM-DD HH:mm:ss")}</Typography.Text>
          <div className='pdb-diff-version-title'><Typography.Text strong>基本信息</Typography.Text></div>
          <DiffMetadata typeName={currentEditModel?.label} metadata={diffVersion["x.type.metadata"]} modified={currentVersion["x.type.metadata"] !== diffVersion["x.type.metadata"]} />
          <div className='pdb-diff-version-title'><Typography.Text strong>属性信息</Typography.Text></div>
        </Col>
      </Row>
      <Row gutter={24} style={{"flex": 1}}>
        <Col span={12}>
          <DiffAttrTable
            attrs={currentVersion['x.type.version.attrs'] || []}
            modifyNames={modifyNames}
            createdNames={currentIsLatest ? createdNames : []}
            deletedNames={!currentIsLatest ? deletedNames : []}
            expandedRowKeys={expandedRowKeys}
            changeExpandedKeys={(keys: string[]) => setExpandedRowKeys(keys)}
          />
        </Col>
        <Col span={12}>
          <DiffAttrTable
            attrs={diffVersion['x.type.version.attrs'] || []}
            modifyNames={modifyNames}
            createdNames={!currentIsLatest ? createdNames : []}
            deletedNames={currentIsLatest ? deletedNames : []}
            expandedRowKeys={expandedRowKeys}
            changeExpandedKeys={(keys: string[]) => setExpandedRowKeys(keys)}
          />
        </Col>
      </Row>
      <Flex justify="center" align="center">
        <div className='pdb-diff-tag pdb-diff-tag-new'>新增</div>
        <div className='pdb-diff-tag pdb-diff-tag-modify'>修改</div>
        <div className='pdb-diff-tag pdb-diff-tag-deleted'>移除</div>
      </Flex>
    </div>
  )
}