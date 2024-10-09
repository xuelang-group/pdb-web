import { ListTable, register, Group, Text, Tag, ListColumn } from '@visactor/react-vtable'
import { TYPES, CustomLayout } from '@visactor/vtable'
import { useEffect, useRef, useState } from 'react'
import { ICONS, Col, getColumns, getIconSvg } from './CONSTS'

Object.keys(ICONS).forEach(name => {
  register.icon(name, {
    name: name,
    type: 'svg',
    marginRight: 4,
    positionType: TYPES.IconPosition.left,
    width: 18,
    height: 18,
    svg: getIconSvg(name),
    hover: {
      // 热区大小
      width: 26,
      height: 26,
      bgColor: 'rgba(22,44,66,0.1)'
    },
    tooltip: {
      style: {
        arrowMark: false,
        padding: [2, 4],
        bgColor: 'rgba(0,0,0,0.4)',
        color: 'white',
        fontSize: 12
      },
      // 气泡框，按钮的的解释信息
      title: ICONS[name],
      placement: TYPES.Placement.left
    },
    cursor: 'pointer'
  })
  register.icon(`${name}Disabled`, {
    name: `${name}Disabled`,
    type: 'svg',
    marginRight: 4,
    positionType: TYPES.IconPosition.left,
    width: 18,
    height: 18,
    svg: getIconSvg(name, true),
  })
})

