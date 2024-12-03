import { useEffect, useState } from 'react';
import { ColorPicker, Divider, Popover, Tooltip } from 'antd';
import _ from 'lodash';
import { defaultNodeColor, getBorderColor, nodeColorList } from '@/utils/common';
import './index.less';

interface NodeColorPickerProps {
  type: string
  currentColor: string
  changeColor: Function
  fillColor?: string
  disabled?: boolean
}

const colorMap: any = {
  fill: {
    text: '填充'
  },
  border: {
    text: '描边'
  }
}

export default function NodeColorPicker(props: NodeColorPickerProps) {
  const { type, currentColor, changeColor, fillColor, disabled } = props;
  const [selectedColor, setSelectedColor] = useState(currentColor),
    [colorList, setColorList] = useState([] as any),
    [isCustomColor, setIsCustomColor] = useState(false);

  useEffect(() => {
    if (type === 'fill') {
      setSelectedColor(currentColor);
      setColorList(Object.keys(nodeColorList));
      setIsCustomColor(defaultNodeColor.fill === currentColor);
    } else {
      setSelectedColor(getBorderColor(currentColor, fillColor));
      setColorList(Object.values(nodeColorList));
      setIsCustomColor(!Boolean(currentColor));
    }
  }, [currentColor, type, fillColor]);

  const selectDefaultColor = function() {
    if (type === 'fill') {
      changeColor(defaultNodeColor.fill);
    } else {
      changeColor(getBorderColor(undefined, fillColor));
    }
    setIsCustomColor(true);
  }

  const renderColorPicker = () => {
    return (
      <div className='pdb-color-picker'>
        <div className={'pdb-color-default' + (isCustomColor ? ' selected' : '')} onClick={selectDefaultColor}>
          <div className='pdb-color-item' style={{ backgroundColor: type === 'fill' ? defaultNodeColor.fill : getBorderColor(undefined, fillColor) }}></div>
          <span>{type === 'fill' ? '默认' : '自动匹配边框颜色'}</span>
          {isCustomColor && <i className='spicon icon-xuanzhong1'></i>}
        </div>
        <div className='pdb-color-list'>
          {
            colorList.map((color: string) => {
              return (
                <div className='pdb-color-item' style={{ backgroundColor: color }} onClick={() => changeColor(color)}>
                  {(selectedColor === color && (type === 'fill' || currentColor)) && <i className='spicon icon-xuanzhong1'></i>}
                </div>
              )
            })
          }
        </div>
        {/* {!isSelectedDefault &&
          <div className='pdb-color-custom'>
            <span>使用的自定义颜色</span>
            <div className='pdb-color-item' style={{ backgroundColor: selectedColor }}></div>
          </div>
        } */}
        <Divider />
        <div className='pdb-color-custom-picker'>
          <ColorPicker
            rootClassName='pdb-color-picker-popup'
            value={selectedColor} 
            onChangeComplete={(color) => changeColor(color.toRgbString())} 
            format='rgb'
            trigger='hover' 
          >
            <div className='pdb-color-item' style={{ backgroundColor: selectedColor }}></div>
            <span>自定义颜色</span>
            <i className='spicon icon-jiantou-you1'></i>
          </ColorPicker>
        </div>
      </div>
    )
  }

  if (disabled) {
    return (
      <Tooltip title={colorMap[type].text}>
        <div className='pdb-node-metadata-item node-color' >
          <div style={{ backgroundColor: selectedColor, width: '100%', height: '100%' }}></div>
        </div>
      </Tooltip>
    );
  }
  
  return (
    <Popover
      content={renderColorPicker}
      placement='bottomRight'
      trigger='click'
      overlayClassName="pdb-color-picker-popover"
    >
      <Tooltip title={colorMap[type].text}>
        <div className='pdb-node-metadata-item node-color' >
          <div style={{ backgroundColor: selectedColor, width: '100%', height: '100%' }}></div>
        </div>
      </Tooltip>
    </Popover>
  );
}