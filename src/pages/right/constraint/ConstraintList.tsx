import { useSelector, useDispatch } from 'react-redux';
import { Button, Dropdown, MenuProps, Form, Empty, InputNumber } from 'antd';
import { useEffect, useState } from 'react';
import _ from 'lodash';

import { StoreState } from '@/store';
import { ConstraintState, setGraphData } from '@/reducers/template';
import './index.less';

const constarintMap: any = {
  'maximum': {
    type: 'int',
    label: '数量上限',
    attr: {
      min: 1
    }
  }
}

export default function ConstraintList() {
  const [constraintForm] = Form.useForm();
  const dispatch = useDispatch();
  const graphData = useSelector((state: StoreState) => state.template.graphData),
    currentEditModel = useSelector((state: StoreState) => state.editor.currentEditModel);

  const [constraintList, setConstraintList] = useState([] as Array<ConstraintState>);

  useEffect(() => {
    const currentGraphData = JSON.parse(JSON.stringify(graphData));
    if (!currentEditModel || !currentEditModel.id || !currentGraphData.processes[currentEditModel.id]) return;
    const _currentConstraints = JSON.parse(JSON.stringify(currentGraphData.processes[currentEditModel.id].metadata['x.type.constraints'] || []));
    if (JSON.stringify(_currentConstraints) !== JSON.stringify(constraintList)) {
      setConstraintList(_currentConstraints);
    }
  }, [currentEditModel?.id]);

  useEffect(() => {
    const currentGraphData = JSON.parse(JSON.stringify(graphData));
    if (!currentEditModel || !currentEditModel.id || !currentGraphData.processes[currentEditModel.id]) return;
    const currentConstraints = JSON.parse(JSON.stringify(currentGraphData.processes[currentEditModel.id].metadata['x.type.constraints'] || []));
    if (JSON.stringify(currentConstraints) !== JSON.stringify(constraintList)) {
      Object.assign(currentGraphData.processes[currentEditModel.id].metadata, { 'x.type.constraints': constraintList });
      dispatch(setGraphData(currentGraphData));
    }
  }, [constraintList]);

  const items: MenuProps['items'] = Object.keys(constarintMap).map(key => ({ key, ...constarintMap[key] }));

  // 添加控件
  const addConstraint = (value: any) => {
    const _currentConstraints = JSON.parse(JSON.stringify(constraintList));
    const type = value.key;
    _currentConstraints.push({
      type,
      name: _.get(constarintMap, `${type}.label`)
    });
    setConstraintList(_currentConstraints);
  }

  // 删除控件
  const deleteConstraint = (index: number) => {
    const newConstraints = JSON.parse(JSON.stringify(constraintList));
    newConstraints.splice(index, 1);
    setConstraintList(newConstraints);
  }

  // 更改控件值
  const changeConstraintValue = _.debounce((value: any, index: number) => {
    if (constraintList[index] === undefined) return;
    const newConstraints = JSON.parse(JSON.stringify(constraintList));
    Object.assign(newConstraints[index], { value });
    setConstraintList(newConstraints);
  }, 500)

  const renderInput = (type: string, value: any, index: number) => {
    const constraintInfo = constarintMap[type];
    if (constraintInfo.type === 'int') {
      const { min, max } = constraintInfo.attr;
      return (
        <InputNumber value={value} precision={0} min={min !== undefined ? min : Infinity} max={max !== undefined ? max : Infinity} onChange={value => changeConstraintValue(value, index)} />
      )
    }
  }

  return (
    <div className='pdb-constraint'>
      <div className='pdb-constraint-btn'>
        <Dropdown menu={{ items, onClick: addConstraint }}>
          <Button className="btn-default" block icon={<i className='spicon icon-tianjia2'></i>}>
            添加控件
          </Button>
        </Dropdown>
      </div>
      <div className='type-items'>
        {constraintList && constraintList.length > 0 ?
          <Form form={constraintForm}>
            {constraintList.map((constraint, index) => (
              <div className={`type-item`}>
                <div className='type-title'>
                  <span className={'type-label'}>
                    <span>{constraint.name}</span>
                  </span>
                  <span className='operations'>
                    <i className="spicon icon-delete" onClick={() => deleteConstraint(index)}></i>
                  </span>
                </div>
                {renderInput(constraint.type, constraint.value, index)}
              </div>
            ))}
          </Form> :
          <Empty image={require('@/assets/images/search_empty.png')} />
        }
      </div>
    </div>
  )
}