import { Tooltip } from "antd";
import _ from "lodash";
import { ReactNode, useEffect, useImperativeHandle, useRef, useState } from "react";
import './index.less'
interface PanelProps {
  title?: string // 面板标题
  className?: string
  children: ReactNode // 面板自定义内容
  external?: ReactNode
  direction?: string
  canCollapsed?: boolean
  onRef?: any
}

export default function PdbPanel({ title, children, external, direction, canCollapsed, ...other }: PanelProps) {
  const [siderHidden, _setSiderHidden] = useState(false);
  const siderHiddenRef = useRef(siderHidden);
  const setSiderHidden = function (value: boolean) {
    siderHiddenRef.current = value;
    _setSiderHidden(value);
  }
  const platform = _.get(window.navigator, 'platform').indexOf('Mac') > -1 ? 'mac' : 'win';
  const altKey = platform === 'win' ? 'Alt' : '⌥';

  useImperativeHandle(other.onRef, () => {
    return {
      setSiderHidden: () => setSiderHidden(!siderHidden)
    }
  });

  useEffect(() => {
    if (canCollapsed) {
      document.addEventListener('keydown', onKeydownCollapsed, { passive: true })
    }
    return () => {
      if (canCollapsed) {
        document.removeEventListener('keydown', onKeydownCollapsed)
      }
    }
  }, []);


  const onKeydownCollapsed = function (event: any) {
    // 控制面板展开/收缩 Alt + [ / ]
    // console.log(event.altKey && event.keyCode === 219 && direction === 'left', siderHidden)
    if (event.altKey && (
      (event.keyCode === 219 && direction === 'left') ||
      (event.keyCode === 221 && direction === 'right')
    )) {
      setSiderHidden(!siderHiddenRef.current);
    }
  }

  return (
    <div className={`pdb-content-sider pdb-${direction}-sider ${siderHidden ? `pdb-${direction}-sider-hidden ` : ''} ` + (other.className || '')}>
      {title &&
        <div className='pdb-sider-header'>
          <h5>{title}</h5>
          {external}
        </div>
      }
      <div className='pdb-sider-content'>
        {children}
      </div>
      {canCollapsed &&
        <Tooltip
          title={(siderHidden ? '展开 ' : '折叠 ') + altKey + ` + ${direction === 'left' ? '[' : ']'}`}
          placement={direction === 'left' ? 'right' : 'left'}
        >
          <button className="btn-aside-toggle" onClick={() => setSiderHidden(!siderHidden)}>
            <i className={`spicon icon-shuangjiantou-${direction === 'left' ? 'zuo' : 'you'}`}></i>
          </button>
        </Tooltip>
      }
    </div>
  );
}