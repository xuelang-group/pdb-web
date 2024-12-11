import { Button, Form, message, notification, Select, Table } from 'antd';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { deleteObjectRelation, getRelationTarget, createObjectRelation, getObjects } from '@/actions/object';
import { lineXaxisMap, updateLineXaxisMap, updateXaxisMap, xaxisMap } from '@/g6/edge';
import { NodeItemData, ObjectRelationConig, setToolbarConfig } from '@/reducers/editor';
import { StoreState } from '@/store';
import './index.less';
import { AttrConfig } from '@/reducers/type';
import { ObjectConfig } from '@/reducers/object';

interface RelationListProps {
  source: NodeItemData
  loading?: boolean
}

export default function RelationList(props: RelationListProps) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const relationMap = useSelector((store: StoreState) => store.editor.relationMap),
    typeRelationMap: any = useSelector((store: StoreState) => store.editor.typeRelationMap),
    { relationLines, showRelationLine } = useSelector((store: StoreState) => store.editor.toolbarConfig.main),
    currentEditModel = useSelector((state: StoreState) => state.editor.currentEditModel),
    isEditing = useSelector((state: StoreState) => state.editor.isEditing);

  const [relations, setRelations] = useState([]),
    [currentRelationMap, setCurrentRelationMap] = useState({} as any),
    [relationConstrarintMap, setRelationConstrarintMap] = useState({} as any);

  const [relationList, setRelationList] = useState([]); // 对象对应类型配置的关系
  const [targetList, setTargetList] = useState([]);
  const [targetMap, setTargetMap] = useState({} as any)

  const [tableLoading, setTableLoading] = useState(false);

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
      getObjects(Object.keys(noLabelObject), (success: boolean, response: any) => {
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
    currentEditModel && updateRelationList(_.get(currentEditModel.data, 'x_type_name'));
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
  const handleDeleteRelation = function (index: number, deleteId: any = null, deleteItem: any = null, callback?: any) {
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
    const sourceUid = props.source.id;
    const relationId = deleteId || _relations[index].relationId || _relations[index].relation;
    const deleteItemConfig = deleteItem || { uid: _relations[index].target };
    deleteObjectRelation([{
      vid: sourceUid,
      [relationId]: [{
        vid: deleteItemConfig.uid
      }]
    }], (success: boolean, response: any) => {
      if (success) {
        const deletTarget = form.getFieldValue(['relation', index, 'target']);
        if (deletTarget && currentRelationMap[relationId] && currentRelationMap[relationId][deletTarget]) {
          delete currentRelationMap[relationId][deletTarget];
        }

        const newRelationLines = JSON.parse(JSON.stringify(_.get(relationLines, sourceUid, [])));
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
        const _targetList: any = [], newTargetMap = { ...targetMap };
        response.forEach((item: any) => {
          const infoIndex = _.get(item, 'tags', []).findIndex((val: any) => val.name === 'v_node');
          const value = item['vid'].toString(),
            defaultInfo = _.get(item.tags[infoIndex], 'props', {}),
            label = _.get(defaultInfo, 'x_name', '');
          _targetList.push({
            value,
            label,
            type: _.get(defaultInfo, 'x_type_name', ''),
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
  const handleChangeTarget = function (uid: string, option: any, index: number) {
    const relation = form.getFieldValue(['relation', index, 'relation']);
    const prvRelationId = relations[index]['relation'],
      prvRelationTarget = relations[index]['target'];
    const sourceUid = props.source.id;
    const newRelationLines: ObjectRelationConig[] = JSON.parse(JSON.stringify(_.get(relationLines, sourceUid, [])));

    function createRelation() {
      const targetDetail = targetMap[uid];
      if (relationConstrarintMap[relation]) {
        const relationConstrarint = relationConstrarintMap[relation];
        const tgtLabel = option.label,
          tgtType = option.type;
        const srcLabel = props.source.data['x.object.name'],
          srcType = props.source.data['x.type.id'];
        const maxTgt = relationConstrarint[srcType + '-' + tgtType] || Infinity;
        let currentNum = Object.keys(currentRelationMap[relation] || {}).filter(val => _.get(targetMap[val], 'x_type_name') === tgtType).length;
        if (_.get(targetMap[prvRelationTarget], 'x_type_name') === tgtType) {
          currentNum -= 1;
        }
        if (maxTgt <= currentNum) {
          message.warning(`从 “${srcLabel}” 对象类型到 “${tgtLabel}” 对象类型的 “${relationMap[relation]['r.type.name']}” 关系达到上限，最高上限为${currentNum}`);
          form.setFieldValue(['relation', index, 'target'], '');
          return;
        }
      }

      const targetOption = {
        uid,
        'x_name': targetDetail['x_name']
      };
      Object.assign(newRelationLines[index], {
        'r.object.target.id': uid,
        'r.object.target.name': targetDetail['x_name']
      });

      // 设置实例关系连线时，传递关系类型属性默认值
      _.get(relationMap[relation], 'r.type.attrs', []).forEach((attr: AttrConfig) => {
        const defalutValue = _.get(attr, 'default');
        if (defalutValue || defalutValue === 0) {
          Object.assign(targetOption, {
            [`${relation}|${attr.name}`]: defalutValue
          });
        }
      });

      createObjectRelation([{
        vid: props.source.id,
        [relation]: [{
          'vid': targetOption['uid'],
          'x_name': targetOption['x_name']
        }]
      }], (success: any, response: any) => {
        if (success) {
          setRelations(form.getFieldValue('relation'));
          const newRelationMap = JSON.parse(JSON.stringify(currentRelationMap));
          if (newRelationMap[relation]) {
            Object.assign(newRelationMap[relation], { [uid]: uid });
          } else {
            Object.assign(newRelationMap, { [relation]: { [uid]: uid } });
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
            'r.object.target.id': uid,
            'r.object.source.id': sourceUid,
            'r.object.target.name': targetMap[uid]['x_name']
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

      handleDeleteRelation(index, prvRelationId, { uid: prvRelationTarget }, () => {
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