import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Col, Flex, notification, Row, Select, Typography } from "antd";
import type { StoreState } from '@/store';
import { setDiffVersion, TypeVersionConfig } from '@/reducers/type';
import { difference, find, forEach, isEmpty, map } from 'lodash';
import moment from 'moment';
import DiffAttrTable from './DiffAttrTable';
import DiffMetadata from './DiffMetadata';
import { diffTypeVerison } from '@/actions/type';

export default function DiffVersionPane() {
  const dispatch = useDispatch();
  const tableWrapper = useRef(null);
  const graphData = useSelector((state: StoreState) => state.object.graphData);
  const currentEditModel = useSelector((state: StoreState) => state.editor.currentEditModel);
  const diffVersion = useSelector((state: StoreState) => state.type.diffVersion);
  const versionList = useSelector((state: StoreState) => state.type.versionList);

  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([])
  const [oldVersion, setOldVersion] = useState<TypeVersionConfig>()
  const [newVersion, setNewVersion] = useState<TypeVersionConfig>()
  const [createdNames, setCreatedNames] = useState<string[]>([])
  const [deletedNames, setDeletedNames] = useState<string[]>([])
  const [modifyNames, setModifyNames] = useState<{[key:string]: string[]}>({})
  const [currentIsLatest, setCurrentIsLatest] = useState(false)
  const [maxTableHeight, setMaxTableHeight] = useState(360)

  const onCurrChange = (val:string) => {
    const curr = find(versionList, item => item["x.type.version.id"] === val)
    setOldVersion(curr)
  }
  const onDiffChange = (val:string) => {
    const diff = find(versionList, item => item["x.type.version.id"] === val)
    setNewVersion(diff)
  }

  const handleDiffVersion = () => {
    if (!diffVersion || isEmpty(diffVersion)) {
      notification.error({
        message: '对比失败',
        description: '请选择要对比的对象类型版本'
      })
      return
    }

    // diffTypeVerison(graphData.id, diffVersion[0], diffVersion[1], (success:boolean, response:any) => {
    //   if (success) {
    //     const { base, attr } = response
    //     console.log('diff version, base: ', base)
    //     console.log('diff version, attr: ', attr)
    //   } else {
    //     notification.error({
    //       message: '对象类型版本对比失败',
    //       description: response.message || response.msg
    //     })
    //   }
    // })
  }

  useEffect(() => {
    if (!oldVersion || !newVersion) return

    const currAttrs = oldVersion["x.type.version.attrs"]
    const diffAttrs = newVersion["x.type.version.attrs"]
    const latest = oldVersion["x.type.version.created"] - newVersion["x.type.version.created"] > 0;
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
  }, [oldVersion, newVersion])

  useEffect(() => {
    if (diffVersion) {
      const curr = find(versionList, item => item["x.type.version.id"] === diffVersion[0])
      setOldVersion(curr)
      const diff = find(versionList, item => item["x.type.version.id"] === diffVersion[1])
      setNewVersion(diff)

      if (tableWrapper.current) {
        const wrapper: any = tableWrapper.current
        setMaxTableHeight(wrapper?.offsetHeight)
      }
    }
  }, [diffVersion])
  
  const items = map(versionList, (v: TypeVersionConfig) => ({ value: v["x.type.version.id"], label: v["x.type.version.name"] ? `V${v["x.type.version.name"]}`: '--'}));

  if (!diffVersion || !oldVersion || !newVersion) return null;
  const oldOptions = items.map(item => item.value === diffVersion[1] ? ({...item, disabled: true}) : item);
  const newOptions = items.map(item => item.value === diffVersion[0] ? ({...item, disabled: true}) : item);

  return (
    <div className="pdb-diff-version">
      <Row gutter={24}>
        <Col span={12}>
          <Select defaultValue={diffVersion[0]} style={{width: '100%'}} options={oldOptions} onChange={onCurrChange} />
          <Typography.Text className="pdb-diff-version-time" type="secondary">创建时间：{moment(oldVersion["x.type.version.created"]).format("YYYY-MM-DD HH:mm:ss")}</Typography.Text>
          <div className='pdb-diff-version-title'><Typography.Text strong>基本信息</Typography.Text></div>
          <DiffMetadata typeName={currentEditModel?.label} metadata={oldVersion["x.type.metadata"]} modified={oldVersion["x.type.metadata"] !== newVersion["x.type.metadata"]} />
          <div className='pdb-diff-version-title'><Typography.Text strong>属性信息</Typography.Text></div>
        </Col>
        <Col span={12}>
          <Select defaultValue={diffVersion[1]} style={{width: '100%'}} options={newOptions} onChange={onDiffChange} />
          <Typography.Text className="pdb-diff-version-time" type="secondary">创建时间：{moment(newVersion["x.type.version.created"]).format("YYYY-MM-DD HH:mm:ss")}</Typography.Text>
          <div className='pdb-diff-version-title'><Typography.Text strong>基本信息</Typography.Text></div>
          <DiffMetadata typeName={currentEditModel?.label} metadata={newVersion["x.type.metadata"]} modified={newVersion["x.type.metadata"] !== oldVersion["x.type.metadata"]} />
          <div className='pdb-diff-version-title'><Typography.Text strong>属性信息</Typography.Text></div>
        </Col>
      </Row>
      <Row gutter={24} style={{flex: '1 1'}} ref={tableWrapper}>
        <Col span={12}>
          <DiffAttrTable
            maxHeight={maxTableHeight}
            attrs={oldVersion['x.type.version.attrs'] || []}
            modifyNames={modifyNames}
            createdNames={currentIsLatest ? createdNames : []}
            deletedNames={!currentIsLatest ? deletedNames : []}
            expandedRowKeys={expandedRowKeys}
            changeExpandedKeys={(keys: string[]) => setExpandedRowKeys(keys)}
          />
        </Col>
        <Col span={12}>
          <DiffAttrTable
            maxHeight={maxTableHeight}
            attrs={newVersion['x.type.version.attrs'] || []}
            modifyNames={modifyNames}
            createdNames={!currentIsLatest ? createdNames : []}
            deletedNames={currentIsLatest ? deletedNames : []}
            expandedRowKeys={expandedRowKeys}
            changeExpandedKeys={(keys: string[]) => setExpandedRowKeys(keys)}
          />
        </Col>
      </Row>
      <Flex justify="center" align="center" className='pdb-diff-foot'>
        <div className='pdb-diff-tag pdb-diff-tag-new'>新增</div>
        <div className='pdb-diff-tag pdb-diff-tag-modify'>修改</div>
        <div className='pdb-diff-tag pdb-diff-tag-deleted'>移除</div>
      </Flex>
    </div>
  )
}