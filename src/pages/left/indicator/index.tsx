import PdbPanel from "@/components/Panel";

export default function Left(props: any) {
  return (
    <PdbPanel className='pdb-indicator-left' title='指标列表' direction='left' canCollapsed={true}>
    </PdbPanel>
  )
}