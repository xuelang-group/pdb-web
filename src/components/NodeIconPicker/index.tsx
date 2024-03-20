import { useCallback, useEffect, useState } from 'react';
import { Popover, Tabs, Tooltip } from 'antd';
import './index.less';
import _ from 'lodash';
import fonts from '@/assets/iconfont/pdb/iconfont-icon.json';
import CustomIconList from './CustomIconList';
import { useSelector } from 'react-redux';
import { StoreState } from '@/store';
import { getImagePath } from '@/actions/minioOperate';

export interface NodeIconPickerProps {
  changeIcon: Function
  currentIcon: string
}

export default function NodeIconPicker(props: NodeIconPickerProps) {
  const { currentIcon, changeIcon } = props;
  const userId = useSelector((state: StoreState) => state.app.systemInfo.userId);

  const [currentTab, setCurrentTab] = useState('default');
  const fontIcons = fonts.glyphs,
    fontIconsLen = fontIcons.length;
  const renderIconList = () => {
    return (
      <div className='pdb-iconpicker-list'>
        {fonts.glyphs.map((font, index) => {
          if (index === 0) {
            return (
              <Tooltip title="无图标">
                <div
                  className={'pdb-iconpicker-item pdb-iconpicker-unset first-row-item' +
                    ((index + 1) === fontIconsLen ? ' icon-last-item' : '') +
                    (!currentIcon ? ' selected' : '')
                  }
                  onClick={() => changeIcon('')}
                >
                  <i className={`iconfont icon-${font.font_class}`}></i>
                </div>
              </Tooltip>
            )
          }
          return (
            <div
              className={'pdb-iconpicker-item' + (index < 5 ? ' first-row-item' : '') +
                ((index + 1) % 5 === 0 ? ' row-last-item' : ((index + 1) === fontIconsLen ? ' icon-last-item' : '')) +
                (currentIcon === font.font_class ? ' selected' : '')
              }
              onClick={() => changeIcon(font.font_class)}
            >
              <i className={`iconfont icon-${font.font_class}`}></i>
              {/* <svg className="svg-icon" aria-hidden="true">
                <use xlinkHref={`#icon-${font.font_class}`}></use>
              </svg> */}
            </div>
          )
        })}
      </div>
    )
  }

  useEffect(() => {
    setCurrentTab(currentIcon.indexOf('studio/' + userId + '/pdb/icons/') > -1 ? 'custom' : 'default');
  }, [currentIcon]);

  const tabs = [{
    key: 'default',
    label: '默认',
    children: renderIconList()
  }, {
    key: 'custom',
    label: '自定义',
    children: (<CustomIconList changeIcon={changeIcon} currentIcon={currentIcon} />)
  }];

  return (
    <Popover
      content={(
        <div className='pdb-iconpicker'>
          <Tabs activeKey={currentTab} items={tabs} onChange={activeKey => setCurrentTab(activeKey)} />
        </div>
      )}
      placement='bottomRight'
      trigger='click'
      overlayClassName="pdb-iconpicker-popover"
    >
      <Tooltip title="图标">
        <div className='pdb-node-metadata-item node-icon'>
          {currentIcon.indexOf('studio/' + userId + '/pdb/icons/') > -1 ?
            <img src={getImagePath(currentIcon)} width='100%' height='100%' /> :
            <i className={`iconfont icon-${currentIcon || 'jinzhi-yuanxing no-icon'}`}></i>
          }
        </div>
      </Tooltip>
    </Popover>
  );
}