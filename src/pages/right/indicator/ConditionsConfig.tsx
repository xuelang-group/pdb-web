import { ColumnConfig } from "@/reducers/indicatorAdvance";
import { Empty, Modal } from "antd";
import { isEmpty } from "lodash";

interface ConditionConfigProps {
  visible: boolean;
  column?: ColumnConfig;
  onCancel: Function;
  onSave: Function;
}

export default function ConditionsConfigModal({visible, column, onCancel, onSave}: ConditionConfigProps) {
  
  
  const renderConditionsConfig = () => {
    if (!column || isEmpty(column.conditions)) {
      return <Empty />
    }
    const { id, name, conditions } = column
    // return map(conditions, (condition: ConditionState, index) => {
    //   return (
    //     <Fragment key={index}>
    //       <Card
    //         size="small"
    //         extra={getExtra(index, opt)}
    //         title={getConditionRaw(condition, name)}
    //         className={activePanelKey[0] !== index ? "no-body-card" : ""}
    //       >
    //         {activePanelKey[0] === index ? renderPanelChildren() : null}
    //       </Card>
    //     </Fragment>
    //   )
    // })
  }
  
  return (
    <Modal title="设置过滤条件" open={visible} onCancel={() => onCancel()}>
      { renderConditionsConfig() }
    </Modal>
  )
}