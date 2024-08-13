import { Button, notification } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import _ from 'lodash';
import PdbPanel from '@/components/Panel';
import NodeIconPicker from '@/components/NodeIconPicker';
import NodeColorPicker from '@/components/NodeColorPicker';
import { StoreState } from '@/store';
import { defaultNodeColor, getBorderColor } from '@/utils/common';
import { setObject } from '@/actions/object';
import './index.less';
import { setSearchAround } from '@/reducers/editor';

export default function MultiModelParamEditor(props: any) {
  const dispatch = useDispatch();
  const multiEditModel = useSelector((state: StoreState) => state.editor.multiEditModel),
    searchAround = useSelector((state: StoreState) => state.editor.searchAround);

  const [currentEditModel, setCurrentEditModel] = useState<any>([]),
    [currentIcon, setCurrentIcon] = useState(''),
    [currentFillColor, setCurrentFillColor] = useState(''),
    [currentBorderColor, setCurrentBorderColor] = useState(''),
    [isSameType, setIsSameType] = useState(false);

  useEffect(() => {
    let prevIcon = '', prevColor = '', prevBorderColor = '',
      hasDiffIcon = false, hasDiffColor = false, hasDiffBorderColor = false;

    if (!multiEditModel) return;
    let isSameType = true;
    for (let i = 0; i < multiEditModel?.length; i++) {
      const { icon, color, borderColor } = JSON.parse(_.get(multiEditModel[i], 'data', {})['x_metadata'] || '{}');
      const currentColor = color || defaultNodeColor.fill,
        currentBorderColor = getBorderColor(borderColor, currentColor);
      if (i !== 0) {
        if (!hasDiffIcon) hasDiffIcon = icon !== prevIcon;
        if (!hasDiffColor) hasDiffColor = currentColor !== prevColor;
        if (!hasDiffBorderColor) hasDiffBorderColor = currentBorderColor !== prevBorderColor;
        if (isSameType) isSameType = multiEditModel[i]['data']['x.type.name'] === multiEditModel[i - 1]['data']['x.type.name'];
      }
      if (hasDiffIcon && hasDiffColor && hasDiffBorderColor) break;
      prevIcon = icon;
      prevColor = currentColor;
      prevBorderColor = currentBorderColor;
    }
    setIsSameType(isSameType);
    if (!hasDiffIcon) setCurrentIcon(prevIcon || '');
    if (!hasDiffColor) setCurrentFillColor(prevColor || '');
    if (!hasDiffColor && !hasDiffBorderColor) setCurrentBorderColor(getBorderColor(prevBorderColor, prevColor || ''));
    setCurrentEditModel(JSON.parse(JSON.stringify(multiEditModel)));
    return () => {
      setCurrentIcon('');
      setCurrentFillColor('');
      setCurrentBorderColor('');
    }
  }, [multiEditModel]);

  const changeNodeMetadata = function (type: string, value: string, isDefault = false) {
    console.log(type, value, isDefault)
    const shouldUpdateData: { uid: string; 'x_metadata': string; }[] = [];
    currentEditModel?.forEach((model: any) => {
      const data = _.get(model, 'data');
      if (data) {
        const _metadata = JSON.parse(data['x_metadata'] || '{}');
        if (currentIcon) Object.assign(_metadata)
        Object.assign(_metadata, {
          [type]: value
        });
        shouldUpdateData.push({
          uid: data.uid,
          'x_metadata': JSON.stringify(_metadata)
        });
        Object.assign(data, { 'x_metadata': JSON.stringify(_metadata) });
      }
    });
    setObject({ 'set': shouldUpdateData }, (success: boolean, response: any) => {
      if (success) {
        const graph = (window as any).PDB_GRAPH;
        shouldUpdateData.forEach(function (data) {
          const option = { data };
          if (type === 'icon') {
            Object.assign(option, { icon: value });
          } else if (currentIcon) {
            Object.assign(option, { icon: currentIcon });
          }
          graph?.updateItem(data.uid, option);
        });
        if (type === 'icon') {
          setCurrentIcon(value);
        } else if (type === 'color') {
          setCurrentFillColor(value);
        } else {
          setCurrentBorderColor(value);
        }
        setCurrentEditModel(currentEditModel);
      } else {
        notification.error({
          message: '更新实例失败',
          description: response.message || response.msg
        });
      }
    });
  }

  return (
    <PdbPanel title='通用属性'>
      <div className='pdb-node-common-item'>
        <div className='pdb-node-common-item-label'>节点图标：</div>
        <NodeIconPicker changeIcon={(icon: string) => changeNodeMetadata('icon', icon)} currentIcon={currentIcon} />
      </div>
      {!currentIcon &&
        <div className='pdb-node-common-item-warning'>
          <ExclamationCircleOutlined />
          <span>选中节点的图标不一致</span>
        </div>
      }
      <div className='pdb-node-common-item'>
        <div className='pdb-node-common-item-label'>节点填充颜色：</div>
        <NodeColorPicker
          type='fill'
          changeColor={(color: string) => changeNodeMetadata('color', color)}
          currentColor={currentFillColor}
        />
      </div>
      {!currentFillColor &&
        <div className='pdb-node-common-item-warning'>
          <ExclamationCircleOutlined />
          <span>选中节点的填充颜色不一致</span>
        </div>
      }
      <div className='pdb-node-common-item'>
        <div className='pdb-node-common-item-label'>节点边框颜色：</div>
        <NodeColorPicker
          type='border'
          fillColor={currentFillColor}
          changeColor={(color: string, isDefault?: boolean) => changeNodeMetadata('borderColor', color, isDefault)}
          currentColor={currentBorderColor}
        />
      </div>
      {!currentBorderColor && !currentFillColor &&
        <div className='pdb-node-common-item-warning'>
          <ExclamationCircleOutlined />
          <span>选中节点的边框颜色不一致</span>
        </div>
      }
      {isSameType &&
        <Button
          icon={<i className='spicon icon-sousuo2'></i>}
          style={{ margin: 12, cursor: 'pointer' }}
          onClick={() => {
            const _searchAround = JSON.parse(JSON.stringify(searchAround));
            _searchAround.show = true;
            const start: any[] = [];
            multiEditModel?.forEach(item => {
              start.push(item.data);
            });
            _searchAround.options.push({ start, options: [] });
            dispatch(setSearchAround(_searchAround));
          }}
        >节点探索</Button>
      }
    </PdbPanel>
  );
}