const data = [
  {
    "Project Name": "Marketing",
    "Task Name": "Market Research",
    "Assigned To": "Alice",
    "Start Date": "2024/01/01",
    "Days Required": 13,
    "End Date": "2024/01/14",
    "Progress": 0.78
  }, {
    "Project Name": "Marketing",
    "Task Name": "Content Creation",
    "Assigned To": "Bob",
    "Start Date": "2024/01/01",
    "Days Required": 14,
    "End Date": "2024/01/14",
    "Progress": 0.68
  }, {
    "Project Name": "Marketing",
    "Task Name": "Social Media Planning",
    "Assigned To": "Charlie",
    "Start Date": "2024/01/03",
    "Days Required": 22,
    "End Date": "2024/01/14",
    "Progress": 0.58
  }, {
    "Project Name": "Marketing",
    "Task Name": "Campaign Analysis",
    "Assigned To": "Daisy",
    "Start Date": "2024/01/03",
    "Days Required": 25,
    "End Date": "2024/01/14",
    "Progress": 0.48
  }, {
    "Project Name": "Product Dev",
    "Task Name": "Prototype Development",
    "Assigned To": "Ethan",
    "Start Date": "2024/01/01",
    "Days Required": 18,
    "End Date": "2024/01/14",
    "Progress": 0.38
  }, {
    "Project Name": "Product Dev",
    "Task Name": "Quality Assurance",
    "Assigned To": "Fiona",
    "Start Date": "2024/01/01",
    "Days Required": 10,
    "End Date": "2024/01/14",
    "Progress": 0.78
  }, {
    "Project Name": "Product Dev",
    "Task Name": "User Interface Design",
    "Assigned To": "Gabriel",
    "Start Date": "2024/01/04",
    "Days Required": 25,
    "End Date": "2024/01/14",
    "Progress": 0.28
  }, {
    "Project Name": "Customer Svc",
    "Task Name": "Service Improvement",
    "Assigned To": "Hannah",
    "Start Date": "2024/01/04",
    "Days Required": 25,
    "End Date": "2024/01/14",
    "Progress": 0.18
  }, {
    "Project Name": "Customer Svc",
    "Task Name": "Ticket Resolution",
    "Assigned To": "lan",
    "Start Date": "2024/01/01",
    "Days Required": 22,
    "End Date": "2024/01/14",
    "Progress": 0.08
  }, {
    "Project Name": "Customer Svc",
    "Task Name": "Customer Feedback",
    "Assigned To": "Julia",
    "Start Date": "2024/01/01",
    "Days Required": 25,
    "End Date": "2024/01/14",
    "Progress": 0.78
  }, {
    "Project Name": "Financial",
    "Task Name": "Budget Analysis",
    "Assigned To": "Kevin",
    "Start Date": "2024/01/01",
    "Days Required": 30,
    "End Date": "2024/01/14",
    "Progress": 0.68
  }, {
    "Project Name": "Financial",
    "Task Name": "Financial Reporting",
    "Assigned To": "Mark",
    "Start Date": "2024/01/01",
    "Days Required": 22,
    "End Date": "2024/01/14",
    "Progress": 0.58
  }, {
    "Project Name": "Financial",
    "Task Name": "Investment Planning",
    "Assigned To": "Sam",
    "Start Date": "2024/01/01",
    "Days Required": 21,
    "End Date": "2024/01/14",
    "Progress": 0.48
  }, {
    "Project Name": "Research",
    "Task Name": "Market Trends Analysis",
    "Assigned To": "Nathan",
    "Start Date": "2024/01/01",
    "Days Required": 25,
    "End Date": "2024/01/14",
    "Progress": 0.38
  }, {
    "Project Name": "Research",
    "Task Name": "Data Collection",
    "Assigned To": "Olivia",
    "Start Date": "2024/01/01",
    "Days Required": 23,
    "End Date": "2024/01/14",
    "Progress": 0.28
  }, {
    "Project Name": "Research",
    "Task Name": "Research Paper Writing",
    "Assigned To": "Peter",
    "Start Date": "2024/01/01",
    "Days Required": 32,
    "End Date": "2024/01/14",
    "Progress": 0.18
  }, {
    "Project Name": "Development",
    "Task Name": "Software Development",
    "Assigned To": "Quinn",
    "Start Date": "2024/01/01",
    "Days Required": 27,
    "End Date": "2024/01/14",
    "Progress": 0.08
  }, {
    "Project Name": "Development",
    "Task Name": "Feature Enhancement",
    "Assigned To": "Rachel",
    "Start Date": "2024/01/01",
    "Days Required": 36,
    "End Date": "2024/01/14",
    "Progress": 0.88
  }, {
    "Project Name": "Development",
    "Task Name": "Code Review",
    "Assigned To": "Sam",
    "Start Date": "2024/01/01",
    "Days Required": 30,
    "End Date": "2024/01/14",
    "Progress": 0.98
  }, {
    "Project Name": "Production",
    "Task Name": "Manufacturing",
    "Assigned To": "Tim",
    "Start Date": "2024/01/01",
    "Days Required": 47,
    "End Date": "2024/01/14",
    "Progress": 0.01
  }, {
    "Project Name": "Production",
    "Task Name": "Manu facture",
    "Assigned To": "Tim Smith",
    "Start Date": "2024/01/01",
    "Days Required": 47,
    "End Date": "2024/01/14",
    "Progress": 0.01
  }, {
    "Project Name": "Marketing",
    "Start Date": "2024/01/01",
    "Algo": "avg",
    "Progress": 0.58
  }, {
    "Project Name": "Product Dev",
    "Algo": "avg",
    "Progress": 0.98
  }
]

const columns: Col[] = [{
  "field": "Project Name",
  "type": "string",
  "mergeCell": true,
}, {
  "field": "Start Date",
  "type": "datetime",
  "mergeCell": true,
}, {
  "field": "Task Name",
  "type": "string"
}, {
  "field": "Assigned To",
  "type": "string",
  "disabled": true
}, {
  "field": "Days Required",
  "type": "int"
}, {
  "field": "End Date",
  "type": "datetime"
}, {
  "field": "Progress",
  "type": "float",
  "checked": true,
  "fieldFormat": (record: { Progress: number; }) => `${Math.round(record.Progress * 100)}%`,
}]

