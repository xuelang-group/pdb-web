import { ListTable, PivotTable, register } from '@visactor/react-vtable'
import { TYPES } from '@visactor/vtable'
import { useEffect, useRef, useState } from 'react'
import ICONS from './ICONS'

Object.keys(ICONS).forEach(name => {
  register.icon(name, {
    name: name,
    type: 'svg',
    marginRight: 5,
    positionType: TYPES.IconPosition.left,
    width: 18,
    height: 18,
    svg: ICONS[name],
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
    "Progress": 0.78
  }, {
    "Project Name": "Marketing",
    "Task Name": "Social Media Planning",
    "Assigned To": "Charlie",
    "Start Date": "2024/01/01",
    "Days Required": 22,
    "End Date": "2024/01/14",
    "Progress": 0.78
  }, {
    "Project Name": "Marketing",
    "Task Name": "Campaign Analysis",
    "Assigned To": "Daisy",
    "Start Date": "2024/01/01",
    "Days Required": 25,
    "End Date": "2024/01/14",
    "Progress": 0.78
  }, {
    "Project Name": "Product Dev",
    "Task Name": "Prototype Development",
    "Assigned To": "Ethan",
    "Start Date": "2024/01/01",
    "Days Required": 18,
    "End Date": "2024/01/14",
    "Progress": 0.78
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
    "Start Date": "2024/01/01",
    "Days Required": 25,
    "End Date": "2024/01/14",
    "Progress": 0.78
  }, {
    "Project Name": "Customer Svc",
    "Task Name": "Service Improvement",
    "Assigned To": "Hannah",
    "Start Date": "2024/01/01",
    "Days Required": 25,
    "End Date": "2024/01/14",
    "Progress": 0.78
  }, {
    "Project Name": "Customer Svc",
    "Task Name": "Ticket Resolution",
    "Assigned To": "lan",
    "Start Date": "2024/01/01",
    "Days Required": 22,
    "End Date": "2024/01/14",
    "Progress": 0.78
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
    "Progress": 0.78
  }, {
    "Project Name": "Financial",
    "Task Name": "Financial Reporting",
    "Assigned To": "Mark",
    "Start Date": "2024/01/01",
    "Days Required": 22,
    "End Date": "2024/01/14",
    "Progress": 0.78
  }, {
    "Project Name": "Financial",
    "Task Name": "Investment Planning",
    "Assigned To": "Sam",
    "Start Date": "2024/01/01",
    "Days Required": 21,
    "End Date": "2024/01/14",
    "Progress": 0.78
  }, {
    "Project Name": "Research",
    "Task Name": "Market Trends Analysis",
    "Assigned To": "Nathan",
    "Start Date": "2024/01/01",
    "Days Required": 25,
    "End Date": "2024/01/14",
    "Progress": 0.78
  }, {
    "Project Name": "Research",
    "Task Name": "Data Collection",
    "Assigned To": "Olivia",
    "Start Date": "2024/01/01",
    "Days Required": 23,
    "End Date": "2024/01/14",
    "Progress": 0.78
  }, {
    "Project Name": "Research",
    "Task Name": "Research Paper Writing",
    "Assigned To": "Peter",
    "Start Date": "2024/01/01",
    "Days Required": 32,
    "End Date": "2024/01/14",
    "Progress": 0.78
  }, {
    "Project Name": "Development",
    "Task Name": "Software Development",
    "Assigned To": "Quinn",
    "Start Date": "2024/01/01",
    "Days Required": 27,
    "End Date": "2024/01/14",
    "Progress": 0.78
  }, {
    "Project Name": "Development",
    "Task Name": "Feature Enhancement",
    "Assigned To": "Rachel",
    "Start Date": "2024/01/01",
    "Days Required": 36,
    "End Date": "2024/01/14",
    "Progress": 0.78
  }, {
    "Project Name": "Development",
    "Task Name": "Code Review",
    "Assigned To": "Sam",
    "Start Date": "2024/01/01",
    "Days Required": 30,
    "End Date": "2024/01/14",
    "Progress": 0.78
  }, {
    "Project Name": "Production",
    "Task Name": "Manufacturing",
    "Assigned To": "Tim",
    "Start Date": "2024/01/01",
    "Days Required": 47,
    "End Date": "2024/01/14",
    "Progress": 0.78
  }
]

const columns = [{
  "title": "单行文本",
  "field": "String",
  "columns":[{
    "field": "Project Name",
    "title": "Project Name",
    "dimensionKey": "Project Name",
    "mergeCell": true,
  }],
  "dimensionKey": "String",
  "headerStyle": {
    "bgColor": "#FFF",
  },
  "headerIcon": "String"
}, {
  "title": "单行文本",
  "field": "String",
  "columns":[{
    "field": "Task Name",
    "title": "Task Name",
    "dimensionKey": "Task Name",
  }],
  "dimensionKey": "String",
  "headerStyle": {
    "bgColor": "#FFF",
  },
  "headerIcon": "String"
}, {
  "title": "单行文本",
  "field": "String",
  "columns":[{
    "field": "Assigned To",
    "title": "Assigned to",
    "dimensionKey": "Assigned to",
  }],
  "dimensionKey": "String",
  "headerStyle": {
    "bgColor": "#FFF",
  },
  "headerIcon": "String"
}, {
  "title": "日期/时间",
  "field": "Date",
  "columns":[{
    "field": "Start Date",
    "title": "Start Date",
    "dimensionKey": "Start Date",
    "disableSelect": true,
    "disableHeaderSelect": true,
  }],
  // "disableSelect": true,
  // "disableHeaderSelect": true,
  "dimensionKey": "Date",
  "headerStyle": {
    "bgColor": "#FFF",
  },
  "headerIcon": "Date"
}, {
  "title": "整数",
  "field": "Int",
  "columns":[{
    "field": "Days Required",
    "title": "Days Required",
    "dimensionKey": "Days Required",
  }],
  "dimensionKey": "Int",
  "headerStyle": {
    "bgColor": "#FFF",
  },
  "headerIcon": "Number"
}, {
  "title": "日期/时间",
  "field": "Date",
  "columns":[{
    "field": "End Date",
    "title": "End Date",
    "dimensionKey": "End Date",
  }],
  "dimensionKey": "Date",
  "headerStyle": {
    "bgColor": "#FFF",
  },
  "headerIcon": "Date"
}, {
  "title": "浮点数",
  "field": "Float",
  "columns":[{
    "field": "Progress",
    "title": "Progress",
    "dimensionKey": "Progress",
    "fieldFormat": (record: { Progress: number; }) => `${Math.round(record.Progress * 100)}%`,
  }],
  "dimensionKey": "Float",
  "headerStyle": {
    "bgColor": "#FFF",
  },
  "headerIcon": "Number"
}]

export default function VTable() {

  const wrapRef = useRef(null);
  const [width, setWidth] = useState(1000)
  const [height, setHeight] = useState(500)

  const option = {
    // widthMode: "adaptive",
    autoFillWidth: true,
    rightFrozenColCount: 1,
    groupBy: "Project Name",
    defaultRowHeight: 46,
    theme: {
      // 冻结列效果
      frozenColumnLine: {
        shadow: {
          width: 4,
          startColor: 'rgba(00, 24, 47, 0.05)',
          endColor: 'rgba(00, 24, 47, 0)'
        }
      },
      headerStyle: {
        bgColor: "#F9FBFC",
        // textBaseline: "middle",
        color: '#1C2126',
        fontSize: 14,
        fontWeight: 600,
        borderColor: '#DCDEE1',
      },
      bodyStyle: {
        color: '#4C5A67',
        fontSize: 14,
        // lineHeight: 22,
        // textBaseline: "middle",
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
        // textAlign: 'right'
      },
      scrollStyle: {
        // visible: 'always',
        scrollSliderColor: 'rgba(0,0,0,0.2)',
        // scrollRailColor: '#bac3cc',
        // hoverOn: false,
        // barToSide: true
      },
      selectionStyle: {
        cellBgColor: 'rgba(139, 211, 255, 0.1)',
        cellBorderColor: '#8BD3FF',
        cellBorderLineWidth: 1,
      }
    },
    records: data,
    columns: columns,
  }

  const onReady = (tableInstance: any, isFirst: Boolean) => {
    console.log('has ready')
  }

  const updateSize = () => {
    const wrapper: any = wrapRef.current;
    console.log(wrapper.offsetWidth, wrapper.offsetHeight)
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