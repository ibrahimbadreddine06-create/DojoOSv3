import ComingSoon from "./coming-soon";
import { DollarSign } from "lucide-react";

export default function Finances() {
  return (
    <ComingSoon
      moduleName="Finances"
      description="Monitor your income, expenses, and savings to achieve financial freedom."
      icon={<DollarSign className="h-10 w-10 text-muted-foreground" />}
    />
  );
}
