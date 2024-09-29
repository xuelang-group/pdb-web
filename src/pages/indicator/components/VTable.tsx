import { ListTable, PivotTable } from '@visactor/react-vtable'
import { useEffect, useRef, useState } from 'react'

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
  }, , {
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
  "field": "Project Name",
  "title": "Project Name",
  "dimensionKey": "Project Name",
  "mergeCell": true,
  "style": {
    // "textStick": true,
    "textAlign": "center"
  }
  // "type": "String",
}, {
  "field": "Task Name",
  "title": "Task Name",
  "dimensionKey": "Task Name",
  // "type": "String",
}, {
  "field": "Assigned To",
  "title": "Assigned to",
  "dimensionKey": "Assigned to",
  // "type": "String",
}, {
  "field": "Start Date",
  "title": "Start Date",
  "dimensionKey": "Start Date",
  "style": {
    // "textStick": true,
    "textAlign": "right"
  }
  // "type": "Date",
}, {
  "field": "Days Required",
  "title": "Days Required",
  "dimensionKey": "Days Required",
  "style": {
    // "textStick": true,
    "textAlign": "right"
  }
  // "type": "Int",
}, {
  "field": "End Date",
  "title": "End Date",
  "dimensionKey": "End Date",
  "style": {
    // "textStick": true,
    "textAlign": "right"
  }
  // "type": "Date",
}, {
  "field": "Progress",
  "title": "Progress",
  "dimensionKey": "Progress",
  "style": {
    // "textStick": true,
    "textAlign": "right"
  }
  // "type": "Float",
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
    defaultRowHeight: 48,
    theme: {
      // cellInnerBorder: false,
      // 冻结列效果
      frozenColumnLine: {
        shadow: {
          width: 4,
          startColor: 'rgba(00, 24, 47, 0.05)',
          endColor: 'rgba(00, 24, 47, 0)'
        }
      },
      headerStyle: {
        color: '#1C2126',
        fontSize: 14,
        fontWeight: 600,
        borderColor: '#DCDEE1',
      },
      bodyStyle: {
        color: '#4C5A67',
        fontSize: 14,
        // lineHeight: 22,
        borderColor: '#DCDEE1',
        padding: [12, 15],
        autoWrapText: true,
        select: {
          inlineRowBgColor: '#F1F8FF',
          inlineColumnBgColor: '#F1F8FF'
        }
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