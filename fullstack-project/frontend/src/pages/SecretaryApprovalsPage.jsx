import { ModulePage } from "./ChairmanDashboard";

const approvalsItem = {
  key: "pending-chairman-tasks",
  label: "Approvals",
  path: "/secretary/approvals",
};

export default function SecretaryApprovalsPage() {
  return <ModulePage item={approvalsItem} />;
}
