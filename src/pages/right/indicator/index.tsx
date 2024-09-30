import PdbPanel from "@/components/Panel";

export default function Right(props: any) {
  return (
    <div className='pdb-right-panel'>
      <PdbPanel className='pdb-indicator-left' title='指标配置' direction='right' canCollapsed={true}>
      </PdbPanel>
    </div>
  )
}