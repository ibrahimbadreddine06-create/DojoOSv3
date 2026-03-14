import ComingSoon, { lockedModules } from "./coming-soon";

export default function Possessions() {
  return (
    <ComingSoon
      moduleName={lockedModules.possessions.name}
      description={lockedModules.possessions.description}
    />
  );
}
