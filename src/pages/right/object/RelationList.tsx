import { deleteObjectRelation, getRelationTarget, createObjectRelation } from '@/actions/object';
import { lineXaxisMap, updateLineXaxisMap, updateXaxisMap, xaxisMap } from '@/g6/object/edge';
import { NodeItemData, ObjectRelationConig, setToolbarConfig } from '@/reducers/editor';
import { ConnectionState, ConstraintState, TemplateGraphDataState } from '@/reducers/template';
import { StoreState } from '@/store';
import { Button, Form, message, notification, Select, Table } from 'antd';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './index.less';

interface RelationListProps {
  source: NodeItemData
}

export default function RelationList(props: RelationListProps) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const relationMap = useSelector((store: StoreState) => store.editor.relationMap),
    typeRelationMap: any = useSelector((store: StoreState) => store.editor.typeRelationMap),
    { relationLines, showRelationLine } = useSelector((store: StoreState) => store.editor.toolbarConfig.main),
    currentEditModel = useSelector((state: StoreState) => state.editor.currentEditModel);

  const [relations, setRelations] = useState([]),
    [currentRelationMap, setCurrentRelationMap] = useState({} as any),
    [relationConstrarintMap, setRelationConstrarintMap] = useState({} as any);

  const [relationList, setRelationList] = useState([]); // 对象对应类型配置的关系
  const [targetList, setTargetList] = useState([]);
  const [targetMap, setTargetMap] = useState({} as any)

  const [getTargetLoading, setTargetLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  useEffect(() => {
    if (!props.source) return;
    const _relations: any = [], _relationMap: any = {}, _targetList: any = [];
    const usedTargetMap: any = {};
    _.get(relationLines, props.source.uid, []).forEach((item: ObjectRelationConig) => {
      const { relation, target } = item;
      const relationId = _.get(relationMap[relation], 'r.type.name', ''),
        targetLabel = _.get(target, 'x.name', ''),
        targetId = _.get(target, 'uid', '');
      if (!usedTargetMap[targetId]) {
        _targetList.push({
          value: targetId,
          label: targetLabel
        });
        Object.assign(usedTargetMap, { [targetId]: targetLabel });
      }
      _relations.push({
        relation: relationId,
        target: targetId
      });
      if (_relationMap[relationId]) {
        Object.assign(_relationMap[relationId], {
          [targetId]: targetLabel
        });
      } else {
        Object.assign(_relationMap, {
          [relationId]: {
            [targetId]: targetLabel
          }
        });
      }
    });
    setRelations(_relations);
    setCurrentRelationMap(_relationMap);
    setTargetList(_targetList);
    form.setFieldValue('relation', _relations);

    return () => {
      form.resetFields();
      setRelations([]);
      setCurrentRelationMap({});
      setRelationList([]);
      setTargetList([]);
    }
  }, [props.source]);

  useEffect(() => {
    currentEditModel && updateRelationList(currentEditModel.data['x.type.name']);
  }, [currentEditModel?.id]);

  function updateRelationList(typeId: any) {
    const relationList: any = [];
    const usedRelationMap: any = {};
    Array.from(new Set(_.get(typeRelationMap[typeId], 'source', [])))
      .forEach((relationName: any) => {
        const relationLabel = relationMap[relationName]['r.type.label'];
        if (!usedRelationMap[relationName]) {
          relationList.push({
            value: relationName,
            label: relationLabel
          });
          Object.assign(usedRelationMap, { [relationName]: relationLabel });
        }
      });
    setRelationList(relationList);
  }

  const columns = [{
    title: '展示名称',
    dataIndex: 'relation',
    render: (text: any, record: any, index: number) => renderColumn(index, 'relation')
  }, {
    title: '目标对象',
    dataIndex: 'target',
    render: (text: any, record: any, index: number) => renderColumn(index, 'target')
  }, {
    title: '',
    dataIndex: 'operation',
    width: 23,
    render: (text: any, record: any, index: number) => <i className="operation-icon spicon icon-shanchu2" onClick={() => deleteRelation(index)} />
  }];

  // 添加关系
  const handleAddRelation = function () {
    form.validateFields().then((values) => {
      const newRelations = JSON.parse(JSON.stringify(relations));
      newRelations.push({ source: '', target: '' });
      setRelations(newRelations);
      form.setFieldValue('relation', newRelations);
    }).catch(err => {
    });
  }

  // 删除关系
  const deleteRelation = function (index: number, deleteId: any = null, deleteItem: any = null, callback?: any) {
    const _relations = JSON.parse(JSON.stringify(relations));
    if (!_relations[index].relation || !_relations[index].target) {
      if (callback) {
        callback();
        return;
      }
      _relations.splice(index, 1);
      setRelations(_relations);
      return;
    }
    const sourceUid = props.source.uid;
    const relationId = deleteId || _relations[index].relationId || _relations[index].relation;
    const deleteItemConfig = deleteItem || { uid: _relations[index].target };
    deleteObjectRelation([{
      uid: sourceUid,
      [relationId]: [deleteItemConfig]
    }], (success: boolean, response: any) => {
      if (success) {
        const deletTarget = form.getFieldValue(['relation', index, 'target']);
        if (deletTarget && currentRelationMap[relationId] && currentRelationMap[relationId][deletTarget]) {
          delete currentRelationMap[relationId][deletTarget];
        }

        const newRelationLines = JSON.parse(JSON.stringify(_.get(relationLines, sourceUid, [])));
        const relationData = newRelationLines[index];
        if (showRelationLine && relationData && relationData.relation && relationData.target) {
          const edgeId = `${sourceUid}-${relationData.target.uid}-${relationData.relation}`;
          (window as any).PDB_GRAPH.removeItem(edgeId);

          const newXaxisMap = JSON.parse(JSON.stringify(xaxisMap)),
            newLineXaxisMap = JSON.parse(JSON.stringify(lineXaxisMap));
          const sameX = lineXaxisMap[edgeId];
          if (sameX) {
            delete newXaxisMap[sameX][edgeId];
            delete newLineXaxisMap[edgeId];
            updateXaxisMap(newXaxisMap);
            updateLineXaxisMap(newLineXaxisMap);
          }
        }

        if (callback) {
          callback();
          return;
        }
        _relations.splice(index, 1);
        setRelations(_relations);
        form.setFieldValue('relation', _relations);

        const newRelationMap = JSON.parse(JSON.stringify(relationMap));
        delete newRelationMap[relationId][deleteItemConfig.uid];
        setCurrentRelationMap(newRelationMap);

        newRelationLines.splice(index, 1);
        dispatch(setToolbarConfig({
          key: 'main',
          config: {
            relationLines: {
              ...relationLines,
              [sourceUid]: newRelationLines
            }
          }
        }));
      } else {
        notification.error({
          message: '删除对象属关系失败',
          description: response.message || response.msg
        });
      }
    });
  }

  // 更改关系值
  const handleChangeRelation = function (value: string, index: number) {
    setTargetList([]);
    deleteRelation(index, null, null, () => {
      form.setFieldValue(['relation', index, 'target'], '');
      const newRelationLines = JSON.parse(JSON.stringify(_.get(relationLines, props.source.uid, [])));
      newRelationLines[index] = { relation: value, target: {} };
      dispatch(setToolbarConfig({
        key: 'main',
        config: {
          relationLines: {
            ...relationLines,
            [props.source.uid]: newRelationLines
          }
        }
      }));
      setRelations(form.getFieldValue('relation'));
    });
  }

  // 获取目标对象
  const handleGetRelationTarget = function (index: number) {
    setTableLoading(true);
    const relation = form.getFieldValue(['relation', index, 'relation']);
    getRelationTarget({
      'x.type.name': props.source.data['x.type.name'],
      'x.relation.name': relation
    }, (success: any, response: any) => {
      if (success) {
        const _targetList: any = [], newTargetMap = { ...targetMap };
        response.forEach((item: any) => {
          const value = item['uid'], label = item['x.name'];
          _targetList.push({
            value,
            label,
            type: item['x.type.name'],
            disabled: Boolean(currentRelationMap[relation] && currentRelationMap[relation][item['uid']])
          });
          Object.assign(newTargetMap, { [item.uid]: { ...item } });
        });
        setTargetMap(newTargetMap);
        setTargetList(_targetList);
      } else {
        notification.error({
          message: '获取目标关系的对象失败',
          description: response.message || response.msg
        });
      }
      setTableLoading(false);
    });
  }

  // 修改对象关系
  const handleChangeTarget = function (uid: string, option: any, index: number) {
    const relation = form.getFieldValue(['relation', index, 'relation']);
    const prvRelationId = relations[index]['relation'],
      prvRelationTarget = relations[index]['target'];
    const sourceUid = props.source.uid;
    const newRelationLines = JSON.parse(JSON.stringify(_.get(relationLines, sourceUid, [])));

    function createRelation() {
      const targetDetail = targetMap[uid];
      if (relationConstrarintMap[relation]) {
        const relationConstrarint = relationConstrarintMap[relation];
        const tgtLabel = option.label,
          tgtType = option.type;
        const srcLabel = props.source.data['x.name'],
          srcType = props.source.data['x.type.name'];
        const maxTgt = relationConstrarint[srcType + '-' + tgtType] || Infinity;
        let currentNum = Object.keys(currentRelationMap[relation] || {}).filter(val => _.get(targetMap[val], 'x.type.name') === tgtType).length;
        if (_.get(targetMap[prvRelationTarget], 'x.type.name') === tgtType) {
          currentNum -= 1;
        }
        if (maxTgt <= currentNum) {
          message.warning(`从 “${srcLabel}” 对象类型到 “${tgtLabel}” 对象类型的 “${relationMap[relation]['r.type.label']}” 关系达到上限，最高上限为${currentNum}`);
          form.setFieldValue(['relation', index, 'target'], '');
          return;
        }
      }

      const targetOption = {
        uid,
        'x.name': targetDetail['x.name']
      };
      Object.assign(newRelationLines[index], {
        target: targetOption
      });

      createObjectRelation([{
        uid: props.source.uid,
        [relation]: [targetOption]
      }], (success: any, response: any) => {
        if (success) {
          setRelations(form.getFieldValue('relation'));
          const newRelationMap = JSON.parse(JSON.stringify(currentRelationMap));
          const targetLabel = targetMap[uid]['x.name'];
          if (newRelationMap[relation]) {
            Object.assign(newRelationMap[relation], { [uid]: targetLabel });
          } else {
            Object.assign(newRelationMap, { [relation]: { [uid]: targetLabel } });
          }
          setCurrentRelationMap(newRelationMap);

          const relationData = newRelationLines[index];
          if (showRelationLine && relationData && relationData.target && relationData.relation) {
            const edgeId = `${sourceUid}-${relationData.target.uid}-${relationData.relation}`;
            (window as any).PDB_GRAPH.removeItem(edgeId);

            const newXaxisMap = JSON.parse(JSON.stringify(xaxisMap)),
              newLineXaxisMap = JSON.parse(JSON.stringify(lineXaxisMap));
            const sameX = lineXaxisMap[edgeId];
            if (sameX) {
              delete newXaxisMap[sameX][edgeId];
              delete newLineXaxisMap[edgeId];
              updateXaxisMap(newXaxisMap);
              updateLineXaxisMap(newLineXaxisMap);
            }
          }

          const newLineData = {
            relation: form.getFieldValue(['relation', index, 'relation']),
            target: {
              uid,
              'x.name': targetMap[uid]['x.name']
            }
          };
          if (newRelationLines[index]) {
            Object.assign(newRelationLines[index], { ...newLineData });
          } else {
            newRelationLines.push({ ...newLineData });
          }
          dispatch(setToolbarConfig({
            key: 'main',
            config: {
              relationLines: {
                ...relationLines,
                [sourceUid]: newRelationLines
              }
            }
          }));
        } else {
          notification.error({
            message: '设置目标关系的对象失败',
            description: response.message || response.msg
          });
        }
      });
    }

    if (relations[index] && relations[index]['relation'] && relations[index]['target']) {

      deleteRelation(index, prvRelationId, { uid: prvRelationTarget }, () => {
        createRelation();
      });
    } else {
      createRelation();
    }
  }

  const renderColumn = (index: number, key: string) => (
    <Form.Item
      name={['relation', index, key]}
      className='relation-item'
      rules={[
        { required: true, message: '' },
        {
          validator: async (_, value) => {
            const relationLines = form.getFieldValue('relation');
            const currentBind = relationLines[index];
            if (currentBind && currentBind.relation && currentBind.target) {
              if (relationLines.findIndex((val: any, i: number) => val.source === currentBind.relation && val.target === currentBind.target && index !== i) > -1) {
                throw new Error('');
              }
            }
          }
        }
      ]}
    >
      {key === 'relation' ?
        <Select
          options={relationList}
          loading={getTargetLoading}
          showSearch
          filterOption={(input, option: any) =>
          ((option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase()) ||
            (option?.value ?? '').toString() === input)
          }
          onChange={value => handleChangeRelation(value, index)}>
        </Select> :
        <Select
          options={targetList}
          loading={getTargetLoading}
          showSearch
          filterOption={(input, option: any) =>
          ((option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase()) ||
            (option?.value ?? '').toString() === input)
          }
          disabled={!form.getFieldValue(['relation', index, 'relation'])}
          onFocus={() => handleGetRelationTarget(index)}
          onChange={(value, option) => handleChangeTarget(value, option, index)}>
        </Select>
      }
    </Form.Item>
  );

  return (
    <div className='pdb-object-relation-editor'>
      <div className='pdb-object-relation-title'>
        <span>以此对象为源对象：</span>
      </div>
      <Form form={form}>
        <Table
          loading={tableLoading}
          columns={columns}
          dataSource={relations}
          pagination={false}
        />
      </Form >
      <Button
        type='dashed'
        onClick={() => handleAddRelation()}
        style={{ width: '100%', marginTop: '.8rem' }}
      >
        <i className='spicon icon-plus'></i>
      </Button>
    </div>
  )
}