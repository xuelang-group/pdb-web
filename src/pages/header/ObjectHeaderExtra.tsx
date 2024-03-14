import AppExplore from "@/pages/AppExplore";
import { useLocation } from "react-router";

export default function ObjectHeaderExtra() {
  const location = useLocation();

  return (
    <div className="pdb-header-object">
      {!location.pathname.endsWith("/template") && <AppExplore />}
    </div>
  )
}