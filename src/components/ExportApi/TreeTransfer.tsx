import React, { useEffect, useRef, useState } from 'react';
import { Input, Table, theme, Transfer, Tree } from 'antd';
import type { GetProp, TransferProps, TreeDataNode } from 'antd';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import _ from 'lodash';

type TransferItem = GetProp<TransferProps, 'dataSource'>[number];

export interface TreeTransferProps {
  dataSource: TreeDataNode[];
  targetKeys: TransferProps['targetKeys'];
  onChange: TransferProps['onChange'];
  colDisplayMap: any;
  onChangeDisplay: Function
}

// Customize Table Transfer
const isChecked = (selectedKeys: React.Key[], eventKey: React.Key) =>
  selectedKeys.includes(eventKey);

const generateTree = (
  treeNodes: TreeDataNode[] = [],
  checkedKeys: TreeTransferProps['targetKeys'] = [],
): TreeDataNode[] =>
  treeNodes.map(({ children, ...props }) => ({
    ...props,

    disabled: checkedKeys.includes(props.key as string),
    children: generateTree(children, checkedKeys),
  }));


interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  'data-row-key': string;
}

const Row = ({ children, ...props }: RowProps) => {
  const trRef = useRef<HTMLTableRowElement | null>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging, setActivatorNodeRef } = useSortable({
    id: props['data-row-key'],
  });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    // cursor: 'move',
    ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
  };

  useEffect(() => {
    trRef.current!.closest('table')!.style.overflow = isDragging ? 'hidden' : '';
  }, [isDragging]);

  return (
    <tr
      {...props}
      ref={(ref) => {
        trRef.current = ref;
        setNodeRef(ref);
      }}
      style={style}
      {...attributes}
    >
      {React.Children.map(children, (child) => {
        if ((child as React.ReactElement).key === 'operation') {
          return React.cloneElement(child as React.ReactElement, {
            children: (<i className='spicon icon-shanchu2' style={{ cursor: 'cursor' }}></i>),
          });
        } else if ((child as React.ReactElement).key === 'sort') {
          return React.cloneElement(child as React.ReactElement, {
            children: (<i ref={setActivatorNodeRef} className='spicon icon-tuodong' style={{ cursor: 'move' }} {...listeners}></i>),
          });
        } else if ((child as React.ReactElement).key === 'display') {
          return React.cloneElement(child as React.ReactElement, {
            children: (<Input />),
          });
        } 
        return child;
      })}
    </tr>);
};

export const TreeTransfer: React.FC<TreeTransferProps> = ({
  dataSource,
  targetKeys = [],
  colDisplayMap,
  ...restProps
}) => {
  const { token } = theme.useToken();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    }),
  );
  const transferDataSource: TransferItem[] = [];
  function flatten(list: TreeDataNode[] = []) {
    list.forEach((item) => {
      transferDataSource.push(item as TransferItem);
      flatten(item.children);
    });
  }
  flatten(dataSource);

  return (
    <Transfer
      {...restProps}
      oneWay
      targetKeys={targetKeys}
      dataSource={transferDataSource}
      className="tree-transfer"
      render={(item) => item.title!}
      showSelectAll={false}
      listStyle={{
        height: 300
      }}
    >
      {({ direction, onItemSelect, selectedKeys, onItemSelectAll, filteredItems }) => {
        if (direction === 'left') {
          const checkedKeys = [...selectedKeys, ...targetKeys];
          return (
            <div style={{ padding: token.paddingXS }}>
              <Tree
                blockNode
                checkable
                checkStrictly
                defaultExpandAll
                checkedKeys={checkedKeys}
                treeData={generateTree(dataSource, targetKeys)}
                onCheck={(_, { node: { key } }) => {
                  onItemSelect(key as string, !isChecked(checkedKeys, key));
                }}
                onSelect={(_, { node: { key } }) => {
                  onItemSelect(key as string, !isChecked(checkedKeys, key));
                }}
              />
            </div>
          );
        } else {
          const onDragEnd = ({ active, over }: DragEndEvent) => {
            if (active.id !== over?.id) {
              const activeIndex = targetKeys.findIndex((key: string) => key === active.id);
              const overIndex = targetKeys.findIndex((key: string) => key === over?.id);
              const data: string[] = arrayMove(targetKeys, activeIndex, overIndex);
              restProps.onChange && restProps.onChange(data, "right", []);
            }
          };
          return (
            <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
              <SortableContext
                items={targetKeys}
                strategy={verticalListSortingStrategy}
              >
                <Table
                  components={{
                    body: {
                      row: Row,
                    },
                  }}
                  rowKey="key"
                  columns={[{
                    key: 'sort',
                    width: 40
                  }, {
                    dataIndex: 'attrTitle',
                    title: '属性',
                  }, {
                    dataIndex: 'typeLabel',
                    title: '所属类型',
                  }, {
                    title: '显示名称',
                    dataIndex: 'display',
                    key: 'display',
                    width: 100
                  }, {
                    key: 'operation',
                    title: '操作',
                    width: 60
                  }]}
                  dataSource={targetKeys.map((key, index) => {
                    const data = key.split("|");
                    return {
                      key,
                      attrTitle: data[3],
                      typeLabel: data[1],
                      display: colDisplayMap[key]
                    }
                  })}
                  size="small"
                  rowClassName={() => 'editable-row'}
                  onRow={({ key, disabled: itemDisabled }: any) => ({
                    onClick: (event) => {
                      console.log(key, event)
                      if (_.get(event, "target.className") === "spicon icon-shanchu2") {
                        restProps.onChange && restProps.onChange(targetKeys.filter(id => id !== key), "right", [])
                      }
                      // if (itemDisabled || listDisabled) return;
                      // onItemSelect(key as string, true);
                    },
                  })}
                  pagination={false}
                />
              </SortableContext>
            </DndContext>

          )
        }
      }}
    </Transfer>
  );
};