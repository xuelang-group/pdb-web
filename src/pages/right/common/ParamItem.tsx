import { memo } from 'react'
import { useDrag, useDrop } from 'react-dnd'

export const ParamItem = memo(function ParamItem({ index, attr, isActive, canOperate, canDrag, moveParam, deleteParam, editParam, children, findParam, inherit }: any) {
  const originalIndex = findParam(attr.name).index;
  const [{ isDragging }, connectDrag] = useDrag({
    type: 'param',
    item: { id: attr.name, originalIndex },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    end: (item, monitor) => {
      const { id: droppedId, originalIndex } = item;
      const didDrop = monitor.didDrop();
      if (!didDrop) {
        moveParam(droppedId, originalIndex);
      }
    },
  }, [attr.name, originalIndex, moveParam]);
  const [, connectDrop] = useDrop({
    accept: 'param',
    hover({ id: draggedId }: any) {
      if (draggedId !== attr.name) {
        const { index: overIndex } = findParam(attr.name);
        moveParam(draggedId, overIndex);
      }
    },
    drop: () => {
      moveParam(undefined, undefined);
    }
  }, [findParam, moveParam]);
  const opacity = isDragging ? 0 : 1;
  return (
    <div className={`type-item` + (isActive ? ' item-active' : '')} ref={node => canOperate && canDrag && connectDrag(connectDrop(node))} style={{ opacity }}>
      <div className='type-title'>
        <span className={'type-label' + (attr.required ? ' type-required' : '')}>
          {inherit && <i className='iconfont icon-duixiangleixing'></i>}
          {attr.override && <svg className='spicon' viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="74440" width="14" height="14"><path d="M650.348 165.539c4.63-3.649 11.504-0.4 11.684 5.454l0.004 0.236v68.75h169.982c8.718 0.032 15.794 7.017 15.978 15.697l0.004 0.318V640h-72.093V303.98H661.951v68.752c0 6.007-6.813 9.3-11.53 5.831l-0.187-0.142-127.465-100.809a7.14 7.14 0 0 1-0.215-11.119l0.215-0.173L650.348 165.54zM464.043 144H160.014c-8.826 0.015-15.983 7.16-16.014 15.987v304.026c0 8.79 7.225 15.987 16.014 15.987h304c8.79 0 15.986-7.196 15.986-16.015v-303.97c-0.016-8.734-7.007-15.829-15.7-16.011l-0.257-0.004zM412.02 411.987H212.065V212.014h199.956v199.973zM863.987 680c8.817 0 16.013 7.167 16.013 16.012v167.976h-0.028c0 8.817-7.14 16.012-15.985 16.012H696c-8.818 0-16.013-7.167-16.013-16.012V696.012c0-8.843 7.17-16.012 16.013-16.012h167.987z m-267.994 0c8.817 0 16.014 7.167 16.014 16.012v167.976c0 8.817-7.169 16.012-16.015 16.012H428.006c-8.817 0-16.014-7.167-16.014-16.012V696.012A15.984 15.984 0 0 1 428.006 680h167.987zM328 680c8.818 0 16.013 7.167 16.013 16.012v167.976c0 8.817-7.167 16.012-16.013 16.012H160.013c-8.817 0-16.013-7.167-16.013-16.012V696.012A15.984 15.984 0 0 1 160.013 680H328z m487.974 64.02h-71.962v71.958h71.962V744.02z m-267.965 0h-72.02v71.958h72.02V744.02z m-267.993 0h-72.018v71.958h72.018V744.02z" p-id="74441"></path></svg>}
          <span className='type-label-display'>{attr.display}</span>
          <span className='type-label-divider'> / </span>
          <span className='type-label-name'>{attr.name}</span>
        </span>
        {canOperate && !attr.override &&
          <span className='operations'>
            <i className="spicon icon-delete" onClick={() => deleteParam(attr.name, index)}></i>
            <i className="spicon icon-bianji" onClick={() => editParam({ ...attr, index })} ></i>
            {canDrag &&
              <i className="spicon icon-tuodong"></i>
            }
          </span>
        }
      </div>
      {children}
    </div>
  )
});
