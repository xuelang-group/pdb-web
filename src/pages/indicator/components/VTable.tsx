import { useDispatch, useSelector } from "react-redux";
import { ListTable } from '@visactor/react-vtable'
import { TYPES, CustomLayout } from '@visactor/vtable'
import { useEffect, useRef, useState } from 'react'
import { getColumns } from './CONSTS'
import { StoreState } from "@/store";
import { findLastIndex, isEmpty, lastIndexOf } from "lodash";

export default function VTable() {

  const vtable = useRef<any>(null);
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(1000)
  const [height, setHeight] = useState(500)
  const records = useSelector((state: StoreState) => state.indicator.records);
  const columns = useSelector((state: StoreState) => state.indicator.columns);
  const dimention = useSelector((state: StoreState) => state.indicator.dimention);
  const groupBy = useSelector((state: StoreState) => state.indicator.groupBy);
  const func = useSelector((state: StoreState) => state.indicator.func);
  const funcResults = useSelector((state: StoreState) => state.indicator.funcResults);

  const option = {
    autoFillWidth: true,
    autoWrapText: true,
    // rightFrozenColCount: 1,
    defaultRowHeight: 46,
    defaultColWidth: 150,
    defaultHeaderRowHeight: 92,
    theme: {
      // 冻结列效果
      frozenColumnLine: {
        shadow: {
          width: 10,
          startColor: 'rgba(0, 29, 77, 0.12)',
          endColor: 'rgba(0, 29, 77, 0)'
        }
      },
      defaultStyle: {
        color: '#4C5A67',
        fontSize: 14,
        borderColor: '#DCDEE1',
        padding: [8, 15],
        autoWrapText: true,
        select: {
          inlineRowBgColor: '#F1F8FF',
          inlineColumnBgColor: '#F1F8FF'
        }
      },
      headerStyle: {
        color: '#1C2126',
        bgColor: '#F9FBFC',
        fontWeight: 600,
      },
      groupTitleStyle: {
        color: '#1C2126',
        fontWeight: 500,
        borderColor: '#DCDEE1',
        bgColor: '#fafafa'
      },
      scrollStyle: {
        scrollSliderColor: 'rgba(0,0,0,0.2)',
      },
      selectionStyle: {
        cellBgColor: 'rgba(139, 211, 255, 0.1)',
        cellBorderColor: '#8BD3FF',
        cellBorderLineWidth: 1,
      },
    },
    records: records,
    columns: getColumns(columns),
    // customMergeCell: (col: any, row: any, table: any) => {
    //   // console.log('table: ', table)
    //   if (col >= 0 && row == 6) {
    //     return {
    //       text: 'merge text',
    //       range: {
    //         start: {
    //           col: 0,
    //           row: 6
    //         },
    //         end: {
    //           col: table.colCount - 1,
    //           row: 6
    //         }
    //       },
    //     };
    //   }
    // },
    // groupTitleCustomLayout: (args: TYPES.CustomRenderFunctionArg) => {
    //   const { table, row, col, rect } = args;
    //   const record = table.getCellOriginRecord(col, row);
    //   const { height, width } = rect ?? table.getCellRect(col, row);
    //   const container = new CustomLayout.Group({
    //     height,
    //     width,
    //     display: 'flex',
    //     flexDirection: 'row',
    //     flexWrap: 'nowrap',
    //     alignItems: 'center',
    //     justifyContent: 'flex-end',
    //   });
    //   // const count = record.children.map((item: any) => item[dimention]).reduce((prev: any, curr: any) => prev + curr)
    //   const info = new CustomLayout.Text({
    //     text: `小计 | avgs`,
    //     fontSize: 14,
    //     // fontWeight: 600,
    //     textAlign: 'right',
    //     marginRight: 16
    //   });
    //   container.add(info);
    //   return {
    //     rootContainer: container,
    //     renderDefault: true
    //   };
    // },
  }

  const onReady = (tableInstance: any, isFirst: Boolean) => {
    if (isFirst) {
      vtable.current = tableInstance
    }
    // const { rowCount, colCount } = tableInstance
    // console.log('has ready：', rowCount, colCount)
    // tableInstance.clearSelected();
    // 默认选中最后一列
    // tableInstance.selectCells([{ start: { col: colCount, row: 0 }, end: { col: colCount, row: rowCount } }]);
    // 点击禁用
    // tableInstance.on('dropdown_menu_click', (args: any) => {
    //   if (args.menuKey === 'disabled') {
    //     // tableInstance.setDropDownMenuHighlight([args]);
    //     const { col } = args;
    //     columns[col].disabled = !columns[col].disabled;
    //     tableInstance.updateColumns(getColumns(columns))
    //   }
    // });
    // // 表头右键菜单
    // tableInstance.on('contextmenu_cell', (args: any) => {
    //   const { col, row } = args;
    //   // if(row == 0 && !columns[col].disabled) {
    //   if(row == 0) {
    //     tableInstance.showDropDownMenu(col, row, {
    //       content: [{
    //         text: columns[col].disabled ? '启用' : '禁用',
    //         menuKey: 'disabled',
    //       }],
    //     })
    //   }
    // })
  }

  const onDropdownMenuClick = (args: any) => {
    if (args.menuKey === 'disabled') {
      // tableInstance.setDropDownMenuHighlight([args]);
      const { col } = args;
      columns[col].disabled = !columns[col].disabled;
      vtable.current?.updateColumns(getColumns(columns))
    }
  }

  const onContextMenuCell = (args: any) => {
    const { col, row } = args;
    if(row == 0) {
      vtable.current?.showDropDownMenu(col, row, {
        content: [{
          text: columns[col].disabled ? '启用' : '禁用',
          menuKey: 'disabled',
        }],
      })
    }
  }

  const updateSize = () => {
    const wrapper: any = wrapRef.current;
    // console.log(wrapper.offsetWidth, wrapper.offsetHeight)
    if (!wrapper || !wrapper.offsetWidth || !wrapper.offsetHeight) return
    setWidth(wrapper.offsetWidth)
    setHeight(wrapper.offsetHeight)
  }

  useEffect(() => {
    updateSize();
    window.addEventListener('resize', updateSize)
    return () => {
      window.removeEventListener('resize', updateSize)
    }
  }, [])

  useEffect(() => {
    if (vtable.current) {
      // vtable.updateColumns(getColumns(columns))
      // vtable.setRecords(records)
      // vtable.rightFrozenColCount = dimention ? 1 : 0
      vtable.current.updateOption({
        ...option,
        columns: getColumns(columns),
        records: records,
        rightFrozenColCount: dimention ? 1 : 0,
      });
      const colCount = columns.length - 1;
      const rowCount = records.length;
      vtable.current.clearSelected();
      vtable.current.selectCells([{ start: { col: colCount, row: 0 }, end: { col: colCount, row: rowCount } }]);
    }

  }, [columns, dimention, func])

  // useEffect(() => {
  //   if (vtable.current && !isEmpty(funcResults)) {
  //   }
  // }, [funcResults])

  return (
    <div className='pdb-vtable' style={{ position: 'relative', paddingBottom: 48 }}>
      <div ref={wrapRef} style={{ height: '100%' }}>
        <ListTable
          width={width}
          height={height}
          option={option}
          onReady={onReady}
          onDropdownMenuClick={onDropdownMenuClick}
          onContextMenuCell={onContextMenuCell}
        />
      </div>
      <div className='pdb-vtable-footer' style={{ position: 'absolute', height: 48 }}>

      </div>
    </div>
  )
}