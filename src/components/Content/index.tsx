import { ReactNode } from "react";
interface ContentProps {
  children: ReactNode // 面板自定义内容
}

export default function PdbContent({ children }: ContentProps) {
  return (
    <div className="pdb-content">{children}</div>
  );
}