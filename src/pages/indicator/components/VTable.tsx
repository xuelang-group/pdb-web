import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef } from 'react'
import { message, Space, Empty, Typography } from "antd";
import { ListTable } from '@visactor/react-vtable'
import { CustomLayout } from '@visactor/vtable'
import { IOption } from "@visactor/react-vtable/es/tables/base-table";
import { isEmpty, compact } from "lodash"
import { getColumns } from './CONSTS'
import { StoreState } from "@/store";
import { setLoading, setTableData, updateDisabledField, setFuncResult } from "@/reducers/indicator";
import { getCsv, getFuncResult } from "@/actions/indicator";
import EmptyImage from "@/assets/images/vtable_empty.svg";
import { getImgHref } from "@/actions/minioOperate";

export default function VTable(props: {width: number, height: number}) {
  const {width, height} = props

  const dispatch = useDispatch()

  const vtable = useRef<any>(null);

  const query = useSelector((state: StoreState) => state.query.params);
  const records = useSelector((state: StoreState) => state.indicator.records);
  const columns = useSelector((state: StoreState) => state.indicator.columns);
  const dimention = useSelector((state: StoreState) => state.indicator.dimention);
  const groupBy = useSelector((state: StoreState) => state.indicator.groupBy);
  const mergeCell = useSelector((state: StoreState) => state.indicator.mergeCell);
  const func = useSelector((state: StoreState) => state.indicator.func);
  const result = useSelector((state: StoreState) => state.indicator.result);

  const option: IOption = {
    widthMode: 'autoWidth',
    autoFillWidth: true,
    autoWrapText: true,
    defaultRowHeight: 46,
    defaultColWidth: 165,
    defaultHeaderRowHeight: 92,
    rightFrozenColCount: 1,
    // frozenColCount: groupBy.length,
    select: {
      disableSelect: true,
      blankAreaClickDeselect: false,
      outsideClickDeselect: false,
    },
    hover: {
      highlightMode: 'cross'
    },
    theme: {
      underlayBackgroundColor: 'transparent',
      // 冻结列效果
      frozenColumnLine: {
        shadow: {
          width: 10,
          startColor: 'rgba(0, 29, 77, 0.12)',
          endColor: 'rgba(0, 29, 77, 0)'
        }
      },
      frameStyle: {
        borderColor: '#DCDEE1',
        borderLineWidth: 0,
        cornerRadius: 0,
      },
      defaultStyle: {
        color: '#4C5A67',
        fontSize: 14,
        borderColor: '#DCDEE1',
        padding: [8, 15],
        autoWrapText: true,
        hover:{
          // cellBgColor: '#F1F8FF',
          cellBgColor: 'rgba(0,0,0,0.02)',
          inlineRowBgColor: 'rgba(0,0,0,0.02)',
          inlineColumnBgColor: 'rgba(0,0,0,0.02)',
        },
        select: {
          inlineRowBgColor: '#F1F8FF',
          inlineColumnBgColor: '#F1F8FF'
        }
      },
      // bodyStyle: {
      // },
      headerStyle: {
        color: '#1C2126',
        // bgColor: '#F9FBFC',
        fontWeight: 600,
      },
      groupTitleStyle: {
        color: '#1C2126',
        fontWeight: 500,
        borderColor: '#DCDEE1',
        bgColor: '#fafafa'
      },
      scrollStyle: {
        visible: 'always',
        scrollSliderColor: 'rgba(0,0,0,0.2)',
        scrollRailColor: 'rgba(0,0,0,0)',
        // barToSide: true,
      },
      selectionStyle: {
        cellBgColor: 'rgba(139, 211, 255, 0.1)',
        cellBorderColor: '#8BD3FF',
        cellBorderLineWidth: 1,
      },
    },
    // records: records,
    columns: getColumns(columns),
    customMergeCell: (col: any, row: any, table: any) => {
      if (!isEmpty(mergeCell.row) && mergeCell.row.includes(row)) {
        const item = records[row-1];
        if (col >= item.merge-1 && col < table.colCount) {
          const key = groupBy[item.merge-1];
          const name = item[key];
          const colWidth = table.getColWidth(columns.length-1)
          return {
            text: '小计 |',
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
              fontSize: 12,
              color: '#1C2126',
              bgColor: '#F9FBFC'
            },
            customLayout: (args: any) => {
              const { width, height } = args.rect;
              const container = new CustomLayout.Group({
                height,
                width: width,
              });
              const text = new CustomLayout.Text({
                x: width - colWidth + 14,
                y: height / 2 + 1,
                text: func + ": " + item[`${dimention}`],
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'PingFang SC',
                fill: '#1C2126',
                textBaseline: 'middle',
              });
              const fieldName = new CustomLayout.Text({
                x: 54,
                y: height / 2 + 1,
                text: name,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'PingFang SC',
                fill: '#1C2126',
                textBaseline: 'middle',
              })
              container.add(fieldName)
              container.add(text)
              return {
                rootContainer: container,
                renderDefault: true,
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
    // console.log('on ready ', isFirst)
    if (isFirst) {
      vtable.current = tableInstance
    }
  }

  const onDropdownMenuClick = (args: any) => {
    if (args.menuKey === 'disabled') {
      // tableInstance.setDropDownMenuHighlight([args]);
      const { col } = args;
      dispatch(updateDisabledField({col, value: !columns[col].disabled}))
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

  const onClickCell = (args: any) => {
    const { col, row } = args;
    console.log('click cell: ', col, row)
    // if (!isEmpty(columns)) {
    //   const colCount = columns.length - 1;
    //   const rowCount = records.length;
    //   vtable.current.selectCells([{ start: { col: colCount, row: 0 }, end: { col: colCount, row: rowCount } }]);
    // }
  }

  useEffect(() => {
    if (query.graphId) {
      dispatch(setLoading(true));
      getCsv(query, function (success: boolean, response: any) {
      if (success) {
        dispatch(setLoading(false));
        dispatch(setTableData(response.trim()));
      } else {
        message.error('获取列表数据失败：' + response.message || response.msg);
      }
    })
   } else {
    dispatch(setTableData(""));
   }
  }, [query])

  useEffect(() => {
    if (vtable.current) {
      vtable.current.updateOption({
        ...option,
        columns: getColumns(columns),
        // records: records,
      });
      // vtable.current.clearSelected();
      // if (!isEmpty(columns)) {
      //   const colCount = columns.length - 1;
      //   const rowCount = records.length;
      //   vtable.current.selectCells([{ start: { col: colCount, row: 0 }, end: { col: colCount, row: rowCount } }]);
      // }
    }
  }, [columns])

  useEffect(() => {
    func && getFuncResult({dimention, func, groupBy: compact(groupBy), query}, function(success: boolean, response: any) {
      if (success) {
        dispatch(setFuncResult(response));
      } else {
        message.error('获取列表数据失败：' + response.message || response.msg);
      }
    })
  }, [func, dimention, groupBy])
  
  const showFoot = !isEmpty(result)
  return (
    <div className='pdb-vtable' style={{ position: 'relative', paddingBottom: showFoot ? 48 : 0 }}>
      {
        isEmpty(columns) && (
          <div className="pdb-vtable-empty">
            <Empty
              image={getImgHref(EmptyImage)}
              imageStyle={{ height: 240, marginBottom: 0 }}
              description={
                <Space direction="vertical" size={4}>
                <Typography.Text >
                  暂无数据
                </Typography.Text>
                <Typography.Text type="secondary" style={{fontSize: 12}}>
                  查看、创建、编辑指标以展示数据
                </Typography.Text>
                </Space>
              }
            />
          </div>
        )
      }
      <div style={{ width: '100%', height: '100%' }}>
        <ListTable
          width={width}
          height={showFoot ? height - 48 : height}
          option={option}
          records={records}
          onReady={onReady}
          // onClickCell={onClickCell}
          onDropdownMenuClick={onDropdownMenuClick}
          onContextMenuCell={onContextMenuCell}
        />
      </div>
      {showFoot && (
        <div className='pdb-vtable-footer' style={{ position: 'absolute', height: 48 }}>
          <Space>
            <span>合计 | </span> 
            {
              result.map(item => (
                <span key={item.index}>{func} : {item[dimention]}</span>
              ))
            }
          </Space>
        </div>
      )}
    </div>
  )
}