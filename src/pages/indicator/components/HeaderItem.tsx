import { Group, Text, Tag, Line } from '@visactor/react-vtable';

interface HeaderProps {
  showTag: boolean;
  [key:string]: any;
}

const HeaderItem = (props: HeaderProps) => {
  const { table, row, col, rect, text } = props
  if (!table || row === undefined || col === undefined) {
    return null;
  }
  const { height, width } = rect || table.getCellRect(col, row);
  // const record = table.getRecordByRowCol(col, row);
  console.log('props: ', props)
  return (
    <Group
      attribute={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Group
        attribute={{
          width,
          height: height / 2,
        }}
      >
        <Text attribute={{ text: 'xxx'}}></Text>
        <Tag
          textStyle={{
            fontSize: 12,
            fontFamily: 'PingFang SC',
            fill: '#0084FF'
          }}
          panelStyle={{
            visible: true,
            fill: '#E8F8FF',
            lineWidth: 1,
            cornerRadius: 1
          }}
          padding={[2, 8]}
        >度量</Tag>
      </Group>
      <Group
        attribute={{
          width,
          height: height / 2,
        }}
      >
        <Text
          attribute={{
            text: text,
            fontSize: 14,
            fontFamily: 'PingFang SC',
            fill: '#6f7070',
            textAlign: 'left',
            textBaseline: 'middle'
          }}
        ></Text>
      </Group>
    </Group>
  )
}

export default HeaderItem;
