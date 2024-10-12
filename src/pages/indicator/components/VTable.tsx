import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef, useState } from 'react'
import { message } from "antd";
import { ListTable } from '@visactor/react-vtable'
import { TYPES, CustomLayout } from '@visactor/vtable'
import { getColumns } from './CONSTS'
import { StoreState } from "@/store";
import { getFuncResult } from "@/actions/indicator";

export default function VTable() {
  const dispatch = useDispatch()

  const vtable = useRef<any>(null);
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(1000)
  const [height, setHeight] = useState(500)
  const query = useSelector((state: StoreState) => state.query.params);
  const records = useSelector((state: StoreState) => state.indicator.records);
  const columns = useSelector((state: StoreState) => state.indicator.columns);
  const dimention = useSelector((state: StoreState) => state.indicator.dimention);
  const groupBy = useSelector((state: StoreState) => state.indicator.groupBy);
  const mergeCell = useSelector((state: StoreState) => state.indicator.mergeCell);
  const func = useSelector((state: StoreState) => state.indicator.func);

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
    customMergeCell: (col: any, row: any, table: any) => {
      if (mergeCell.row.includes(row)) {
        const item = records[row-1];
        if (col >= item.merge-1 && col < table.colCount) {
          const key = groupBy[item.merge-1];
          const name = item[key];
          return {
            text: '小计',
            range: {
              start: {
                col: item.merge - 1,
                row: row
              },
              end: {
                col: table.colCount - 1,
                row: row
              }
            },
            style: {
              fontWeight: 600,
              // textAlign: 'right',
            },
            customLayout: (args: any) => {
              const { width, height } = args.rect;
              const container = new CustomLayout.Group({
                height,
                width: width,
                display: 'flex',
                flexWrap: 'nowrap',
                alignItems: 'center',
                justifyContent: 'flex-end',
              });
              const text = new CustomLayout.Text({
                x: width - 15,
                y: height / 2 + 1,
                text: '小计 | ' + name + ' - ' + func + ': ' + item[`${dimention}_${func}`],
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'PingFang SC',
                fill: '#1C2126',
                textBaseline: 'middle',
                boundsPadding: [0, 15]
              });
              container.add(text)
              return {
                rootContainer: container,
                renderDefault: false,
              }
            }
          };
        }
      }
    },
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
      vtable.current.updateColumns(getColumns(columns))
      vtable.current.setRecords(records)
      // vtable.current.rightFrozenColCount = dimention ? 1 : 0
      // vtable.current.updateOption({
      //   ...option,
      //   columns: getColumns(columns),
      //   records: records,
      //   // rightFrozenColCount: dimention ? 1 : 0,
      // });
      const colCount = columns.length - 1;
      const rowCount = records.length;
      vtable.current.clearSelected();
      vtable.current.selectCells([{ start: { col: colCount, row: 0 }, end: { col: colCount, row: rowCount } }]);
    }

  }, [columns, dimention])

  useEffect(() => {
    func && getFuncResult({dimention, func, groupBy, query}, function(success: boolean, response: any) {
      if (success) {
        // dispatch(setFuncResult(response));
      } else {
        message.error('获取列表数据失败：' + response.message || response.msg);
      }
    })
  }, [func])

  return (
    <div className='pdb-vtable' style={{ position: 'relative', paddingBottom: func ? 48 : 0 }}>
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
      <div className='pdb-vtable-footer' style={{ position: 'absolute', height: func ? 48 : 0 }}>
        合计 | {func} : 
      </div>
    </div>
  )
}