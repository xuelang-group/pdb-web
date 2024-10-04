import { ListTable, PivotTable, register, Group, Text, Tag } from '@visactor/react-vtable'
import { TYPES } from '@visactor/vtable'
import { useEffect, useRef, useState } from 'react'
import {ICONS, getIconSvg, DLSVG, getColumns} from './CONSTS'

ICONS.forEach(name => {
  register.icon(name, {
    name: name,
    type: 'svg',
    marginRight: 4,
    positionType: TYPES.IconPosition.left,
    width: 18,
    height: 18,
    svg: getIconSvg(name),
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
// 度量列标签ICON
register.icon('DLTAG', {
  name: 'DLTAG',
  type: 'svg',
  marginLeft: 4,
  positionType: TYPES.IconPosition.right,
  width: 52,
  height: 24,
  svg: DLSVG,
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
  }
]

const columns = [{
  "field": "Project Name",
  "type": "string"
}, {
  "field": "Task Name",
  "type": "string"
}, {
  "field": "Assigned to",
  "type": "string"
}, {
  "field": "Start Date",
  "type": "datetime"
}, {
  "field": "Days Required",
  "type": "int"
}, {
  "field": "End Date",
  "type": "datetime"
}, {
  "field": "Progress",
  "type": "float"
}]

export default function VTable() {

  const wrapRef = useRef(null);
  const [width, setWidth] = useState(1000)
  const [height, setHeight] = useState(500)

  const option = {
    autoFillWidth: true,
    rightFrozenColCount: 1,
    // groupBy: ["Project Name", "Start Date"],
    defaultRowHeight: 46,
    defaultColWidth: 180,
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
      groupTitleStyle: {
        color: '#1C2126',
        borderColor: '#DCDEE1',
      },
      scrollStyle: {
        scrollSliderColor: 'rgba(0,0,0,0.2)',
      },
      selectionStyle: {
        cellBgColor: 'rgba(139, 211, 255, 0.1)',
        cellBorderColor: '#8BD3FF',
        cellBorderLineWidth: 1,
      },
      bottomFrozenStyle: {
        fontFamily: 'PingFang SC',
        fontWeight: 600,
        // borderLineWidth: [1, 0, 1, 0],
        color: 'green'
      }
    },
    records: data,
    columns: getColumns(columns),
    bottomFrozenRowCount: 1,
    aggregation(args: {col: number, field: string}) {
      if (args.field === "Progress") {
        return {
          aggregationType: TYPES.AggregationType.AVG,
          formatFun(value: number, col: any, row: any, table: { recordsCount: string }) {
            // console.log('value: ', value)
            // console.log('col: ', col)
            // console.log('row: ', row)
            // console.log('table: ', table)
            return '合计:' + value;
          }
        };
      }
      return null;
    }
  }

  const onReady = (tableInstance: any, isFirst: Boolean) => {
    console.log('has ready')
  }

  const updateSize = () => {
    const wrapper: any = wrapRef.current;
    // console.log(wrapper.offsetWidth, wrapper.offsetHeight)
    if (!wrapper || !wrapper.offsetWidth || !wrapper.offsetHeight) return
    setWidth(wrapper.offsetWidth)
    setHeight(wrapper.offsetHeight)
  }

  useEffect(() => {
    updateSize()
  }, [])

  return (
    <div ref={wrapRef} style={{height: '100%'}}>
      <ListTable
        width={width}
        height={height}
        option={option}
        onReady={onReady}
      />
    </div>
  )
}