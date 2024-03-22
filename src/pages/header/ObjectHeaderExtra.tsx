import { useLocation } from "react-router";
import AppExplore from "@/pages/AppExplore";

export default function ObjectHeaderExtra() {
  const location = useLocation();

  return (
    <div className="pdb-header-object">
      {!location.pathname.endsWith("/template") && <AppExplore />}
    </div>
  )
}