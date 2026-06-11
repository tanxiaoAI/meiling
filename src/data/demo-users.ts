import { getDefaultOpenCodeAppUrl, getDefaultOpenCodeUrl, getPortalUsersFromEnv, type PortalUserSeed } from "@/lib/env";

const fallbackUsers: PortalUserSeed[] = [
  {
    email: "demo@aimedia.local",
    password: "Demo123456",
    tenantId: "c001",
    tenantName: "演示租户",
    displayName: "演示客户",
    role: "owner",
    methodologyPackKey: "base",
    methodologyPackName: "基础包",
    methodologyPackVersion: "v1",
    opencodeUrl: getDefaultOpenCodeUrl(),
    opencodeAppUrl: getDefaultOpenCodeAppUrl(),
  },
  {
    email: "operator@aimedia.local",
    password: "Operator123456",
    tenantId: "ops",
    tenantName: "运营后台",
    displayName: "运营管理员",
    role: "operator",
    methodologyPackKey: "education",
    methodologyPackName: "教培行业定制包",
    methodologyPackVersion: "v1",
    opencodeUrl: getDefaultOpenCodeUrl(),
    opencodeAppUrl: getDefaultOpenCodeAppUrl(),
  },
];

export function getPortalUsers(): PortalUserSeed[] {
  return getPortalUsersFromEnv() || fallbackUsers;
}
