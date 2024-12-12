import { Button, Form, message, notification, Select, Table } from 'antd';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { deleteObjectRelation, getRelationTarget, setObjectRelation, getObject } from '@/actions/object';
import { lineXaxisMap, updateLineXaxisMap, updateXaxisMap, xaxisMap } from '@/g6/edge';
import { NodeItemData, ObjectRelationConig, setToolbarConfig } from '@/reducers/editor';
import { StoreState } from '@/store';
import './index.less';
import { AttrConfig } from '@/reducers/type';
import { ObjectConfig, ObjectRelationInfo } from '@/reducers/object';

interface RelationListProps {
  source: NodeItemData
  loading?: boolean
}

export default function RelationList(props: RelationListProps) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const graphData = useSelector((state: any) => state.object.graphData),
    relationMap = useSelector((store: StoreState) => store.editor.relationMap),
    typeRelationMap: any = useSelector((store: StoreState) => store.editor.typeRelationMap),
    { relationLines, showRelationLine } = useSelector((store: StoreState) => store.editor.toolbarConfig.main),
    currentEditModel = useSelector((state: StoreState) => state.editor.currentEditModel),
    isEditing = useSelector((state: StoreState) => state.editor.isEditing);

  const [relations, setRelations] = useState<{ 'relation': string, 'target': string, 'source'?: string }[]>([]),
    [currentRelationMap, setCurrentRelationMap] = useState({} as any),
    [relationList, setRelationList] = useState([]), // 对象对应类型配置的关系
    [targetList, setTargetList] = useState([]),
    [targetMap, setTargetMap] = useState<{ [key: string]: ObjectConfig }>({}),
    [tableLoading, setTableLoading] = useState(false);

  useEffect(() => {
    if (!props.source) return;
    const _relations: any = [], _relationMap: any = {}, _targetList: any = [];
    const usedTargetMap: any = {}, noLabelObject = {};
    setTableLoading(true);
    _.get(relationLines, props.source.id, []).forEach((item: ObjectRelationConig) => {
      const relationId = item['r.type.id'],
        targetId = item['r.object.target.id'],
        targetLabel = item['r.object.target.name'];
      if (!targetLabel) Object.assign(noLabelObject, { [targetId]: targetId });
      if (!usedTargetMap[targetId] && targetLabel) {
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
          [targetId]: targetId
        });
      } else {
        Object.assign(_relationMap, {
          [relationId]: {
            [targetId]: targetId
          }
        });
      }
    });

    if (!_.isEmpty(noLabelObject)) {
      getObject(graphData?.id, Object.keys(noLabelObject).map(id => ({ 'x.object.id': id })), (success: boolean, response: any) => {
        if (success) {
          response.forEach(function (item: ObjectConfig) {
            _targetList.push({
              value: item['x.object.id'],
              label: item['x.object.name']
            });
          });
        }
        setRelations(_relations);
        setCurrentRelationMap(_relationMap);
        setTargetList(_targetList);
        form.setFieldValue('relation', _relations);
        setTableLoading(false);
      });
    } else {
      setRelations(_relations);
      setCurrentRelationMap(_relationMap);
      setTargetList(_targetList);
      form.setFieldValue('relation', _relations);
      setTableLoading(false);
    }

    return () => {
      form.resetFields();
      setRelations([]);
      setCurrentRelationMap({});
      setTargetList([]);
    }
  }, [props.source, relationLines]);

  useEffect(() => {
    currentEditModel && updateRelationList(_.get(currentEditModel.data, 'x.type.id'));
  }, [currentEditModel?.id]);

  function updateRelationList(typeId: any) {
    const relationList: any = [];
    const usedRelationMap: any = {};
    Array.from(new Set(_.get(typeRelationMap[typeId], 'source', [])))
      .forEach((relationName: any) => {
        const relationLabel = relationMap[relationName]['r.type.name'];
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

  const columns: any[] = [{
    title: '展示名称',
    dataIndex: 'relation',
    render: (text: any, record: any, index: number) => renderColumn(index, 'relation')
  }, {
    title: '目标对象',
    dataIndex: 'target',
    render: (text: any, record: any, index: number) => renderColumn(index, 'target')
  }];

  if (isEditing) {
    columns.push({
      title: '',
      dataIndex: 'operation',
      width: 23,
      render: (text: any, record: any, index: number) => <i className="operation-icon spicon icon-shanchu2" onClick={() => handleDeleteRelation(index)} />
    });
  }
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
  const handleDeleteRelation = function (index: number, deleteRelationId: string | null = null, deleteRelationTargetId: string | null = null, callback?: any) {
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
    const sourceId = props.source.id;
    const relationId = deleteRelationId || _relations[index].relation;
    const relationTargetId = deleteRelationTargetId || _relations[index].target;
    deleteObjectRelation(graphData?.id, [{
      'r.type.id': relationId,
      'r.object.source.id': sourceId,
      'r.object.target.id': relationTargetId
    }], (success: boolean, response: any) => {
      if (success) {
        const deletTarget = form.getFieldValue(['relation', index, 'target']);
        if (deletTarget && currentRelationMap[relationId] && currentRelationMap[relationId][deletTarget]) {
          delete currentRelationMap[relationId][deletTarget];
        }

        const newRelationLines = JSON.parse(JSON.stringify(_.get(relationLines, sourceId, [])));
        const relationData: ObjectRelationConig = newRelationLines[index];
        if (showRelationLine && relationData['r.type.id'] && relationData['r.object.target.id']) {
          const edgeId = `${sourceId}-${relationData['r.object.target.id']}-${relationData['r.type.id']}`;
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
        delete newRelationMap[relationId][relationTargetId];
        setCurrentRelationMap(newRelationMap);

        newRelationLines.splice(index, 1);
        dispatch(setToolbarConfig({
          key: 'main',
          config: {
            relationLines: {
              ...relationLines,
              [sourceId]: newRelationLines
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
    handleDeleteRelation(index, null, null, () => {
      form.setFieldValue(['relation', index, 'target'], '');
      const newRelationLines = JSON.parse(JSON.stringify(_.get(relationLines, props.source.id, [])));
      newRelationLines[index] = {
        'r.type.id': value,
        'r.object.target.id': '',
        'r.object.source.id': props.source.id
      };
      dispatch(setToolbarConfig({
        key: 'main',
        config: {
          relationLines: {
            ...relationLines,
            [props.source.id]: newRelationLines
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
      'x.type.id': props.source.data['x.type.id'],
      'x.relation.name': relation
    }, (success: any, response: any) => {
      if (success) {
        const _targetList: any = [], newTargetMap: { [key: string]: ObjectConfig } = { ...targetMap };
        response.forEach((item: ObjectConfig) => {
          const value = item['x.object.id'],
            label = item['x.object.name'];
          _targetList.push({
            value,
            label,
            type: item['x.type.id'],
            disabled: Boolean(currentRelationMap[relation] && currentRelationMap[relation][value])
          });
          Object.assign(newTargetMap, { [value]: { ...item } });
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
  const handleChangeTarget = function (targetId: string, index: number) {
    const relation = form.getFieldValue(['relation', index, 'relation']);
    const prvRelationId = relations[index]['relation'],
      prvRelationTarget = relations[index]['target'];
    const sourceUid = props.source.id;
    const newRelationLines: ObjectRelationConig[] = JSON.parse(JSON.stringify(_.get(relationLines, sourceUid, [])));

    function createRelation() {
      const targetDetail: ObjectConfig = targetMap[targetId];
      Object.assign(newRelationLines[index], {
        'r.object.target.id': targetId,
        'r.object.target.name': targetDetail['x.object.name']
      });

      // 设置实例关系连线时，传递关系类型属性默认值
      const attrValue = {}
      _.get(relationMap[relation], 'r.type.attrs', []).forEach((attr: AttrConfig) => {
        const defalutValue = _.get(attr, 'default', null);
        Object.assign(attrValue, {
          [attr.name]: defalutValue
        });
      });

      setObjectRelation(graphData?.id, [{
        'r.type.id': relation,
        'r.object.source.id': props.source.id,
        'r.object.target.id': targetId,
        'r.object.attrvalue': attrValue
      }], (success: any, response: any) => {
        if (success) {
          setRelations(form.getFieldValue('relation'));
          const newRelationMap = JSON.parse(JSON.stringify(currentRelationMap));
          if (newRelationMap[relation]) {
            Object.assign(newRelationMap[relation], { [targetId]: targetId });
          } else {
            Object.assign(newRelationMap, { [relation]: { [targetId]: targetId } });
          }
          setCurrentRelationMap(newRelationMap);

          const relationData: ObjectRelationConig = newRelationLines[index];
          if (showRelationLine && relationData['r.type.id'] && relationData['r.object.target.id']) {
            const edgeId = `${sourceUid}-${relationData['r.object.target.id']}-${relationData['r.type.id']}`;
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

          const newLineData: ObjectRelationConig = {
            'r.type.id': form.getFieldValue(['relation', index, 'relation']),
            'r.object.target.id': targetId,
            'r.object.source.id': sourceUid,
            'r.object.target.name': targetMap[targetId]['x.object.name']
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

      handleDeleteRelation(index, prvRelationId, prvRelationTarget, () => {
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
              if (relationLines.findIndex((val: ObjectRelationConig, i: number) => val['r.object.source.id'] === currentBind.relation && val['r.object.target.id'] === currentBind.target && index !== i) > -1) {
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
          showSearch
          filterOption={(input, option: any) =>
          ((option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase()) ||
            (option?.value ?? '').toString() === input)
          }
          disabled={!isEditing}
          onChange={value => handleChangeRelation(value, index)}>
        </Select> :
        <Select
          options={targetList}
          showSearch
          filterOption={(input, option: any) =>
          ((option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase()) ||
            (option?.value ?? '').toString() === input)
          }
          disabled={!form.getFieldValue(['relation', index, 'relation']) || !isEditing}
          onFocus={() => handleGetRelationTarget(index)}
          onChange={(value) => handleChangeTarget(value, index)}>
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
          loading={tableLoading || props.loading}
          columns={columns}
          dataSource={relations}
          pagination={false}
        />
      </Form >
      {isEditing &&
        <Button
          type='dashed'
          onClick={() => handleAddRelation()}
          style={{ width: '100%', marginTop: '.8rem' }}
        >
          <i className='spicon icon-plus'></i>
        </Button>
      }
    </div>
  )
}