export default function VTable() {

  const tableInstance = useRef(null);
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(1000)
  const [height, setHeight] = useState(500)

  const option = {
    autoFillWidth: true,
    autoWrapText: true,
    // frozenColCount: 1,
    rightFrozenColCount: 1,
    // bottomFrozenRowCount: 1, 
    groupBy: "Project Name",
    // groupBy: ["Project Name", "Start Date"],
    defaultRowHeight: 46,
    defaultColWidth: 180,
    // defaultHeaderRowHeight: 92,
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
      // bottomFrozenStyle: {
      //   fontFamily: 'PingFang SC',
      //   fontWeight: 600,
      //   borderLineWidth: [1, 0, 1, 0],
      //   color: 'green',
      //   // textAlign: 'right',
      //   bgColor: '#FFF'
      // },
    },
    records: data,
    columns: getColumns(columns),
    customMergeCell: (col: any, row: any, table: any) => {
      // console.log('table: ', table)
      if (col >= 0 && row == 6) {
        return {
          text: 'merge text',
          range: {
            start: {
              col: 0,
              row: 6
            },
            end: {
              col: table.colCount - 1,
              row: 6
            }
          },
        };
      }
    },
    groupTitleCustomLayout: (args: TYPES.CustomRenderFunctionArg) => {
      const { table, row, col, rect } = args;
      const record = table.getCellOriginRecord(col, row);
      const { height, width } = rect ?? table.getCellRect(col, row);
      const container = new CustomLayout.Group({
        height,
        width,
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        alignItems: 'center',
        justifyContent: 'flex-end',
      });
      const count = record.children.map((item: { Progress: any }) => item.Progress).reduce((prev: any, curr: any) => prev + curr)
      const info = new CustomLayout.Text({
        text: `小计 | avgs: ${count}`,
        fontSize: 14,
        // fontWeight: 600,
        textAlign: 'right',
        marginRight: 16
      });
      container.add(info);
      return {
        rootContainer: container,
        renderDefault: true
      };
    },
    menu: {
      defaultHeaderMenuItems: [{
        text:'不使用',
        // type: 'item',
        menuKey: 'enable'
      }]
    }
    // aggregation(args: {col: number, field: string}) {
    //   if (args.field === "Progress") {
    //     return {
    //       aggregationType: TYPES.AggregationType.AVG,
    //       // showOnTop: true,
    //       formatFun(value: number, col: any, row: any, table: { recordsCount: string }) {
    //         return '合计:' + Math.round(value * 100) + '%';
    //       }
    //     };
    //   }
    //   return null;
    // }
  }

  const onReady = (tableInstance: any, isFirst: Boolean) => {
    const { rowCount, colCount } = tableInstance
    // console.log('has ready：', rowCount, colCount)
    // tableInstance.clearSelected();
    tableInstance.selectCells([{start: {col: colCount, row: 0}, end: {col: colCount, row: rowCount}}]);
    tableInstance.on('dropdown_menu_click', (args: any) => {
      console.log('dropdown_menu_click', args);
      if (args.menuKey === 'enable') {
        // copyData = tableInstance.getCopyValue();
      }
    });
    // tableInstance.on('mousemove_cell', (args: any) => {
    //   const { x, y, col, row, targetIcon } = args;
    //   console.log('mousemove_cell', args)
    //   if (!row) {
    //     const rect = tableInstance.getCellRect(col, row)
    //       tableInstance.showTooltip(col, row, {
    //         content: '数据类型：' + tableInstance.getCellValue(col, row),
    //         position: {x: x - 24, y: y - 32},
    //         // referencePosition: { rect, placement: TYPES.Placement.bottom }, //TODO
    //         style: {
    //           bgColor: 'black',
    //           color: 'white',
    //           font: 'normal bold normal 14px/1 STKaiti',
    //           padding: [4, 8],
    //           // arrowMark: true
    //         }
    //       });
    //     // }
    //   }
    // })
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

  return (
    <div className='pdb-vtable' style={{position: 'relative', paddingBottom: 48}}>
      <div ref={wrapRef} style={{ height: '100%' }}>
        <ListTable
          ref={tableInstance}
          width={width}
          height={height}
          option={option}
          onReady={onReady}
        />
      </div>
      <div className='pdb-vtable-footer' style={{position: 'absolute', height: 48}}>

      </div>
    </div>
  )
}